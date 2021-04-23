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
  // Impact
  "flag_minority_of_transcripts",
  "flag_weak_exon_conservation",
  "flag_last_exon",
  "flag_other_transcript_error",
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
  // Impact
  flag_minority_of_transcripts: "MI",
  flag_weak_exon_conservation: "WE",
  flag_last_exon: "LE",
  flag_other_transcript_error: "OT",
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
  // Impact
  flag_minority_of_transcripts: "Minority of transcripts",
  flag_weak_exon_conservation: "Weak exon conservation",
  flag_last_exon: "Last exon",
  flag_other_transcript_error: "Other transcript error",
};

export const FLAG_SHORTCUTS = mapValues(FLAG_CODES, code =>
  code
    .toLowerCase()
    .split("")
    .join(" ")
);
