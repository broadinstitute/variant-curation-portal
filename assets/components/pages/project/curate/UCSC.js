import PropTypes from "prop-types";
import React from "react";
import { Header, Segment } from "semantic-ui-react";

/**
 * Documentation for linking to the UCSC browser:
 * https://genome.ucsc.edu/FAQ/FAQlink.html
 * https://genome.ucsc.edu/goldenPath/help/customTrack.html#optParams
 */

export const UCSCVariantView = ({ variant }) => {
  const assembly = variant.reference_genome === "GRCh38" ? "hg38" : "hg19";
  return (
    <iframe
      title="UCSC variant view"
      id="ucsc"
      src={`https://genome.ucsc.edu/cgi-bin/hgTracks?db=${assembly}&position=${encodeURIComponent(
        `chr${variant.chrom}:${variant.pos - 25}-${variant.pos + 25}`
      )}&highlight=${encodeURIComponent(
        `${assembly}.chr${variant.chrom}:${variant.pos}-${variant.pos}`
      )}`}
      style={{ width: "100%", height: "4000px" }}
    />
  );
};

UCSCVariantView.propTypes = {
  variant: PropTypes.shape({
    chrom: PropTypes.string.isRequired,
    pos: PropTypes.number.isRequired,
    reference_genome: PropTypes.oneOf(["GRCh37", "GRCh38"]).isRequired,
  }).isRequired,
};

export const UCSCGeneView = ({ variant }) => {
  const hasAnnotations = variant.annotations.length > 0;

  if (!hasAnnotations) {
    return (
      <Segment placeholder textAlign="center">
        <Header>
          UCSC gene view unavailable for this variant
          <br />
          No annotations
        </Header>
      </Segment>
    );
  }

  const assembly = variant.reference_genome === "GRCh38" ? "hg38" : "hg19";
  const annotation = variant.annotations[0];

  return (
    <iframe
      title="UCSC gene view"
      id="ucsc-gene"
      src={`https://genome.ucsc.edu/cgi-bin/hgTracks?db=${assembly}&position=${
        annotation.gene_symbol
      }&singleSearch=knownCanonical&hgFind.matches=${
        annotation.transcript_id
      }&highlight=${encodeURIComponent(
        `${assembly}.chr${variant.chrom}:${variant.pos}-${variant.pos}`
      )}`}
      style={{ width: "100%", height: "4000px" }}
    />
  );
};

UCSCGeneView.propTypes = {
  variant: PropTypes.shape({
    annotations: PropTypes.arrayOf(
      PropTypes.shape({
        consequence: PropTypes.string,
        gene_id: PropTypes.string,
        gene_symbol: PropTypes.string,
        transcript_id: PropTypes.string,
      })
    ).isRequired,
    chrom: PropTypes.string.isRequired,
    pos: PropTypes.number.isRequired,
    reference_genome: PropTypes.oneOf(["GRCh37", "GRCh38"]).isRequired,
  }).isRequired,
};
