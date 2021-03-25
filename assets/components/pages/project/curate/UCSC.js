import PropTypes from "prop-types";
import React from "react";
import { Header, Segment } from "semantic-ui-react";

/**
 * Documentation for linking to the UCSC browser:
 * https://genome.ucsc.edu/FAQ/FAQlink.html
 * https://genome.ucsc.edu/goldenPath/help/customTrack.html#optParams
 */

export const UCSCVariantView = ({ settings, variant }) => {
  const assembly = variant.reference_genome === "GRCh38" ? "hg38" : "hg19";

  let url = `https://genome.ucsc.edu/cgi-bin/hgTracks?db=${assembly}&position=${encodeURIComponent(
    `chr${variant.chrom}:${variant.pos - 25}-${variant.pos + 25}`
  )}&highlight=${encodeURIComponent(
    `${assembly}.chr${variant.chrom}:${variant.pos}-${variant.pos}`
  )}`;

  if (settings.ucsc_username && settings.ucsc_session_name) {
    url = `${url}&hgS_doOtherUser=submit&hgS_otherUserName=${settings.ucsc_username}&hgS_otherUserSessionName=${settings.ucsc_session_name}`;
  }

  if (process.env.NODE_ENV === "development") {
    return (
      <Segment placeholder id="ucsc" textAlign="center">
        <p>UCSC variant view</p>
        <a href={url}>{url}</a>
      </Segment>
    );
  }

  return (
    <iframe
      title="UCSC variant view"
      id="ucsc"
      src={url}
      style={{ width: "100%", height: "4000px" }}
    />
  );
};

UCSCVariantView.propTypes = {
  settings: PropTypes.shape({
    ucsc_username: PropTypes.string,
    ucsc_session_name: PropTypes.string,
  }).isRequired,
  variant: PropTypes.shape({
    chrom: PropTypes.string.isRequired,
    pos: PropTypes.number.isRequired,
    reference_genome: PropTypes.oneOf(["GRCh37", "GRCh38"]).isRequired,
  }).isRequired,
};

export const UCSCGeneView = ({ settings, variant }) => {
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

  let url = `https://genome.ucsc.edu/cgi-bin/hgTracks?db=${assembly}&position=${
    annotation.gene_symbol
  }&singleSearch=knownCanonical&hgFind.matches=${
    annotation.transcript_id
  }&highlight=${encodeURIComponent(
    `${assembly}.chr${variant.chrom}:${variant.pos}-${variant.pos}`
  )}`;

  if (settings.ucsc_username && settings.ucsc_session_name) {
    url = `${url}&hgS_doOtherUser=submit&hgS_otherUserName=${settings.ucsc_username}&hgS_otherUserSessionName=${settings.ucsc_session_name}`;
  }

  if (process.env.NODE_ENV === "development") {
    return (
      <Segment placeholder id="ucsc-gene" textAlign="center">
        <p>UCSC gene view</p>
        <a href={url}>{url}</a>
      </Segment>
    );
  }

  return (
    <iframe
      title="UCSC gene view"
      id="ucsc-gene"
      src={url}
      style={{ width: "100%", height: "4000px" }}
    />
  );
};

UCSCGeneView.propTypes = {
  settings: PropTypes.shape({
    ucsc_username: PropTypes.string,
    ucsc_session_name: PropTypes.string,
  }).isRequired,
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
