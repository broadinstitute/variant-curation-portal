import PropTypes from "prop-types";
import React from "react";
import { Header, Segment } from "semantic-ui-react";

// gnomAD is based on GRCh37. So if a variant's coordinates are based on GRCh38,
// then we need lifted over coordinates to look it up in gnomAD.
export const getGnomadVariantId = variant =>
  variant.reference_genome === "GRCh38" ? variant.liftover_variant_id : variant.variant_id;

export const GnomadVariantView = ({ variant }) => {
  const gnomadVariantId = getGnomadVariantId(variant);

  if (!gnomadVariantId) {
    return (
      <Segment placeholder textAlign="center">
        <Header>
          gnomAD not available
          <br />
          No GRCh37 variant ID
        </Header>
      </Segment>
    );
  }
  return (
    <iframe
      title="gnomAD browser"
      id="gnomad"
      width="100%"
      height="3900px"
      src={`https://gnomad.broadinstitute.org/variant/${gnomadVariantId}`}
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
