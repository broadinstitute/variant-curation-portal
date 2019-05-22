import PropTypes from "prop-types";
import React from "react";

/**
 * Documentation for linking to the UCSC browser:
 * https://genome.ucsc.edu/FAQ/FAQlink.html
 * https://genome.ucsc.edu/goldenPath/help/customTrack.html#optParams
 */

export const UCSCVariantView = ({ variant }) => {
  return (
    <iframe
      title="UCSC variant view"
      id="ucsc"
      width="100%"
      height="4000px"
      src={`https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=${encodeURIComponent(
        `chr${variant.chrom}:${variant.pos - 25}-${variant.pos + 25}`
      )}&highlight=${encodeURIComponent(`hg19.chr${variant.chrom}:${variant.pos}-${variant.pos}`)}`}
    />
  );
};

UCSCVariantView.propTypes = {
  variant: PropTypes.shape({
    chrom: PropTypes.string.isRequired,
    pos: PropTypes.number.isRequired,
  }).isRequired,
};

export const UCSCGeneView = ({ variant }) => {
  if (!(variant.gene_name && variant.transcript_id)) {
    return null;
  }

  return (
    <iframe
      title="UCSC gene view"
      id="ucsc-gene"
      width="100%"
      height="4000px"
      src={`https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=${
        variant.gene_name
      }&singleSearch=knownCanonical&hgFind.matches=${
        variant.transcript_id
      }&highlight=${encodeURIComponent(`hg19.chr${variant.chrom}:${variant.pos}-${variant.pos}`)}`}
    />
  );
};

UCSCGeneView.propTypes = {
  variant: PropTypes.shape({
    chrom: PropTypes.string.isRequired,
    pos: PropTypes.number.isRequired,
  }).isRequired,
};
