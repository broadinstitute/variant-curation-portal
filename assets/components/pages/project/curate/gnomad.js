import PropTypes from "prop-types";
import React from "react";
import { Header, Segment } from "semantic-ui-react";

// eslint-disable-next-line import/prefer-default-export
export const GnomadVariantView = ({ variant }) => {
  const gnomadVariantId =
    variant.reference_genome === "GRCh38" ? variant.liftover_variant_id : variant.variant_id;

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
