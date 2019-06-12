import PropTypes from "prop-types";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Header, Icon, Message } from "semantic-ui-react";

import api from "../../../../api";
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
    const { fileName, fileReadError, hasFileData, isReadingFile, isSaving, saveError } = this.state;

    return (
      <React.Fragment>
        <DocumentTitle title={project.name} />
        <Header as="h1" dividing>
          {project.name}
        </Header>
        <div>
          <Form
            error={Boolean(fileReadError || saveError)}
            style={{ marginBottom: "1rem" }}
            onSubmit={this.onSubmit}
          >
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
          <Button as={Link} to={`/project/${project.id}/`}>
            Cancel
          </Button>
        </div>
      </React.Fragment>
    );
  }
}

export default UploadVariantsPage;
