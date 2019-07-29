import React from "react";
import { Header } from "semantic-ui-react";

import DocumentTitle from "../DocumentTitle";
import Page from "./Page";

const TermsPage = () => {
  return (
    <Page>
      <DocumentTitle title="Terms of Service" />
      <Header as="h1" dividing>
        Terms of Service
      </Header>
    </Page>
  );
};

export default TermsPage;
