import PropTypes from "prop-types";
import React from "react";
import { Popup } from "semantic-ui-react";

const MAX_LENGTH = 25;

const VariantId = ({ variantId }) => {
  if (variantId.length <= MAX_LENGTH) {
    return <span>{variantId}</span>;
  }

  return <Popup trigger={<span>{variantId.slice(0, MAX_LENGTH)}...</span>} content={variantId} />;
};

VariantId.propTypes = {
  variantId: PropTypes.string.isRequired,
};

export default VariantId;
