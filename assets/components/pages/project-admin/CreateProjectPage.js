import PropTypes from "prop-types";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Button, Container, Form, Header, Message } from "semantic-ui-react";

import getCookie from "../../../utilities/getCookie";
import DocumentTitle from "../../DocumentTitle";

class CreateProjectPage extends Component {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
  };

  state = {
    isSaving: false,
    lastSaveDidFail: false,
    projectName: "",
  };

  onCreateProject = () => {
    const { history } = this.props;
    const { projectName } = this.state;

    this.setState({ isSaving: true, lastSaveDidFail: false });
    fetch("/api/projects/create/", {
      body: JSON.stringify({ name: projectName }),
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      method: "POST",
    })
      .then(response => {
        if (!response.ok) {
          throw response;
        }
        return response.json();
      })
      .then(project => {
        this.setState({ isSaving: false });
        history.push(`/project/${project.id}/admin/`);
      })
      .catch(() => {
        this.setState({ isSaving: false, lastSaveDidFail: true });
      });
  };

  render() {
    const { isSaving, lastSaveDidFail, projectName } = this.state;

    return (
      <Container>
        <DocumentTitle title="Create Project" />
        <Header as="h1" dividing>
          Create Project
        </Header>
        <div>
          <Form style={{ marginBottom: "1rem" }} onSubmit={this.onCreateProject}>
            <Form.Input
              id="project-name"
              label="Project Name"
              required
              value={projectName}
              onChange={e => {
                this.setState({ projectName: e.target.value });
              }}
            />
            {lastSaveDidFail && <Message error header="Failed to create project" />}
            <Button disabled={isSaving} primary type="submit">
              Create Project
            </Button>
          </Form>
          <Button as={Link} to="/">
            Cancel
          </Button>
        </div>
      </Container>
    );
  }
}

export default CreateProjectPage;
