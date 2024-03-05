import argparse

import hail as hl
import pandas as pd
import requests

import os

CONSEQUENCE_TERMS = [
    "transcript_ablation",
    "splice_acceptor_variant",
    "splice_donor_variant",
    "stop_gained",
    "frameshift_variant",
    "stop_lost",
    "start_lost",  # new in v81
    "initiator_codon_variant",  # deprecated
    "transcript_amplification",
    "inframe_insertion",
    "inframe_deletion",
    "missense_variant",
    "protein_altering_variant",  # new in v79
    "splice_donor_5th_base_variant",
    "splice_region_variant",
    "splice_donor_region_variant",
    "splice_polypyrimidine_tract_variant",
    "incomplete_terminal_codon_variant",
    "start_retained_variant",
    "stop_retained_variant",
    "synonymous_variant",
    "coding_sequence_variant",
    "mature_miRNA_variant",
    "5_prime_UTR_variant",
    "3_prime_UTR_variant",
    "non_coding_transcript_exon_variant",
    "non_coding_exon_variant",  # deprecated
    "intron_variant",
    "NMD_transcript_variant",
    "non_coding_transcript_variant",
    "nc_transcript_variant",  # deprecated
    "upstream_gene_variant",
    "downstream_gene_variant",
    "TFBS_ablation",
    "TFBS_amplification",
    "TF_binding_site_variant",
    "regulatory_region_ablation",
    "regulatory_region_amplification",
    "feature_elongation",
    "regulatory_region_variant",
    "feature_truncation",
    "intergenic_variant",
]

# Maps each consequence term to its rank in the list
CONSEQUENCE_TERM_RANK = hl.dict({term: rank for rank, term in enumerate(CONSEQUENCE_TERMS)})


PLOF_CONSEQUENCE_TERMS = hl.set(
    [
        "transcript_ablation",
        "splice_acceptor_variant",
        "splice_donor_variant",
        "stop_gained",
        "frameshift_variant",
    ]
)


def load_gnomad_v2_variants():
    exomes = hl.read_table(
        "gs://gcp-public-data--gnomad/release/2.1.1/ht/exomes/gnomad.exomes.r2.1.1.sites.ht"
    )
    exomes = exomes.select(exome=exomes.row_value)

    genomes = hl.read_table(
        "gs://gcp-public-data--gnomad/release/2.1.1/ht/genomes/gnomad.genomes.r2.1.1.sites.ht"
    )
    genomes = genomes.select(genome=genomes.row_value)

    exomes = exomes.select_globals()
    genomes = genomes.select_globals()
    ds = exomes.join(genomes, how="outer")
    ds = ds.annotate(vep=hl.or_else(ds.exome.vep, ds.genome.vep))
    ds = ds.annotate(exome=ds.exome.drop("vep"), genome=ds.genome.drop("vep"))

    return ds


def load_gnomad_v4_variants():
    exomes = hl.read_table(
        "gs://gcp-public-data--gnomad/release/4.0/ht/exomes/gnomad.exomes.v4.0.sites.ht"
    )
    exomes = exomes.select(exome=exomes.row_value)

    genomes = hl.read_table(
        "gs://gcp-public-data--gnomad/release/4.0/ht/genomes/gnomad.genomes.v4.0.sites.ht/"
    )
    genomes = genomes.select(genome=genomes.row_value)

    exomes = exomes.select_globals()
    genomes = genomes.select_globals()
    ds = exomes.join(genomes, how="outer")
    ds = ds.annotate(vep=hl.or_else(ds.exome.vep, ds.genome.vep))
    ds = ds.annotate(exome=ds.exome.drop("vep"), genome=ds.genome.drop("vep"))

    return ds


def annotate_gnomad_v4_variants_with_liftover(ds):
    rg37 = hl.get_reference("GRCh37")
    rg38 = hl.get_reference("GRCh38")
    rg38.add_liftover("gs://hail-common/references/grch38_to_grch37.over.chain.gz", rg37)

    ds = ds.annotate(liftover_variant_id=variant_id(hl.liftover(ds.locus, "GRCh37"), ds.alleles))
    return ds


def fetch_gene(gene_id, reference_genome):
    query = """
    query Gene($gene_id: String!, $reference_genome: ReferenceGenomeId!) {
        gene(gene_id: $gene_id, reference_genome: $reference_genome) {
            chrom
            start
            stop
        }
    }
    """

    variables = {
        "gene_id": gene_id,
        "reference_genome": reference_genome,
    }

    headers = {"content-type": "application/json"}
    response = requests.post(
        "https://gnomad.broadinstitute.org/api",
        json={"query": query, "variables": variables},
        headers=headers,
    ).json()

    if "errors" in response:
        raise Exception(f"Failed to fetch gene ({', '.join(response['errors'])})")

    return response["data"]["gene"]


