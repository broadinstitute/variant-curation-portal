import PropTypes from "prop-types";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Header, Icon, List, Message, Segment } from "semantic-ui-react";

import api from "../../../../api";
import { PermissionRequired } from "../../../../permissions";
import DocumentTitle from "../../../DocumentTitle";
import Page from "../../Page";

const downloadTemplateCSV = project => {
  return api.get(`/project/${project.id}/variants/`).then(response => {
    const templateData = response.variants.map(variant => ["CURATOR", variant.variant_id]);
    const csv = `${templateData.map(row => row.join(",")).join("\r\n")}\r\n`;
    const filename = `${project.name}_assignments_template.csv`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.onClick = () => {
      URL.revokeObjectURL(url);
      link.remove();
    };
    document.body.appendChild(link);
    link.click();
  });
};

class AssignVariantsPage extends Component {
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

  variantData = null;

  state = {
    assignments: [],
    assignmentCurator: "",
    assignmentVariant: "",
    isSaving: false,
    saveError: null,
  };

  form = React.createRef();

  onSubmit = () => {
    const { history, project, refreshProject } = this.props;
    const { assignments } = this.state;

    this.setState({ isSaving: true, saveError: null });
    api
      .post(`/project/${project.id}/assignments/`, { assignments })
      .then(() => {
        refreshProject();
        history.push(`/project/${project.id}/admin/`);
      })
      .catch(error => {
        this.setState({ isSaving: false, saveError: error });
      });
  };

  onSelectFile = file => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const lines = e.target.result.split("\n");
      const assignments = lines.filter(Boolean).map(line => {
        const [curator, variantId] = line.split(",");
        return { curator, variant_id: variantId };
      });
      this.setState({ assignments });
    };
    reader.readAsText(file);
  };

  render() {
    const { project, user } = this.props;
    const { assignments, isSaving, assignmentCurator, assignmentVariant, saveError } = this.state;

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
              <Header as="h4">Add assignment</Header>
              <Form.Group widths={2}>
                <Form.Input
                  label="Curator"
                  placeholder="Curator"
                  value={assignmentCurator}
                  onChange={(e, { value }) => {
                    this.setState({ assignmentCurator: value });
                  }}
                />
                <Form.Input
                  label="Variant"
                  placeholder="Variant"
                  value={assignmentVariant}
                  onChange={(e, { value }) => {
                    this.setState({ assignmentVariant: value });
                  }}
                />
              </Form.Group>
              <Button
                disabled={!(assignmentCurator && assignmentVariant)}
                type="button"
                onClick={() => {
                  this.setState(state => ({
                    assignments: [
                      ...state.assignments,
                      { curator: state.assignmentCurator, variant_id: state.assignmentVariant },
                    ],
                    assignmentCurator: "",
                    assignmentVariant: "",
                  }));
                }}
              >
                Add
              </Button>
            </Segment>
            <br />

            <Segment attached>
              <Header as="h4">Import assignments from file</Header>
              <Button as="label" htmlFor="assignments-file">
                <Icon name="upload" />
                Choose file
                <input
                  hidden
                  id="assignments-file"
                  type="file"
                  onChange={e => this.onSelectFile(e.target.files[0])}
                />
              </Button>

              <Button
                type="button"
                onClick={() => {
                  downloadTemplateCSV(project);
                }}
              >
                Download template
              </Button>
            </Segment>
            <Message attached>
              This should be a CSV file with two columns: curator&apos;s username and variant ID
              (chrom-pos-ref-alt). It should not have a header row.
            </Message>
            <br />

            {assignments.length > 0 && (
              <React.Fragment>
                <Segment attached>
                  <List>
                    {assignments.map((assignment, index) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <List.Item key={index}>
                        {assignment.curator}: {assignment.variant_id}
                      </List.Item>
                    ))}
                  </List>
                </Segment>
                <Segment attached>
                  <Button
                    disabled={assignments.length === 0 || isSaving}
                    loading={isSaving}
                    primary
                    type="submit"
                  >
                    Assign curators
                  </Button>
                  {saveError && <Message error header="Failed to assign curators" />}
                </Segment>
              </React.Fragment>
            )}
          </Form>
        </PermissionRequired>
      </Page>
    );
  }
}

export default AssignVariantsPage;
