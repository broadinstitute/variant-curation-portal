import PropTypes from "prop-types";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Header, List, Message, Segment } from "semantic-ui-react";

import api from "../../../../api";
import { PermissionRequired } from "../../../../permissions";
import DocumentTitle from "../../../DocumentTitle";

class EditProjectOwnersPage extends Component {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
    project: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      owners: PropTypes.arrayOf(PropTypes.string),
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
      inputUsername: "",
      isSaving: false,
      owners: props.project.owners,
      saveError: null,
    };
  }

  onSubmit = () => {
    const { history, project, refreshProject } = this.props;
    const { owners } = this.state;

    this.setState({ isSaving: true, saveError: null });
    api
      .patch(`/project/${project.id}/`, { owners })
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
    const { inputUsername, isSaving, owners, saveError } = this.state;

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
            <Segment attached>
              <Header as="h4">Project owners</Header>
              <List bulleted divided selection>
                {owners.map(ownerUsername => (
                  <List.Item key={ownerUsername}>
                    <List.Content floated="left">
                      <List.Header>{ownerUsername}</List.Header>
                    </List.Content>
                    <List.Content floated="right">
                      <Button
                        compact
                        disabled={ownerUsername === user.username}
                        floated="right"
                        icon="times"
                        size="mini"
                        type="button"
                        onClick={() => {
                          this.setState(state => ({
                            owners: state.owners.filter(u => u !== ownerUsername),
                          }));
                        }}
                      />
                    </List.Content>
                  </List.Item>
                ))}
              </List>
              <Form.Input
                action={
                  <Button
                    disabled={!inputUsername}
                    type="button"
                    onClick={() => {
                      this.setState(state => ({
                        owners: [...state.owners, inputUsername],
                        inputUsername: "",
                      }));
                    }}
                  >
                    Add
                  </Button>
                }
                label="New owner"
                placeholder="Username"
                value={inputUsername}
                onChange={(e, { value }) => {
                  this.setState({ inputUsername: value });
                }}
              />
            </Segment>
            <Segment attached>
              <Button disabled={owners.length === 0 || isSaving} primary type="submit">
                Save
              </Button>
              {saveError && <Message error header="Failed to update project owners" />}
            </Segment>
          </Form>
        </PermissionRequired>
      </React.Fragment>
    );
  }
}

export default EditProjectOwnersPage;
