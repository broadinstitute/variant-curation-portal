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

const TagsList = ({ tags }) => (
  <List>
    {tags.map((tag, index) => (
      // eslint-disable-next-line react/no-array-index-key
      <List.Item key={index}>
        <List.Content>
          <List.Header>{tag.label}</List.Header>
          <List.Description>{tag.value}</List.Description>
        </List.Content>
      </List.Item>
    ))}
  </List>
);

TagsList.propTypes = {
  tags: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ).isRequired,
};

const VariantData = ({ variant }) => {
  return (
    <React.Fragment>
      <List>
        <List.Item>
          <strong>Reference genome:</strong> {variant.reference_genome}
        </List.Item>
        {variant.liftover_variant_id && (
          <List.Item>
            <strong>Liftover:</strong> {variant.liftover_variant_id}
          </List.Item>
        )}
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
          <strong>Number of homozygotes:</strong> {variant.n_homozygotes}
        </List.Item>
        <List.Item>
          <strong>Annotations:</strong>
          {variant.annotations.length > 0 ? (
            <AnnotationsList annotations={variant.annotations} />
          ) : (
            <p>No annotations available for this variant</p>
          )}
        </List.Item>
        <List.Item>
          <strong>Tags:</strong>
          {variant.tags.length > 0 ? (
            <TagsList tags={variant.tags} />
          ) : (
            <p>No tags available for this variant</p>
          )}
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
    n_homozygotes: PropTypes.number,
    annotations: PropTypes.arrayOf(PropTypes.object).isRequired,
    tags: PropTypes.arrayOf(PropTypes.object).isRequired,
    reference_genome: PropTypes.oneOf(["GRCh37", "GRCh38"]).isRequired,
    liftover_variant_id: PropTypes.string,
  }).isRequired,
};

export default VariantData;
