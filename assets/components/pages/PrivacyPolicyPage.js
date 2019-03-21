import React from "react";
import { Container, Header } from "semantic-ui-react";

import DocumentTitle from "../DocumentTitle";

const PrivacyPolicyPage = () => {
  return (
    <Container fluid>
      <DocumentTitle title="Privacy Policy" />
      <Header as="h1" dividing>
        Privacy Policy
      </Header>
    </Container>
  );
};

export default PrivacyPolicyPage;
