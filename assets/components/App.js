import React, { Component } from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router, Link, Redirect, Route, Switch } from "react-router-dom";
import "semantic-ui-css/semantic.css";
import { Container, Dimmer, Dropdown, Loader, Menu } from "semantic-ui-react";

import api from "../api";
import store from "../redux/store";
import Notifications from "./Notifications";
import HomePage from "./pages/HomePage";
import PageNotFoundPage from "./pages/PageNotFoundPage";
import AssignedProjectsPage from "./pages/projects/AssignedProjectsPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import CreateProjectPage from "./pages/projects/CreateProjectPage";
import ProjectPage from "./pages/project/ProjectPage";

class App extends Component {
  state = {
    isInitializing: true,
    settings: {},
    user: null,
  };

  componentDidMount() {
    Promise.all([api.get("/profile/"), api.get("/settings/")])
      .then(([profileData, settingsData]) => {
        this.setState({
          user: profileData.user,
          settings: settingsData.settings,
        });
      })
      .finally(() => {
        this.setState({ isInitializing: false });
      });
  }

  render() {
    const { isInitializing, settings, user } = this.state;

    if (isInitializing) {
      return (
        <Dimmer active inverted>
          <Loader inverted content="Loading" />
        </Dimmer>
      );
    }

    return (
      <Provider store={store}>
        <Router>
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
                <Menu.Menu position="right">
                  {settings.sign_out_url ? (
                    <Dropdown item text={user.username}>
                      <Dropdown.Menu>
                        <Dropdown.Item as="a" href={settings.sign_out_url}>
                          Sign out
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  ) : (
                    <Menu.Item position="right">{user.username}</Menu.Item>
                  )}
                </Menu.Menu>
              </Container>
            </Menu>

            <Notifications />

            <div style={{ height: "100%", overflow: "auto" }}>
              <Switch>
                <Route
                  exact
                  path="/"
                  render={props =>
                    user ? <Redirect to="/assignments/" /> : <HomePage {...props} />
                  }
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

                <Route component={PageNotFoundPage} />
              </Switch>
            </div>
          </div>
        </Router>
      </Provider>
    );
  }
}

export default App;
