import React from "react";
import { List } from "semantic-ui-react";

import verdicts, {
  verdictColors,
  verdictLabels,
  verdictSymbols,
} from "../../../../constants/verdicts";

const Legend = () => (
  <List relaxed>
    <List.Item>
      <List horizontal>
        <List.Item>M = Mapping error</List.Item>
        <List.Item>G = Genotyping error</List.Item>
        <List.Item>H = Homopolymer</List.Item>
        <List.Item>N = No read data</List.Item>
        <List.Item>E = Reference error</List.Item>
        <List.Item>S = Strand bias</List.Item>
      </List>
    </List.Item>
    <List.Item>
      <List horizontal>
        <List.Item>P = In-phase MNV or frame-restoring indel</List.Item>
        <List.Item>R = Essential splice site rescue</List.Item>
      </List>
    </List.Item>
    <List.Item>
      <List horizontal>
        <List.Item>T = Minority of transcripts</List.Item>
        <List.Item>C = Weak exon/site conservation</List.Item>
        <List.Item>L = Last exon</List.Item>
        <List.Item>O = Other transcript error</List.Item>
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
