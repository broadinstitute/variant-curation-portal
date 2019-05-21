import PropTypes from "prop-types";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Header, Icon, Message } from "semantic-ui-react";

import getCookie from "../../../../utilities/getCookie";
import DocumentTitle from "../../../DocumentTitle";
import BasePage from "../../BasePage";
import withParamsAsProps from "../../withParamsAsProps";

class UploadVariantsPage extends Component {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
    projectId: PropTypes.number.isRequired,
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
    const { history, projectId } = this.props;

    this.setState({ isSaving: true, saveError: null });
    fetch(`/api/project/${projectId}/variants/`, {
      body: JSON.stringify(this.variantData),
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
      .then(() => {
        history.push(`/project/${projectId}/admin/`);
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
    const { projectId } = this.props;
    const { fileName, fileReadError, hasFileData, isReadingFile, isSaving, saveError } = this.state;

    return (
      <BasePage dataURL={`/api/project/${projectId}/admin/`} title="Variant">
        {({ data: { project } }) => (
          <div>
            <DocumentTitle title={`${project.name} | Upload Variants`} />
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
              <Button as={Link} to={`/project/${projectId}/admin/`}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </BasePage>
    );
  }
}

export default withParamsAsProps(({ projectId }) => ({
  projectId: parseInt(projectId, 10),
}))(UploadVariantsPage);
