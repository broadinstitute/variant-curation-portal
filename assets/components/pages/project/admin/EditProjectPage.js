import PropTypes from "prop-types";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Header, Message } from "semantic-ui-react";

import api from "../../../../api";
import { PermissionRequired } from "../../../../permissions";
import DocumentTitle from "../../../DocumentTitle";

class EditProjectPage extends Component {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
    project: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
    refreshProject: PropTypes.func.isRequired,
    user: PropTypes.shape({
      username: PropTypes.string.isRequired,
    }),
  };

  static defaultProps = {
    user: null,
  };

  form = React.createRef();

  constructor(props) {
    super(props);

    this.state = {
      isSaving: false,
      projectName: props.project.name,
      saveError: null,
    };
  }

  onSubmit = () => {
    const { history, project, refreshProject } = this.props;
    const { projectName } = this.state;

    this.setState({ isSaving: true, saveError: null });
    api
      .patch(`/project/${project.id}/`, { name: projectName })
      .then(() => {
        refreshProject();
        history.push(`/project/${project.id}/admin/`);
      })
      .catch(error => {
        this.setState({ isSaving: false, saveError: error });
      });
  };

  render() {
    const { project, user } = this.props;
    const { isSaving, projectName, saveError } = this.state;

    return (
      <React.Fragment>
        <DocumentTitle title={project.name} />
        <Header as="h1" dividing>
          {project.name}
        </Header>
        <div>
          <Link to={`/project/${project.id}/admin/`}>Return to project</Link>
        </div>
        <br />

        <PermissionRequired user={user} action="edit" resourceType="project" resource={project}>
          <Form
            ref={this.form}
            error={Boolean(saveError)}
            style={{ marginBottom: "1rem" }}
            onSubmit={this.onSubmit}
          >
            <Form.Field>
              <label htmlFor="project-name">
                Project name
                <input
                  id="project-name"
                  type="text"
                  value={projectName}
                  onChange={e => {
                    this.setState({ projectName: e.target.value });
                  }}
                />
              </label>
            </Form.Field>
            <Button disabled={projectName.length === 0 || isSaving} primary type="submit">
              Save
            </Button>
            {saveError && (
              <Message error>
                <Message.Header>Failed to update project</Message.Header>
                <p>{saveError.message}</p>
              </Message>
            )}
          </Form>
        </PermissionRequired>
      </React.Fragment>
    );
  }
}

export default EditProjectPage;
