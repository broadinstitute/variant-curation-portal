import PropTypes from "prop-types";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Button, Form, Header, Icon, Message, Segment } from "semantic-ui-react";

import api from "../../../../api";
import DocumentTitle from "../../../DocumentTitle";

class ImportResultsPage extends Component {
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

  resultsData = null;

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
      .post(`/project/${project.id}/results/`, this.resultsData)
      .then(() => {
        refreshProject();
        history.push(`/project/${project.id}/admin/`);
      })
      .catch(error => {
        this.setState({ isSaving: false, saveError: error });
      });
  };

  onSelectFile = file => {
    this.resultsData = null;

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
        this.resultsData = JSON.parse(e.target.result);
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
          <Link to={`/project/${project.id}/admin/`}>Return to project</Link>
        </div>
        <br />

        <Segment attached>
          <Header as="h4">Upload results from file</Header>
          <Form error={Boolean(fileReadError || saveError)} onSubmit={this.onSubmit}>
            <Button
              as="label"
              disabled={isReadingFile}
              loading={isReadingFile}
              htmlFor="results-file"
            >
              <Icon name="upload" />
              {fileName || "Select results file"}
              <input
                disabled={isReadingFile}
                hidden
                id="results-file"
                type="file"
                onChange={e => this.onSelectFile(e.target.files[0])}
              />
            </Button>
            {fileReadError && <Message error header="Failed to read file" />}
            {saveError && <Message error header="Failed to upload results" />}
            <Button disabled={!hasFileData || isSaving} loading={isSaving} primary type="submit">
              Upload
            </Button>
          </Form>
        </Segment>
      </React.Fragment>
    );
  }
}

export default ImportResultsPage;
