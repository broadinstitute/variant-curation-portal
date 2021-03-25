import PropTypes from "prop-types";
import React from "react";
import { Header, Segment } from "semantic-ui-react";

export const GnomadVariantView = ({ variant }) => {
  const gnomadDataset = variant.reference_genome === "GRCh37" ? "gnomad_r2_1" : "gnomad_r3";

  const url = `https://gnomad.broadinstitute.org/variant/${variant.variant_id}?dataset=${gnomadDataset}`;

  if (process.env.NODE_ENV === "development") {
    return (
      <Segment placeholder id="gnomad-variant" textAlign="center">
        <p>gnomAD variant page</p>
        <a href={url}>{url}</a>
      </Segment>
    );
  }

  return (
    <iframe
      title="gnomAD variant page"
      id="gnomad-variant"
      src={url}
      style={{ width: "100%", height: "3900px" }}
    />
  );
};

GnomadVariantView.propTypes = {
  variant: PropTypes.shape({
    reference_genome: PropTypes.oneOf(["GRCh37", "GRCh38"]).isRequired,
    variant_id: PropTypes.string.isRequired,
    liftover_variant_id: PropTypes.string,
  }).isRequired,
};

export const GnomadGeneView = ({ variant }) => {
  const hasAnnotations = variant.annotations.length > 0;

  if (!hasAnnotations) {
    return (
      <Segment placeholder textAlign="center">
        <Header>
          gnomAD gene page unavailable for this variant
          <br />
          No annotations
        </Header>
      </Segment>
    );
  }

  const url = `https://gnomad.broadinstitute.org/gene/${variant.annotations[0].gene_id}`;

  if (process.env.NODE_ENV === "development") {
    return (
      <Segment placeholder id="gnomad-gene" textAlign="center">
        <p>gnomAD gene page</p>
        <a href={url}>{url}</a>
      </Segment>
    );
  }

  return (
    <iframe
      title="gnomAD gene page"
      id="gnomad-gene"
      src={url}
      style={{ width: "100%", height: "2000px" }}
    />
  );
};

GnomadGeneView.propTypes = {
  variant: PropTypes.shape({
    annotations: PropTypes.arrayOf(
      PropTypes.shape({
        consequence: PropTypes.string.isRequired,
        gene_id: PropTypes.string.isRequired,
        gene_symbol: PropTypes.string.isRequired,
        transcript_id: PropTypes.string.isRequired,
      })
    ).isRequired,
  }).isRequired,
};