def variant_id(locus, alleles):
    return (
        locus.contig.replace("^chr", "")
        + "-"
        + hl.str(locus.position)
        + "-"
        + alleles[0]
        + "-"
        + alleles[1]
    )


def liftover_variant_id(exome_liftover_id, genome_liftover_id, alleles):
    return variant_id(
        hl.if_else(
            hl.is_missing(exome_liftover_id),
            genome_liftover_id,
            exome_liftover_id,
        ),
        alleles,
    )


def add(a, b):
    return hl.or_else(a, 0) + hl.or_else(b, 0)


SUPPORTED_GNOMAD_VERSIONS = (2, 4)


def get_gnomad_lof_variants(
    gnomad_version,
    gene_ids,
    include_low_confidence=False,
    remove_singletons=False,
):
    if gnomad_version not in SUPPORTED_GNOMAD_VERSIONS:
        raise Exception(f"Invalid gnomAD version {gnomad_version}")

    if gnomad_version == 2:
        ds = load_gnomad_v2_variants()
    elif gnomad_version == 4:
        ds = load_gnomad_v4_variants()

    reference_genome = "GRCh37" if gnomad_version == 2 else "GRCh38"
    genes = [fetch_gene(gene_id, reference_genome) for gene_id in gene_ids]

    chrom_prefix = "chr" if reference_genome == "GRCh38" else ""

    ds = hl.filter_intervals(
        ds,
        [
            hl.parse_locus_interval(
                f"{chrom_prefix}{gene['chrom']}:{gene['start']}-{gene['stop']}",
                reference_genome=reference_genome,
            )
            for gene in genes
        ],
    )

    gene_ids = hl.set(gene_ids)

    if gnomad_version == 4:
        ds = annotate_gnomad_v4_variants_with_liftover(ds)

    # Filter to variants which have pLoF consequences in the selected genes.
    ds = ds.annotate(
        lof_consequences=ds.vep.transcript_consequences.filter(
            lambda csq: (
                gene_ids.contains(csq.gene_id)
                & csq.consequence_terms.any(lambda term: PLOF_CONSEQUENCE_TERMS.contains(term))
                & (include_low_confidence | (csq.lof == "HC"))
            )
        )
    )

    ds = ds.filter(hl.len(ds.lof_consequences) > 0)

    # Filter to variants that passed QC filters in at least one of exomes/genomes
    ds = ds.filter((hl.len(ds.exome.filters) == 0) | (hl.len(ds.genome.filters) == 0))

    # Format for LoF curation portal
    ds = ds.select(
        reference_genome="GRCh37" if gnomad_version == 2 else "GRCh38",
        variant_id=variant_id(ds.locus, ds.alleles),
        liftover_variant_id=hl.if_else(
            hl.bool(gnomad_version == 4),
            ds.liftover_variant_id,
            hl.missing(hl.tstr),
        ),
        qc_filter=hl.delimit(
            hl.array(ds.exome.filters)
            .map(lambda f: f + " (exomes)")
            .extend(hl.array(ds.genome.filters).map(lambda f: f + " (genomes)")),
            ", ",
        ),
        AC=add(ds.exome.freq[0].AC, ds.genome.freq[0].AC),
        AN=add(ds.exome.freq[0].AN, ds.genome.freq[0].AN),
        n_homozygotes=add(ds.exome.freq[0].homozygote_count, ds.genome.freq[0].homozygote_count),
        annotations=ds.lof_consequences.map(
            lambda csq: csq.select(
                "gene_id",
                "gene_symbol",
                "transcript_id",
                consequence=hl.sorted(csq.consequence_terms, lambda t: CONSEQUENCE_TERM_RANK[t])[0],
                loftee=csq.lof,
                loftee_flags=csq.lof_flags,
                loftee_filter=csq.lof_filter,
            )
        ),
    )

    ds = ds.annotate(
        qc_filter=hl.if_else(ds.qc_filter == "", "PASS", ds.qc_filter),
        AF=hl.if_else(ds.AN == 0, 0, ds.AC / ds.AN),
    )

    if remove_singletons:
        ds = ds.filter(ds.AC == 1, keep=False)

    return ds


def open_file(path, mode="r"):
    if path.startswith("gs://"):
        return hl.hadoop_open(path, mode)
    else:
        return open(path, mode)


