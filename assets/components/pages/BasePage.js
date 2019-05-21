import PropTypes from "prop-types";
import React from "react";
import { Container } from "semantic-ui-react";

import Fetch from "../Fetch";

const BasePage = ({ children, dataURL }) => (
  <Container fluid>
    <Fetch url={dataURL}>{children}</Fetch>
  </Container>
);

BasePage.propTypes = {
  children: PropTypes.func.isRequired,
  dataURL: PropTypes.string.isRequired,
};

export default BasePage;
