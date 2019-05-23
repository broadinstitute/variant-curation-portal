import PropTypes from "prop-types";
import React from "react";
import { List } from "semantic-ui-react";

const VariantData = ({ variant }) => {
  return (
    <React.Fragment>
      <List>
        <List.Item>
          <strong>Filter:</strong> {variant.qc_filter}
        </List.Item>
        <List.Item>
          <strong>Callset AF:</strong> {variant.AF}
        </List.Item>
        <List.Item>
          <strong>Callset AC:</strong> {variant.AC}
        </List.Item>
        <List.Item>
          <strong>Callset AN:</strong> {variant.AN}
        </List.Item>
        <List.Item>
          <strong>Annotations:</strong>
          <List>
            {variant.annotations.map(annotation => (
              <List.Item key={annotation.transcript_id}>
                {annotation.transcript_id}: {annotation.consequence}
              </List.Item>
            ))}
          </List>
        </List.Item>
      </List>
    </React.Fragment>
  );
};

VariantData.propTypes = {
  variant: PropTypes.shape({
    qc_filter: PropTypes.string,
    AC: PropTypes.number,
    AN: PropTypes.number,
    AF: PropTypes.number,
    annotations: PropTypes.arrayOf(
      PropTypes.shape({
        consequence: PropTypes.string,
        gene_id: PropTypes.string,
        gene_symbol: PropTypes.string,
        transcript_id: PropTypes.string,
      })
    ).isRequired,
  }).isRequired,
};

export default VariantData;
