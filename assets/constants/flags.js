import { mapValues } from "lodash";

export const FLAGS = [
  // Technical
  "flag_mapping_error",
  "flag_genotyping_error",
  "flag_homopolymer",
  "flag_no_read_data",
  "flag_reference_error",
  "flag_strand_bias",
  // Rescue
  "flag_mnp",
  "flag_essential_splice_rescue",
  "flag_in_frame_exon",
  // Impact
  "flag_minority_of_transcripts",
  "flag_weak_exon_conservation",
  "flag_last_exon",
  "flag_other_transcript_error",
  "flag_first_150_bp",
  "flag_long_exon",
  "flag_low_pext",
  "flag_pext_less_than_half_max",
  "flag_uninformative_pext",
  "flag_weak_gene_conservation",
  "flag_untranslated_transcript",
  // Comment
  "flag_skewed_ab",
  "flag_possible_splice_site_rescue",
];

export const FLAG_CODES = {
  // Technical
  flag_mapping_error: "MA",
  flag_genotyping_error: "GE",
  flag_homopolymer: "HO",
  flag_no_read_data: "NR",
  flag_reference_error: "RE",
  flag_strand_bias: "BI",
  // Rescue
  flag_mnp: "IN",
  flag_essential_splice_rescue: "ES",
  flag_in_frame_exon: "IE",
  // Impact
  flag_minority_of_transcripts: "MI",
  flag_weak_exon_conservation: "WE",
  flag_last_exon: "LE",
  flag_other_transcript_error: "OT",
  flag_first_150_bp: "FH",
  flag_long_exon: "LO",
  flag_low_pext: "LP",
  flag_pext_less_than_half_max: "P5",
  flag_uninformative_pext: "UP",
  flag_weak_gene_conservation: "WG",
  flag_untranslated_transcript: "UT",
  // Comment
  flag_skewed_ab: "AB",
  flag_possible_splice_site_rescue: "PS",
};

if (process.env.NODE_ENV === "development") {
  const flagCodes = Object.values(FLAG_CODES);

  const duplicateCodes = new Set(flagCodes.filter((s, i, a) => i !== a.indexOf(s)));
  if (duplicateCodes.size > 0) {
    throw new Error(`Duplicate flag codes: ${Array.from(duplicateCodes).join(", ")}`);
  }
}

export const FLAG_LABELS = {
  // Technical
  flag_mapping_error: "Mapping error",
  flag_genotyping_error: "Genotyping error",
  flag_homopolymer: "Homopolymer",
  flag_no_read_data: "No read data",
  flag_reference_error: "Reference error",
  flag_strand_bias: "Strand bias",
  // Rescue
  flag_mnp: "In-phase MNV or frame-restoring indel",
  flag_essential_splice_rescue: "Essential splice site rescue",
  flag_in_frame_exon: "In-frame exon",
  // Impact
  flag_minority_of_transcripts: "Minority of transcripts",
  flag_weak_exon_conservation: "Weak exon conservation",
  flag_last_exon: "Last exon",
  flag_other_transcript_error: "Other transcript error",
  flag_first_150_bp: "First 150 base pairs",
  flag_long_exon: "Long exon",
  flag_low_pext: "Low pext (< 0.2)",
  flag_pext_less_than_half_max: "pext < 50% max",
  flag_uninformative_pext: "Uninformative pext",
  flag_weak_gene_conservation: "weak gene conservation",
  flag_untranslated_transcript: "Untranslated transcript",
  // Comment
  flag_skewed_ab: "Skewed AB",
  flag_possible_splice_site_rescue: "Possible splice site rescue",
};

export const FLAG_SHORTCUTS = mapValues(FLAG_CODES, code =>
  code
    .toLowerCase()
    .split("")
    .join(" ")
);
