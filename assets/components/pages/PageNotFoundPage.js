import React from "react";
import { Link } from "react-router-dom";
import { Container, Header, Message } from "semantic-ui-react";

import DocumentTitle from "../DocumentTitle";

const PageNotFoundPage = () => {
  return (
    <Container fluid>
      <DocumentTitle title="Page not found" />
      <Header as="h1" dividing>
        Page Not Found
      </Header>
      <Message>
        <p>The page you requested does not exist.</p>
        <p>
          <Link to="/">Return to home page</Link>
        </p>
      </Message>
    </Container>
  );
};

export default PageNotFoundPage;
