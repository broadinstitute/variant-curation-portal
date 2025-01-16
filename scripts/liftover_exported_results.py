import hail as hl
import os
import json
import pandas as pd
from typing import List, Dict, Any
from datetime import datetime

def parse_csv_to_dataframe(csv_file: str) -> pd.DataFrame:
    return pd.read_csv(csv_file)

def convert_string_to_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).lower() == 'true'

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


def annotate_variants_with_grch37_to_grch38_liftover(ds):
    rg37 = hl.get_reference("GRCh37")
    rg38 = hl.get_reference("GRCh38")

    if not rg37.has_liftover(rg38):
        chain_file_path = "gs://hail-common/references/grch37_to_grch38.over.chain.gz"
        rg37.add_liftover(chain_file_path, rg38)

    ds = ds.annotate(liftover_variant_id=variant_id(hl.liftover(ds.locus, "GRCh38"), ds.alleles))
    return ds

def process_row(row: pd.Series) -> Dict[str, Any]:
    flag_columns = [col for col in row.index if col.startswith('Flag')]
    
    result = {
        "curator": row['Curator'],
        "variant_id": row['Variant ID'],
        "verdict": row['Verdict'].lower(),
        "notes": row['Notes'] if pd.notna(row['Notes']) else None,
        "should_revisit": convert_string_to_bool(row['Should Revisit']) if pd.notna(row['Should Revisit']) else None,
        "flag_mapping_error": convert_string_to_bool(row['Flag Mapping Error']) if pd.notna(row['Flag Mapping Error']) else None,
        "flag_genotyping_error": convert_string_to_bool(row['Flag Genotyping Error']) if pd.notna(row['Flag Genotyping Error']) else None,
        "flag_homopolymer": convert_string_to_bool(row['Flag Homopolymer']) if pd.notna(row['Flag Homopolymer']) else None,
        "flag_no_read_data": convert_string_to_bool(row['Flag No Read Data']) if pd.notna(row['Flag No Read Data']) else None,
        "flag_reference_error": convert_string_to_bool(row['Flag Reference Error']) if pd.notna(row['Flag Reference Error']) else None,
        "flag_strand_bias": convert_string_to_bool(row['Flag Strand Bias']) if pd.notna(row['Flag Strand Bias']) else None,
        "flag_mnp": convert_string_to_bool(row['Flag MNV/Frame Restoring Indel']) if pd.notna(row['Flag MNV/Frame Restoring Indel']) else None,
        "flag_essential_splice_rescue": convert_string_to_bool(row['Flag Essential Splice Rescue']) if pd.notna(row['Flag Essential Splice Rescue']) else None,
        "flag_in_frame_exon": convert_string_to_bool(row['Flag In Frame Exon']) if pd.notna(row['Flag In Frame Exon']) else None,
        "flag_minority_of_transcripts": convert_string_to_bool(row['Flag Minority Of Transcripts']) if pd.notna(row['Flag Minority Of Transcripts']) else None,
        "flag_weak_exon_conservation": convert_string_to_bool(row['Flag Weak Exon Conservation']) if pd.notna(row['Flag Weak Exon Conservation']) else None,
        "flag_last_exon": convert_string_to_bool(row['Flag Last Exon']) if pd.notna(row['Flag Last Exon']) else None,
        "flag_other_transcript_error": convert_string_to_bool(row['Flag Other Transcript Error']) if pd.notna(row['Flag Other Transcript Error']) else None,
        "flag_first_150_bp": convert_string_to_bool(row['Flag First 150 Bp']) if pd.notna(row['Flag First 150 Bp']) else None,
        "flag_long_exon": convert_string_to_bool(row['Flag Long Exon']) if pd.notna(row['Flag Long Exon']) else None,
        "flag_low_pext": convert_string_to_bool(row['Flag Low pext (< 0.2)']) if pd.notna(row['Flag Low pext (< 0.2)']) else None,
        "flag_pext_less_than_half_max": convert_string_to_bool(row['Flag pext < 50% max']) if pd.notna(row['Flag pext < 50% max']) else None,
        "flag_uninformative_pext": convert_string_to_bool(row['Flag Uninformative pext']) if pd.notna(row['Flag Uninformative pext']) else None,
        "flag_weak_gene_conservation": convert_string_to_bool(row['Flag Weak Gene Conservation']) if pd.notna(row['Flag Weak Gene Conservation']) else None,
        "flag_untranslated_transcript": convert_string_to_bool(row['Flag Untranslated Transcript']) if pd.notna(row['Flag Untranslated Transcript']) else None,
        "flag_skewed_ab": convert_string_to_bool(row['Flag skewed AB']) if pd.notna(row['Flag skewed AB']) else None,
        "flag_possible_splice_site_rescue": convert_string_to_bool(row['Flag Possible Splice Site Rescue']) if pd.notna(row['Flag Possible Splice Site Rescue']) else None,
        "created_at": None,  # These fields aren't in the CSV
        "updated_at": None
    }
    return result

def convert_csv_to_json_with_liftover(csv_file: str):

    os.makedirs('./data', exist_ok=True)

    base_name = os.path.basename(csv_file)
    name_without_ext = os.path.splitext(base_name)[0]
    output_file = f'./data/{name_without_ext}_liftover.json'

    hl.init()
    df = parse_csv_to_dataframe(csv_file)
    
    variants = hl.Table.from_pandas(
        df[['Variant ID']].rename(columns={'Variant ID': 'variant_id'})
    )
    variants = variants.annotate(
        locus = hl.locus(
            contig=hl.str(variants.variant_id).split('-')[0],
            pos=hl.int32(hl.str(variants.variant_id).split('-')[1]),
            reference_genome='GRCh37'
        ),
        alleles = [
            hl.str(variants.variant_id).split('-')[2],
            hl.str(variants.variant_id).split('-')[3]
        ]
    )
    variants = annotate_variants_with_grch37_to_grch38_liftover(variants)
    lifted_variants = variants.select(variant_id=variants.liftover_variant_id).to_pandas()
    df['Variant ID'] = lifted_variants['variant_id']
    
    result = []
    for _, row in df.iterrows():
        entry = process_row(row)
        result.append(entry)
    
    with open(output_file, 'w') as f:
        json.dump(result, f, indent=2)
    
    print(f"Successfully converted {csv_file} to {output_file} with lifted over variant IDs")

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage: python script.py input.csv")
        sys.exit(1)
    
    convert_csv_to_json_with_liftover(sys.argv[1])
