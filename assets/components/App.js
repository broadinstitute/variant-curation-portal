import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import { Provider, connect } from "react-redux";
import { BrowserRouter as Router, Link, Redirect, Route, Switch } from "react-router-dom";
import "semantic-ui-css/semantic.css";
import { Container, Dimmer, Dropdown, Loader, Menu } from "semantic-ui-react";

import { loadAppSettings } from "../redux/actions/appActions";
import { loadUser } from "../redux/actions/userActions";
import { getAppSettings } from "../redux/selectors/appSettingsSelectors";
import { getUser } from "../redux/selectors/userSelectors";
import store from "../redux/store";
import Notifications from "./Notifications";
import HomePage from "./pages/HomePage";
import PageNotFoundPage from "./pages/PageNotFoundPage";
import AssignedProjectsPage from "./pages/projects/AssignedProjectsPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import CreateProjectPage from "./pages/projects/CreateProjectPage";
import ProjectPage from "./pages/project/ProjectPage";
import SettingsPage from "./pages/SettingsPage";
import VariantsPage from "./pages/variants/VariantsPage";
import VariantPage from "./pages/variant/VariantPage";

const App = ({ settings, user }) => {
  return (
    <div style={{ height: "100%", padding: "45px 0 0" }}>
      <Menu fixed="top">
        <Container fluid>
          <Menu.Item header>
            <Link to="/">Variant Curation</Link>
          </Menu.Item>
          <Menu.Item>
            <Link to="/assignments/">Assignments</Link>
          </Menu.Item>
          <Menu.Item>
            <Link to="/projects/">Projects</Link>
          </Menu.Item>
          <Menu.Item>
            <Link to="/variants/">Variants</Link>
          </Menu.Item>
          <Menu.Menu position="right">
            <Dropdown item text={user.username}>
              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/settings/">
                  Settings
                </Dropdown.Item>
                {settings.sign_out_url && (
                  <Dropdown.Item as="a" href={settings.sign_out_url}>
                    Sign out
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </Menu.Menu>
        </Container>
      </Menu>

      <div style={{ height: "100%", overflow: "auto" }}>
        <Switch>
          <Route
            exact
            path="/"
            render={props => (user ? <Redirect to="/assignments/" /> : <HomePage {...props} />)}
          />
          <Route
            exact
            path="/assignments/"
            render={props => <AssignedProjectsPage {...props} user={user} />}
          />
          <Route
            exact
            path="/projects/"
            render={props => <ProjectsPage {...props} user={user} />}
          />
          <Route
            exact
            path="/projects/create/"
            render={props => <CreateProjectPage {...props} user={user} />}
          />

          <Route
            path="/project/:projectId/"
            render={props => <ProjectPage {...props} user={user} />}
          />

          <Route path="/settings/" render={props => <SettingsPage {...props} user={user} />} />

          <Route path="/variants/" render={props => <VariantsPage {...props} user={user} />} />

          <Route
            path="/variant/:variantId/"
            render={props => <VariantPage {...props} user={user} />}
          />

          <Route component={PageNotFoundPage} />
        </Switch>
      </div>

      <Notifications />
    </div>
  );
};

App.propTypes = {
  settings: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
  }).isRequired,
};

const ConnectedApp = connect(
  state => ({
    settings: getAppSettings(state),
    user: getUser(state),
  }),
  dispatch => ({
    initializeApp: () => Promise.all([dispatch(loadAppSettings()), dispatch(loadUser())]),
  })
)(({ initializeApp, ...otherProps }) => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeApp().then(() => {
      setIsInitializing(false);
    });
  }, []);

  if (isInitializing) {
    return (
      <Dimmer active inverted>
        <Loader inverted content="Loading" />
      </Dimmer>
    );
  }

  return <App {...otherProps} />;
});

export default () => {
  return (
    <Provider store={store}>
      <Router>
        <ConnectedApp />
      </Router>
    </Provider>
  );
};
