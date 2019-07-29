import React from "react";
import { Header } from "semantic-ui-react";

import DocumentTitle from "../DocumentTitle";
import Page from "./Page";

const PrivacyPolicyPage = () => {
  return (
    <Page>
      <DocumentTitle title="Privacy Policy" />
      <Header as="h1" dividing>
        Privacy Policy
      </Header>
    </Page>
  );
};

export default PrivacyPolicyPage;
