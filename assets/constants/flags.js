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
  flag_mapping_error: "M",
  flag_genotyping_error: "G",
  flag_homopolymer: "H",
  flag_no_read_data: "N",
  flag_reference_error: "E",
  flag_strand_bias: "S",
  // Rescue
  flag_mnp: "P",
  flag_essential_splice_rescue: "R",
  // Impact
  flag_minority_of_transcripts: "T",
  flag_weak_exon_conservation: "C",
  flag_last_exon: "L",
  flag_other_transcript_error: "O",
};

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

export const FLAG_SHORTCUTS = {
  // Technical
  flag_mapping_error: "m a",
  flag_genotyping_error: "g e",
  flag_homopolymer: "h o",
  flag_no_read_data: "n r",
  flag_reference_error: "r e",
  flag_strand_bias: "b i",
  // Rescue
  flag_mnp: "i n",
  flag_essential_splice_rescue: "e s",
  // Impact
  flag_minority_of_transcripts: "m i",
  flag_weak_exon_conservation: "w e",
  flag_last_exon: "l e",
  flag_other_transcript_error: "o t",
};
