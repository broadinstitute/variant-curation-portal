import PropTypes from "prop-types";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Header, Label, List, Message, Segment } from "semantic-ui-react";

import api from "../../../../api";
import { PermissionRequired } from "../../../../permissions";
import DocumentTitle from "../../../DocumentTitle";
import Page from "../../Page";

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
      currentOwners: props.project.owners,
      newOwners: [],
      removedOwners: [],
      saveError: null,
    };
  }

  onSubmit = () => {
    const { history, project, refreshProject } = this.props;
    const { currentOwners, newOwners, removedOwners } = this.state;
    const owners = currentOwners.filter(u => !removedOwners.includes(u)).concat(newOwners);

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
    const {
      inputUsername,
      isSaving,
      currentOwners,
      newOwners,
      removedOwners,
      saveError,
    } = this.state;

    const allOwners = [
      ...currentOwners.map(username => ({
        username,
        isNew: false,
        isRemoved: removedOwners.includes(username),
      })),
      ...newOwners.map(username => ({ username, isNew: true, isRemoved: false })),
    ].sort((owner1, owner2) => owner1.username.localeCompare(owner2.username));

    return (
      <Page>
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
                {allOwners.map(owner => (
                  <List.Item key={owner.username}>
                    <List.Content floated="left">
                      <List.Header>
                        {owner.username}
                        {owner.isNew && (
                          <Label color="green" size="mini" style={{ marginLeft: "1em" }}>
                            New
                          </Label>
                        )}
                        {owner.isRemoved && (
                          <Label color="red" size="mini" style={{ marginLeft: "1em" }}>
                            Removed
                          </Label>
                        )}
                      </List.Header>
                    </List.Content>
                    <List.Content floated="right">
                      <Button
                        compact
                        disabled={owner.username === user.username || owner.isRemoved}
                        floated="right"
                        icon="times"
                        size="mini"
                        type="button"
                        onClick={() => {
                          if (owner.isNew) {
                            this.setState(state => ({
                              newOwners: state.newOwners.filter(u => u !== owner.username),
                            }));
                          } else {
                            this.setState(state => ({
                              removedOwners: [...state.removedOwners, owner.username],
                            }));
                          }
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
                      this.setState(state => {
                        if (state.removedOwners.includes(inputUsername)) {
                          return {
                            inputUsername: "",
                            removedOwners: state.removedOwners.filter(u => u !== inputUsername),
                          };
                        }
                        return {
                          inputUsername: "",
                          newOwners: [...state.newOwners, inputUsername],
                        };
                      });
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
              <Button
                disabled={(newOwners.length === 0 && removedOwners.length === 0) || isSaving}
                primary
                type="submit"
              >
                Save
              </Button>
              {saveError && <Message error header="Failed to update project owners" />}
            </Segment>
          </Form>
        </PermissionRequired>
      </Page>
    );
  }
}

export default EditProjectOwnersPage;
