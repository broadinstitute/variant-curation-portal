import React from "react";
import { Container, Header } from "semantic-ui-react";

import DocumentTitle from "../DocumentTitle";

const TermsPage = () => {
  return (
    <Container fluid>
      <DocumentTitle title="Terms of Service" />
      <Header as="h1" dividing>
        Terms of Service
      </Header>
    </Container>
  );
};

export default TermsPage;
