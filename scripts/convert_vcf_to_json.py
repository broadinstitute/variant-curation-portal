#!/usr/bin/env python3

# pip install PyVCF==0.6.8 tqdm==4.31.1

import argparse
import gzip
import json
import re

from tqdm import tqdm
import vcf


RANKED_CONSEQUENCE_TERMS = [
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
    "splice_region_variant",
    "incomplete_terminal_codon_variant",
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

CONSEQUENCE_TERM_RANK = {term: rank for rank, term in enumerate(RANKED_CONSEQUENCE_TERMS)}


def get_rank(annotation):
    terms = annotation["Consequence"].split("&")
    return min(CONSEQUENCE_TERM_RANK.get(t) for t in terms)


def convert_vcf_to_json(
    vcf_path, output_path, max_samples_per_genotype=5, reference_genome="GRCh37", tag_fields=None
):
    variants = {}

    with gzip.open(vcf_path, "rt") as vcf_file:
        reader = vcf.Reader(vcf_file)

        csq_header = (
            reader.infos["CSQ"]  # pylint: disable=unsubscriptable-object
            .desc.split("Format: ")[1]
            .split("|")
        )

        for row in tqdm(reader, unit=" rows"):
            if len(row.ALT) > 1:
                raise Exception(
                    "VCF contains multiallelic rows, which are not supported by this script"
                )

            samples = list(row.samples)

            # Parse CSQ field
            vep_annotations = [dict(zip(csq_header, v.split("|"))) for v in row.INFO.get("CSQ", [])]

            # Filter to only LoF annotations
            lof_annotations = [
                annotation
                for annotation in vep_annotations
                if get_rank(annotation) <= CONSEQUENCE_TERM_RANK.get("frameshift_variant")
            ]

            # Sort annotations by severity
            lof_annotations = sorted(lof_annotations, key=get_rank)

            variant_id = "-".join(
                map(str, [re.sub(r"^chr", "", row.CHROM), row.POS, row.REF, row.ALT[0]])
            )

            if not lof_annotations:
                print(f"Skipping {variant_id}, no LoF annotations")
                continue

            liftover_field = "liftover_37" if reference_genome == "GRCh38" else "liftover_38"
            liftover_variant_id = row.INFO.get(liftover_field, None)
            if liftover_variant_id:
                liftover_variant_id = liftover_variant_id.replace(":", "-")

            if variant_id not in variants:
                variants[variant_id] = {
                    "reference_genome": reference_genome,
                    "variant_id": variant_id,
                    "liftover_variant_id": liftover_variant_id,
                    "qc_filter": (row.FILTER.join(",") if row.FILTER else "PASS"),
                    "AC": row.INFO["AC"],
                    "AN": row.INFO["AN"],
                    "AF": row.INFO["AF"],
                    "n_homozygotes": sum(1 for s in samples if s["GT"] == "1/1"),
                    "annotations": [],
                    "tags": [],
                    "samples": [],
                }

            variant = variants[variant_id]

            for annotation in lof_annotations:
                variant["annotations"].append(
                    {
                        "consequence": annotation["Consequence"],
                        "gene_id": annotation["Gene"],
                        "gene_symbol": annotation["SYMBOL"],
                        "transcript_id": annotation["Feature"],
                        "loftee": annotation["LoF"],
                        "loftee_filter": annotation["LoF_filter"],
                        "loftee_flags": annotation["LoF_flags"],
                    }
                )

            if tag_fields:
                for field, label in tag_fields.items():
                    value = row.INFO.get(field, None)
                    if value is not None:
                        variant["tags"].append({"label": label, "value": value})

            for sample in sorted(samples, key=lambda s: getattr(s.data, "GQ", None) or 0):
                if sample["GT"] not in {"0/1", "1/1"}:
                    continue

                if (
                    sum(1 for s in variant["samples"] if s["GT"] == sample["GT"])
                    >= max_samples_per_genotype
                ):
                    continue

                allele_depth = getattr(sample.data, "AD", None)
                depth = getattr(sample.data, "DP", None)
                genotype_quality = getattr(sample.data, "GQ", None)

                # Skip samples without any relevant information
                if not (depth or genotype_quality or allele_depth):
                    continue

                ref_allele_depth = allele_depth[0] if allele_depth else None
                alt_allele_depth = sum(allele_depth[1:]) if allele_depth else None
                allele_balance = (
                    alt_allele_depth / float(depth)
                    if depth is not None and depth > 0
                    else float("NaN")
                )

                variant["samples"].append(
                    {
                        "sample_id": len(variant["samples"]),
                        "GT": sample["GT"],
                        "DP": depth,
                        "GQ": genotype_quality,
                        "AD_REF": ref_allele_depth,
                        "AD_ALT": alt_allele_depth,
                        "AB": allele_balance,
                    }
                )

    with open(output_path, "w") as output_file:
        json.dump(list(variants.values()), output_file)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("vcf_path")
    parser.add_argument("output_path")
    parser.add_argument("--max-samples-per-genotype", type=int, default=5)
    parser.add_argument("--reference-genome", choices=["GRCh37", "GRCh38"], default="GRCh37")
    parser.add_argument("--tag-field", action="append", default=[])

    args = parser.parse_args()

    tag_fields = {}
    for tag_field in args.tag_field:
        try:
            [field, label] = tag_field.split("=")
        except ValueError:
            field = label = tag_field

        tag_fields[field] = label

    convert_vcf_to_json(
        args.vcf_path,
        args.output_path,
        max_samples_per_genotype=args.max_samples_per_genotype,
        reference_genome=args.reference_genome,
        tag_fields=tag_fields,
    )


if __name__ == "__main__":
    main()
