import PropTypes from "prop-types";
import React from "react";
import { Table } from "semantic-ui-react";

const renderGenotype = sample => {
  if (sample.GT === "1/1") {
    return "HOM";
  }
  if (sample.GT === "0/1") {
    return "HET";
  }
  return sample.GT;
};

const SampleTable = ({ samples }) => (
  <Table celled compact striped>
    <Table.Header>
      <Table.Row>
        <Table.HeaderCell>Sample</Table.HeaderCell>
        <Table.HeaderCell>Genotype</Table.HeaderCell>
        <Table.HeaderCell>Allele Balance: REF, ALT (ALT/DP)</Table.HeaderCell>
        <Table.HeaderCell>DP</Table.HeaderCell>
        <Table.HeaderCell>GQ</Table.HeaderCell>
      </Table.Row>
    </Table.Header>

    <Table.Body>
      {samples.map(sample => (
        <Table.Row key={sample.sample_id}>
          <Table.Cell>{sample.sample_id}</Table.Cell>
          <Table.Cell>{renderGenotype(sample)}</Table.Cell>
          <Table.Cell
            negative={sample.GT === "1/1" && sample.AB < 0.8}
            positive={sample.GT === "1/1" && sample.AB >= 0.8}
          >
            {sample.AD_REF}, {sample.AD_ALT} ({Math.round(sample.AB * 100)}%)
          </Table.Cell>
          <Table.Cell negative={sample.GT === "1/1" && sample.DP < 7}>{sample.DP}</Table.Cell>
          <Table.Cell>{sample.GQ}</Table.Cell>
        </Table.Row>
      ))}
    </Table.Body>
  </Table>
);

SampleTable.propTypes = {
  samples: PropTypes.arrayOf(
    PropTypes.shape({
      sample_id: PropTypes.string.isRequired,
      GT: PropTypes.string.isRequired,
      AB: PropTypes.number.isRequired,
      AD_REF: PropTypes.number.isRequired,
      AD_ALT: PropTypes.number.isRequired,
      DP: PropTypes.number.isRequired,
      GQ: PropTypes.number.isRequired,
    })
  ).isRequired,
};

export default SampleTable;
