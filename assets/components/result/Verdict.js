import PropTypes from "prop-types";
import React from "react";

import verdicts, { verdictColors, verdictSymbols } from "../../constants/verdicts";

const Verdict = ({ verdict }) => (
  <span
    style={{
      color: verdictColors[verdict],
    }}
  >
    {verdictSymbols[verdict]}
  </span>
);

Verdict.propTypes = {
  verdict: PropTypes.oneOf(verdicts).isRequired,
};

export default Verdict;
