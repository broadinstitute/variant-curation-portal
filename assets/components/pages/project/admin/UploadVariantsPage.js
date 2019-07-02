import PropTypes from "prop-types";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Header, Icon, List, Message, Modal, Segment } from "semantic-ui-react";

import api from "../../../../api";
import variantSchemaContent from "../../../../variants-schema.json";
import DocumentTitle from "../../../DocumentTitle";

class UploadVariantsPage extends Component {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
    project: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
    refreshProject: PropTypes.func.isRequired,
  };

  variantData = null;

  state = {
    fileName: null,
    fileReadError: null,
    hasFileData: false,
    isReadingFile: false,
    isSchemaModalOpen: false,
    isSaving: false,
    saveError: null,
  };

  onSubmit = () => {
    const { history, project, refreshProject } = this.props;

    this.setState({ isSaving: true, saveError: null });
    api
      .post(`/project/${project.id}/variants/`, this.variantData)
      .then(() => {
        refreshProject();
        history.push(`/project/${project.id}/admin/`);
      })
      .catch(error => {
        this.setState({ isSaving: false, saveError: error });
      });
  };

  onSelectFile = file => {
    this.variantData = null;

    if (!file) {
      this.setState({
        fileName: null,
        fileReadError: null,
        hasFileData: false,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        this.variantData = JSON.parse(e.target.result);
        this.setState({ hasFileData: true, isReadingFile: false });
      } catch (err) {
        this.setState({ fileReadError: "Parse error", isReadingFile: false });
      }
    };
    reader.onerror = () => {
      this.setState({ fileReadError: "Read error", isReadingFile: false });
    };
    this.setState({
      fileName: file.name,
      fileReadError: null,
      hasFileData: false,
      isReadingFile: true,
    });
    reader.readAsText(file);
  };

  render() {
    const { project } = this.props;
    const {
      fileName,
      fileReadError,
      hasFileData,
      isReadingFile,
      isSaving,
      isSchemaModalOpen,
      saveError,
    } = this.state;

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

        <Segment attached>
          <Header as="h4">Upload variants from file</Header>
          <Form error={Boolean(fileReadError || saveError)} onSubmit={this.onSubmit}>
            <Button as="label" htmlFor="variant-file">
              <Icon name="upload" />
              {fileName || "Select variant file"}
              <input
                disabled={isReadingFile}
                hidden
                id="variant-file"
                type="file"
                onChange={e => this.onSelectFile(e.target.files[0])}
              />
            </Button>
            {fileReadError && <Message error header="Failed to read file" />}
            {saveError && <Message error header="Failed to upload variants" />}
            <Button disabled={!hasFileData || isSaving} primary type="submit">
              Upload
            </Button>
          </Form>
        </Segment>
        <Message attached size="mini">
          <p>
            This should be a JSON file matching the following{" "}
            <a href="https://json-schema.org" target="_blank" rel="noopener noreferrer">
              schema
            </a>
            :
          </p>
          <List bulleted>
            <List.Item>
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a
                href="#"
                onClick={e => {
                  this.setState({ isSchemaModalOpen: true });
                  e.preventDefault();
                }}
              >
                View schema
              </a>
            </List.Item>
            <List.Item>
              <a download href="/static/bundles/variants-schema.json">
                Download schema
              </a>
            </List.Item>
          </List>
        </Message>

        <Modal
          open={isSchemaModalOpen}
          onClose={() => {
            this.setState({ isSchemaModalOpen: false });
          }}
        >
          <Header>Variants Schema</Header>
          <Modal.Content>
            <pre>{JSON.stringify(variantSchemaContent, null, 2)}</pre>
          </Modal.Content>
          <Modal.Actions>
            <Button
              onClick={() => {
                this.setState({ isSchemaModalOpen: false });
              }}
            >
              Ok
            </Button>
          </Modal.Actions>
        </Modal>
      </React.Fragment>
    );
  }
}

export default UploadVariantsPage;
