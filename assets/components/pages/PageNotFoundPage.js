import React from "react";
import { Link } from "react-router-dom";
import { Header, Message } from "semantic-ui-react";

import DocumentTitle from "../DocumentTitle";
import Page from "./Page";

const PageNotFoundPage = () => {
  return (
    <Page>
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
    </Page>
  );
};

export default PageNotFoundPage;
