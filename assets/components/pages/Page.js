import PropTypes from "prop-types";
import React from "react";

const Page = ({ children }) => <div style={{ padding: "1.5rem" }}>{children}</div>;

Page.propTypes = {
  children: PropTypes.node,
};

Page.defaultProps = {
  children: undefined,
};

export default Page;
