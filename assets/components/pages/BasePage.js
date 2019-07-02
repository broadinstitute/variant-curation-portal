import PropTypes from "prop-types";
import React from "react";
import { Container } from "semantic-ui-react";

import Fetch from "../Fetch";

const BasePage = ({ children, dataPath }) => (
  <Container fluid>
    <Fetch path={dataPath}>{children}</Fetch>
  </Container>
);

BasePage.propTypes = {
  children: PropTypes.func.isRequired,
  dataPath: PropTypes.string.isRequired,
};

export default BasePage;
