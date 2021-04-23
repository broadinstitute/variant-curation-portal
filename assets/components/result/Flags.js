import React from "react";

import { FLAGS, FLAG_CODES } from "../../constants/flags";
import { CurationResultPropType } from "../propTypes";

const Flags = ({ result }) => (
  <span style={{ fontFamily: "monospace" }}>
    {FLAGS.map(flag => (result[flag] ? FLAG_CODES[flag] : "_")).join("")}
  </span>
);

Flags.propTypes = {
  result: CurationResultPropType.isRequired,
};

export default Flags;
