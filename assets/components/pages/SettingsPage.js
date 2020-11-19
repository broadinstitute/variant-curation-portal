import PropTypes from "prop-types";
import React, { useState } from "react";
import { connect } from "react-redux";
import { Button, Form, Header, Message } from "semantic-ui-react";

import { updateUserSettings } from "../../redux/actions/userActions";
import DocumentTitle from "../DocumentTitle";
import Page from "./Page";

const SettingsPage = ({ user, saveSettings }) => {
  const [settingsValues, setSettingsValues] = useState({ ...user.settings });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  return (
    <Page>
      <DocumentTitle title="Settings" />
      <Header as="h1" dividing>
        Settings
      </Header>
      <Form
        error={Boolean(saveError)}
        onSubmit={() => {
          setIsSaving(true);
          setSaveError(null);
          saveSettings(settingsValues)
            .then(() => {
              setIsSaving(false);
            })
            .catch(error => {
              setIsSaving(false);
              setSaveError(error);
            });
        }}
      >
        <h2>UCSC browser settings</h2>
        <p>
          Use a saved{" "}
          <a
            href="https://genome.ucsc.edu/goldenPath/help/hgSessionHelp.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            session
          </a>{" "}
          for the UCSC browser.
        </p>
        <Form.Field>
          <label htmlFor="ucsc_username">
            UCSC browser username
            <input
              id="ucsc_username"
              type="text"
              value={settingsValues.ucsc_username || ""}
              onChange={e => {
                setSettingsValues({ ...settingsValues, ucsc_username: e.target.value });
              }}
            />
          </label>
        </Form.Field>
        <Form.Field>
          <label htmlFor="ucsc_session_name">
            UCSC browser session name
            <input
              id="ucsc_session_name"
              type="text"
              value={settingsValues.ucsc_session_name || ""}
              onChange={e => {
                setSettingsValues({ ...settingsValues, ucsc_session_name: e.target.value });
              }}
            />
          </label>
        </Form.Field>
        <Button disabled={isSaving} primary type="submit">
          Save
        </Button>
        {saveError && (
          <Message error>
            <Message.Header>Failed to save settings</Message.Header>
            <p>{saveError.message}</p>
          </Message>
        )}
      </Form>
    </Page>
  );
};

SettingsPage.propTypes = {
  saveSettings: PropTypes.func.isRequired,
  user: PropTypes.shape({
    settings: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  }).isRequired,
};

export default connect(null, dispatch => ({
  saveSettings: (...args) => dispatch(updateUserSettings(...args)),
}))(SettingsPage);
