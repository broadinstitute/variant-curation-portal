import PropTypes from "prop-types";
import React from "react";
import { Popup } from "semantic-ui-react";

const MAX_LENGTH = 20;

const VariantId = ({ variantId, referenceGenome }) => {
  const suffix = referenceGenome ? ` (${referenceGenome})` : "";

  if (variantId.length <= MAX_LENGTH) {
    return <span>{`${variantId}${suffix}`}</span>;
  }

  return (
    <Popup
      trigger={<span>{`${variantId.slice(0, MAX_LENGTH)}...${suffix}`}</span>}
      content={variantId}
    />
  );
};

VariantId.propTypes = {
  variantId: PropTypes.string.isRequired,
  referenceGenome: PropTypes.string,
};

VariantId.defaultProps = {
  referenceGenome: undefined,
};

export default VariantId;
