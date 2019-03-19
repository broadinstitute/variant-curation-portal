import PropTypes from "prop-types";
import React from "react";

const withParamsAsProps = mapParamsToProps => ComposedComponent => {
  const Wrapper = ({ match, ...rest }) => (
    <ComposedComponent match={match} {...rest} {...mapParamsToProps(match.params)} />
  );

  Wrapper.propTypes = {
    match: PropTypes.shape({
      params: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    }).isRequired,
  };

  return Wrapper;
};

export default withParamsAsProps;
