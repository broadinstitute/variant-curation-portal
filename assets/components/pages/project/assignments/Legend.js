import React from "react";
import { List } from "semantic-ui-react";

import { FLAG_CODES, FLAG_LABELS } from "../../../../constants/flags";
import verdicts, {
  verdictColors,
  verdictLabels,
  verdictSymbols,
} from "../../../../constants/verdicts";

const Legend = () => (
  <List relaxed>
    <List.Item>
      <List horizontal>
        {[
          "flag_mapping_error",
          "flag_genotyping_error",
          "flag_homopolymer",
          "flag_no_read_data",
          "flag_reference_error",
          "flag_strand_bias",
        ].map(flag => (
          <List.Item key={flag}>
            {FLAG_CODES[flag]} = {FLAG_LABELS[flag]}
          </List.Item>
        ))}
      </List>
    </List.Item>
    <List.Item>
      <List horizontal>
        {["flag_mnp", "flag_essential_splice_rescue"].map(flag => (
          <List.Item key={flag}>
            {FLAG_CODES[flag]} = {FLAG_LABELS[flag]}
          </List.Item>
        ))}
      </List>
    </List.Item>
    <List.Item>
      <List horizontal>
        {[
          "flag_minority_of_transcripts",
          "flag_weak_exon_conservation",
          "flag_last_exon",
          "flag_other_transcript_error",
        ].map(flag => (
          <List.Item key={flag}>
            {FLAG_CODES[flag]} = {FLAG_LABELS[flag]}
          </List.Item>
        ))}
      </List>
    </List.Item>
    <List.Item>
      <List horizontal>
        {verdicts.map(verdict => (
          <List.Item key={verdict}>
            <span style={{ color: verdictColors[verdict] }}>
              {verdictSymbols[verdict]} {verdictLabels[verdict]}
            </span>
          </List.Item>
        ))}
      </List>
    </List.Item>
  </List>
);

export default Legend;
