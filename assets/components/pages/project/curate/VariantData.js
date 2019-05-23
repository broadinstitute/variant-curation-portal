import PropTypes from "prop-types";
import React from "react";
import { List } from "semantic-ui-react";

const AnnotationsList = ({ annotations }) => {
  const annotationsGroupedByGene = annotations.reduce(
    (acc, annotation) => ({
      ...acc,
      [annotation.gene_id]: [...(acc[annotation.gene_id] || []), annotation],
    }),
    {}
  );

  return (
    <List>
      {Object.keys(annotationsGroupedByGene).map(geneId => (
        <List.Item key={geneId}>
          <List.Header>{annotationsGroupedByGene[geneId][0].gene_symbol}</List.Header>
          <List.List>
            {annotationsGroupedByGene[geneId].map(annotation => (
              <List.Item key={annotation.transcript_id}>
                <List.Content>
                  <List.Header>{annotation.transcript_id}</List.Header>
                  <List.Description>
                    {annotation.consequence}
                    {annotation.loftee && (
                      <React.Fragment>
                        <br />
                        LOFTEE: {annotation.loftee}
                        {annotation.loftee === "LC" && ` (${annotation.loftee_filter})`}
                      </React.Fragment>
                    )}
                    {annotation.loftee_flags && (
                      <React.Fragment>
                        <br />
                        LOFTEE Flags: {annotation.loftee_flags}
                      </React.Fragment>
                    )}
                  </List.Description>
                </List.Content>
              </List.Item>
            ))}
          </List.List>
        </List.Item>
      ))}
    </List>
  );
};

AnnotationsList.propTypes = {
  annotations: PropTypes.arrayOf(
    PropTypes.shape({
      consequence: PropTypes.string,
      gene_id: PropTypes.string,
      gene_symbol: PropTypes.string,
      transcript_id: PropTypes.string,
      loftee: PropTypes.string,
      loftee_filter: PropTypes.string,
      loftee_flags: PropTypes.string,
    })
  ).isRequired,
};

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
          <AnnotationsList annotations={variant.annotations} />
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
    annotations: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
};

export default VariantData;
