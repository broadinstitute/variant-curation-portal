import PropTypes from "prop-types";
import React from "react";
import { Route, Switch } from "react-router-dom";

import PageNotFoundPage from "../PageNotFoundPage";
import withParamsAsProps from "../withParamsAsProps";
import VariantProjectsPage from "./VariantProjectsPage";
import VariantResultsPage from "./VariantResultsPage";

const VariantPage = ({ match, variantId, user }) => {
  return (
    <Switch>
      <Route
        exact
        path={match.path}
        render={props => <VariantProjectsPage {...props} user={user} variantId={variantId} />}
      />

      <Route
        exact
        path={`${match.path}results/`}
        render={props => <VariantResultsPage {...props} user={user} variantId={variantId} />}
      />

      <Route component={PageNotFoundPage} />
    </Switch>
  );
};

VariantPage.propTypes = {
  match: PropTypes.shape({
    path: PropTypes.string.isRequired,
  }).isRequired,
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
  }),
  variantId: PropTypes.string.isRequired,
};

VariantPage.defaultProps = {
  user: null,
};

export default withParamsAsProps(({ variantId }) => ({ variantId }))(VariantPage);
