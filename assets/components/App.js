import React, { Component } from "react";
import { BrowserRouter as Router, Link, Redirect, Route, Switch } from "react-router-dom";
import "semantic-ui-css/semantic.css";
import { Container, Dimmer, Loader, Menu } from "semantic-ui-react";

import api from "../api";
import Notifications from "./Notifications";
import HomePage from "./pages/HomePage";
import PageNotFoundPage from "./pages/PageNotFoundPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import AssignedProjectsPage from "./pages/projects/AssignedProjectsPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import CreateProjectPage from "./pages/projects/CreateProjectPage";
import ProjectPage from "./pages/project/ProjectPage";

class App extends Component {
  state = {
    isInitializing: true,
    user: null,
  };

  componentDidMount() {
    api
      .get(`/profile/`)
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
        <div style={{ height: "100%", padding: "45px 0 35px" }}>
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
              <Menu.Item position="right">
                {user ? user.username : <a href="/signin/">Sign in</a>}
              </Menu.Item>
            </Container>
          </Menu>

          <Notifications />

          <div style={{ height: "100%", overflow: "auto" }}>
            <Switch>
              <Route
                exact
                path="/"
                render={props => (user ? <Redirect to="/assignments/" /> : <HomePage {...props} />)}
              />
              <Route exact path="/privacy/" component={PrivacyPolicyPage} />
              <Route exact path="/terms/" component={TermsPage} />

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
