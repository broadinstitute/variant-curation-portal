import PropTypes from "prop-types";
import React from "react";
import { Header, Segment } from "semantic-ui-react";

export const GnomadVariantView = ({ gnomadVersion, variant }) => {
  const gnomadDataset = {
    "2": "gnomad_r2_1",
    "4": "gnomad_r4",
  }[gnomadVersion];

  let gnomadVariantId;
  if (variant.reference_genome === "GRCh37") {
    gnomadVariantId = {
      "2": variant.variant_id,
      "4": variant.liftover_variant_id,
    }[gnomadVersion];
  } else if (variant.reference_genome === "GRCh38") {
    gnomadVariantId = {
      "2": variant.liftover_variant_id,
      "4": variant.variant_id,
    }[gnomadVersion];
  }

  if (!gnomadVariantId) {
    return (
      <Segment placeholder textAlign="center">
        <Header>
          gnomAD v{gnomadVersion} variant page unavailable for this variant
          <br />
          No {gnomadVersion === "2" ? "GRCh37" : "GRCh38"} variant ID
        </Header>
      </Segment>
    );
  }

  const url = `https://gnomad.broadinstitute.org/variant/${gnomadVariantId}?dataset=${gnomadDataset}`;

  if (process.env.NODE_ENV === "development") {
    return (
      <Segment placeholder textAlign="center">
        <p>gnomAD v{gnomadVersion} variant page</p>
        <a href={url}>{url}</a>
      </Segment>
    );
  }

  return (
    <iframe title="gnomAD variant page" src={url} style={{ width: "100%", height: "3900px" }} />
  );
};

GnomadVariantView.propTypes = {
  gnomadVersion: PropTypes.oneOf(["2", "4"]).isRequired,
  variant: PropTypes.shape({
    reference_genome: PropTypes.oneOf(["GRCh37", "GRCh38"]).isRequired,
    variant_id: PropTypes.string.isRequired,
    liftover_variant_id: PropTypes.string,
  }).isRequired,
};

export const GnomadGeneView = ({ gnomadVersion, variant }) => {
  const annotations = variant.annotations.filter(annotation =>
    annotation.gene_id.startsWith("ENSG")
  );

  const hasAnnotations = annotations.length > 0;

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

  const gnomadDataset = {
    "2": "gnomad_r2_1",
    "4": "gnomad_r4",
  }[gnomadVersion];

  const url = `https://gnomad.broadinstitute.org/gene/${annotations[0].gene_id}?dataset=${gnomadDataset}`;

  if (process.env.NODE_ENV === "development") {
    return (
      <Segment placeholder textAlign="center">
        <p>gnomAD v{gnomadVersion} gene page</p>
        <a href={url}>{url}</a>
      </Segment>
    );
  }

  return <iframe title="gnomAD gene page" src={url} style={{ width: "100%", height: "2000px" }} />;
};

GnomadGeneView.propTypes = {
  gnomadVersion: PropTypes.oneOf(["2", "4"]).isRequired,
  variant: PropTypes.shape({
    annotations: PropTypes.arrayOf(
      PropTypes.shape({
        consequence: PropTypes.string.isRequired,
        gene_id: PropTypes.string.isRequired,
        gene_symbol: PropTypes.string.isRequired,
        transcript_id: PropTypes.string.isRequired,
      })
    ).isRequired,
    liftover_variant_id: PropTypes.string,
    reference_genome: PropTypes.oneOf(["GRCh37", "GRCh38"]).isRequired,
  }).isRequired,
};
