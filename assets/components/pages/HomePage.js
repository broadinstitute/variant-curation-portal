import React from "react";
import { Header } from "semantic-ui-react";

import DocumentTitle from "../DocumentTitle";
import Page from "./Page";

const HomePage = () => {
  return (
    <Page>
      <DocumentTitle title="Variant Curation" />
      <Header as="h1" dividing>
        Variant Curation
      </Header>
    </Page>
  );
};

export default HomePage;
