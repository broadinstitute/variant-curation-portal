import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Container, Dimmer, Loader, Message } from "semantic-ui-react";

import Fetch from "../Fetch";

const BasePage = ({ children, dataURL }) => (
  <Container fluid>
    <Fetch url={dataURL}>
      {({ data, error, isFetching }) => {
        if (isFetching) {
          return (
            <Dimmer active inverted>
              <Loader inverted content="Loading" />
            </Dimmer>
          );
        }

        if (error) {
          return (
            <div>
              <Message error>
                <Message.Header>Error</Message.Header>
                <p>{data.detail || "Unknown error"}</p>
                <p>
                  <Link to="/">Return to home page</Link>
                </p>
              </Message>
            </div>
          );
        }

        return children({ data, error, isFetching });
      }}
    </Fetch>
  </Container>
);

BasePage.propTypes = {
  children: PropTypes.func.isRequired,
  dataURL: PropTypes.string.isRequired,
};

export default BasePage;
