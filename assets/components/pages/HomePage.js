import React from "react";
import { Container, Header } from "semantic-ui-react";

import DocumentTitle from "../DocumentTitle";

const HomePage = () => {
  return (
    <Container fluid>
      <DocumentTitle title="Variant Curation" />
      <Header as="h1" dividing>
        Variant Curation
      </Header>
    </Container>
  );
};

export default HomePage;
