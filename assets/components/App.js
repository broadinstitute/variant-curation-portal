import React, { Component } from "react";
import { BrowserRouter as Router, Link, Redirect, Route, Switch } from "react-router-dom";
import "semantic-ui-css/semantic.css";
import { Container, Dimmer, Loader, Menu } from "semantic-ui-react";

import CurateVariantPage from "./pages/curate-variant/CurateVariantPage";
import HomePage from "./pages/HomePage";
import PageNotFoundPage from "./pages/PageNotFoundPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import CreateProjectPage from "./pages/project-admin/CreateProjectPage";
import ProjectAdminPage from "./pages/project-admin/ProjectAdminPage";
import ProjectAssignmentsPage from "./pages/project-assignments/ProjectAssignmentsPage";
import TermsPage from "./pages/TermsPage";
import UploadVariantsPage from "./pages/project-admin/UploadVariantsPage";

class App extends Component {
  state = {
    isInitializing: true,
    user: null,
  };

  componentDidMount() {
    fetch(`/api/profile/`, { credentials: "same-origin" })
      .then(response => {
        if (!response.ok) {
          throw response;
        }
        return response.json();
      })
      .then(data => {
        this.setState({ user: data.user });
      })
      .finally(() => {
        this.setState({ isInitializing: false });
      });
  }

  render() {
    const { isInitializing, user } = this.state;

    if (isInitializing) {
      return (
        <Dimmer active inverted>
          <Loader inverted content="Loading" />
        </Dimmer>
      );
    }

    return (
      <Router>
        <div style={{ padding: "0 1.5rem" }}>
          <Menu fixed="top">
            <Container fluid>
              <Menu.Item header>
                <Link to="/">Variant Curation</Link>
              </Menu.Item>
              <Menu.Item position="right">
                {user ? user.username : <a href="/signin/">Sign in</a>}
              </Menu.Item>
            </Container>
          </Menu>

          <div style={{ paddingTop: "65px" }}>
            <Switch>
              <Route
                exact
                path="/"
                render={props => (user ? <Redirect to="/projects/" /> : <HomePage {...props} />)}
              />
              <Route exact path="/privacy/" component={PrivacyPolicyPage} />
              <Route exact path="/terms/" component={TermsPage} />

              <Route exact path="/projects/" component={ProjectsPage} />
              {user && user.permissions.includes("add_project") && (
                <Route exact path="/projects/create/" component={CreateProjectPage} />
              )}
              <Route
                exact
                path="/project/:projectId/assignments/"
                component={ProjectAssignmentsPage}
              />
              <Route exact path="/project/:projectId/variants/" component={UploadVariantsPage} />
              <Route exact path="/project/:projectId/admin/" component={ProjectAdminPage} />
              <Route
                exact
                path="/project/:projectId/variant/:variantId/curate/"
                component={CurateVariantPage}
              />
              <Route component={PageNotFoundPage} />
            </Switch>
          </div>

          <Menu fixed="bottom" size="mini">
            <Container fluid>
              <Menu.Item>
                <Link to="/privacy/">Privacy Policy</Link>
              </Menu.Item>
              <Menu.Item>
                <Link to="/terms/">Terms of Service</Link>
              </Menu.Item>
            </Container>
          </Menu>
        </div>
      </Router>
    );
  }
}

export default App;