def annotate_list_of_variants(gnomad_version, variants_csv_file):
    reference_genome = "GRCh37" if gnomad_version == 2 else "GRCh38"
    prefix = "" if reference_genome == "GRCh37" else "chr"

    # use pandas to get intial data and efficiently create a hailtable from it
    df = pd.read_csv(variants_csv_file, names=["variant_id"])
    df["reference_genome"] = reference_genome
    df["contig"] = df["variant_id"].apply(lambda id: f"{prefix}{id.split('-')[0]}")
    df["position"] = df["variant_id"].apply(lambda id: int(id.split("-")[1]))
    df["alleles"] = df["variant_id"].apply(lambda id: [id.split("-")[2], id.split("-")[3]])

    ds = hl.Table.from_pandas(df)
    ds = ds.annotate(locus=hl.locus(ds.contig, ds.position, reference_genome=reference_genome))
    ds = ds.key_by("locus", "alleles")

    if gnomad_version == 4:
        ds = annotate_gnomad_v4_variants_with_liftover(ds)

    if gnomad_version == 2:
        gnomad = load_gnomad_v2_variants()
    elif gnomad_version == 4:
        gnomad = load_gnomad_v4_variants()
    ds = ds.annotate(
        **gnomad[ds.locus, ds.alleles].select(
            "exome",
            "genome",
            "vep",
        )
    )

    # Filter to variants which have pLoF consequences in the selected genes.
    ds = ds.annotate(
        lof_consequences=ds.vep.transcript_consequences.filter(
            lambda csq: (
                csq.consequence_terms.any(lambda term: PLOF_CONSEQUENCE_TERMS.contains(term))
                & (csq.lof == "HC")
            )
        )
    )

    ds = ds.select(
        reference_genome=ds.reference_genome,
        variant_id=ds.variant_id,
        liftover_variant_id=ds.liftover_variant_id,
        qc_filter=hl.delimit(
            hl.array(ds.exome.filters)
            .map(lambda f: f + " (exomes)")
            .extend(hl.array(ds.genome.filters).map(lambda f: f + " (genomes)")),
            ", ",
        ),
        AC=add(ds.exome.freq[0].AC, ds.genome.freq[0].AC),
        AN=add(ds.exome.freq[0].AN, ds.genome.freq[0].AN),
        n_homozygotes=add(ds.exome.freq[0].homozygote_count, ds.genome.freq[0].homozygote_count),
        annotations=ds.lof_consequences.map(
            lambda csq: csq.select(
                "gene_id",
                "gene_symbol",
                "transcript_id",
                consequence=hl.sorted(csq.consequence_terms, lambda t: CONSEQUENCE_TERM_RANK[t])[0],
                loftee=csq.lof,
                loftee_flags=csq.lof_flags,
                loftee_filter=csq.lof_filter,
            )
        ),
    )

    ds = ds.annotate(
        qc_filter=hl.if_else(ds.qc_filter == "", "PASS", ds.qc_filter),
        AF=hl.if_else(ds.AN == 0, 0, ds.AC / ds.AN),
    )

    return ds


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Get gnomAD pLoF variants in selected genes.")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--gene-ids", nargs="+", metavar="GENE", help="Ensembl IDs of genes")
    group.add_argument("--genes-file", help="path to file containing list of Ensembl IDs of genes")
    group.add_argument(
        "--variants-file", help="path to file containing list of gnomAD IDs of variants"
    )
    parser.add_argument(
        "--gnomad-version",
        type=int,
        choices=SUPPORTED_GNOMAD_VERSIONS,
        default=4,
        help="gnomAD dataset to get variants from (defaults to %(default)s)",
    )
    parser.add_argument(
        "--include-low-confidence",
        action="store_true",
        help="Include variants marked low-confidence by LOFTEE",
    )
    parser.add_argument(
        "--remove-singletons",
        action="store_true",
        help="Include variants marked low-confidence by LOFTEE",
    )
    parser.add_argument("--output", required=True, help="destination for variants file")
    args = parser.parse_args()

    if args.gene_ids or args.genes_file:
        if args.gene_ids:
            genes = args.gene_ids
        elif args.genes_file:
            with open_file(args.genes_file) as f:
                genes = [l.strip() for l in f if l.strip()]
        variants = get_gnomad_lof_variants(
            args.gnomad_version,
            genes,
            include_low_confidence=args.include_low_confidence,
            remove_singletons=args.remove_singletons,
        )

    elif args.variants_file:
        variants = annotate_list_of_variants(args.gnomad_version, args.variants_file)

    filename = args.output
    os.makedirs(os.path.dirname(filename), exist_ok=True)

    if args.output.endswith(".ht"):
        variants.write(args.output)
    else:
        # Convert to JSON and write
        rows = variants.annotate(json=hl.json(variants.row_value)).key_by().select("json").collect()
        with open_file(args.output, "w") as f:
            f.write("[" + ",".join([row.json for row in rows]) + "]")
