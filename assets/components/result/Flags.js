import React from "react";

import { CurationResultPropType } from "../propTypes";

const Flags = ({ result }) => (
  <span style={{ fontFamily: "monospace" }}>
    {result.flag_mapping_error ? "M" : "_"}
    {result.flag_genotyping_error ? "G" : "_"}
    {result.flag_homopolymer ? "H" : "_"}
    {result.flag_no_read_data ? "N" : "_"}
    {result.flag_reference_error ? "E" : "_"}
    {result.flag_strand_bias ? "S" : "_"}
    {result.flag_mnp ? "P" : "_"}
    {result.flag_essential_splice_rescue ? "R" : "_"}
    {result.flag_minority_of_transcripts ? "T" : "_"}
    {result.flag_weak_exon_conservation ? "C" : "_"}
    {result.flag_last_exon ? "L" : "_"}
    {result.flag_other_transcript_error ? "O" : "_"}
  </span>
);

Flags.propTypes = {
  result: CurationResultPropType.isRequired,
};

export default Flags;
