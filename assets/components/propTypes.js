import PropTypes from "prop-types";

import verdicts from "../constants/verdicts";

export const CurationResultPropType = PropTypes.shape({
  notes: PropTypes.string,
  verdict: PropTypes.oneOf(verdicts),
});

export const CurationAssignmentPropType = PropTypes.shape({
  result: CurationResultPropType,
  variant: PropTypes.object,
});
