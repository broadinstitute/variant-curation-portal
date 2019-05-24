import { cloneDeep } from "lodash";
import PropTypes from "prop-types";
import React from "react";
import {
  Button,
  Checkbox,
  Divider,
  Form,
  Header,
  Message,
  Radio,
  Ref,
  TextArea,
} from "semantic-ui-react";

import verdicts, { verdictLabels } from "../../../../constants/verdicts";
import getCookie from "../../../../utilities/getCookie";
import { CurationResultPropType } from "../../../propTypes";
import KeyboardShortcut, { KeyboardShortcutHint } from "../../../KeyboardShortcut";

class CurationForm extends React.Component {
  static propTypes = {
    projectId: PropTypes.number.isRequired,
    variantId: PropTypes.number.isRequired,
    initialResult: CurationResultPropType.isRequired,
  };

  formElement = React.createRef();

  constructor(props) {
    super(props);

    this.state = {
      isSaving: false,
      lastSaveStatusMessage: null,
      lastSaveDidFail: false,
      result: cloneDeep(props.initialResult),
    };
  }

  componentWillUnmount() {
    if (this.clearLastSaveStatusTimeout) {
      clearTimeout(this.clearLastSaveStatusTimeout);
    }
  }

  setResultField(field, value) {
    this.setState(state => ({ ...state, result: { ...state.result, [field]: value } }));
  }

  toggleResultField(field) {
    this.setState(state => ({
      ...state,
      result: { ...state.result, [field]: !state.result[field] },
    }));
  }

  saveResult() {
    const { projectId, variantId } = this.props;
    const { result } = this.state;

    this.setState({ isSaving: true, lastSaveStatusMessage: null });
    if (this.clearLastSaveStatusTimeout) {
      clearTimeout(this.clearLastSaveStatusTimeout);
    }

    return new Promise((resolve, reject) => {
      fetch(`/api/project/${projectId}/variant/${variantId}/curate/`, {
        body: JSON.stringify(result),
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        method: "POST",
      })
        .then(response => {
          if (response.ok) {
            return response.json();
          }
          throw response;
        })
        .then(() => {
          this.setState(
            { isSaving: false, lastSaveDidFail: false, lastSaveStatusMessage: "Saved" },
            resolve
          );
          this.clearLastSaveStatusTimeout = setTimeout(() => {
            this.setState({ lastSaveStatusMessage: null });
          }, 3000);
        })
        .catch(() => {
          this.setState(
            { isSaving: false, lastSaveDidFail: true, lastSaveStatusMessage: "Failed" },
            reject
          );
          this.clearLastSaveStatusTimeout = setTimeout(() => {
            this.setState({ lastSaveStatusMessage: null });
          }, 3000);
        });
    });
  }

  // eslint-disable-next-line
  renderFlagInput(field, label, shortcut) {
    const { result } = this.state;
    return (
      <React.Fragment>
        <Form.Field
          checked={result[field]}
          className="mousetrap"
          control={Checkbox}
          id={field}
          label={{
            children: (
              <React.Fragment>
                {label}
                <KeyboardShortcutHint keys={shortcut} />
              </React.Fragment>
            ),
          }}
          onChange={e => {
            this.setResultField(field, e.target.checked);
          }}
        />
        <KeyboardShortcut
          keys={shortcut}
          onShortcut={() => {
            this.toggleResultField(field);
          }}
        />
      </React.Fragment>
    );
  }

  render() {
    const { isSaving, lastSaveDidFail, lastSaveStatusMessage, result } = this.state;

    return (
      <Ref innerRef={this.formElement}>
        <Form
          id="curationForm"
          onSubmit={e => {
            e.preventDefault();
            this.saveResult();
          }}
          error={lastSaveStatusMessage ? lastSaveDidFail : undefined}
          success={lastSaveStatusMessage ? !lastSaveDidFail : undefined}
        >
          <Form.Field
            control={TextArea}
            id="notes"
            label={{
              children: (
                <React.Fragment>
                  Notes
                  <KeyboardShortcutHint keys="n o" />
                </React.Fragment>
              ),
            }}
            value={result.notes}
            onChange={e => {
              this.setResultField("notes", e.target.value);
            }}
          />
          <KeyboardShortcut
            keys="n o"
            onShortcut={e => {
              document.getElementById("notes").focus();
              e.preventDefault(); // Prevent shortcut from being typed into textarea
            }}
          />
          <Header sub style={{ margin: "0.25em 0 0.5em" }}>
            Technical
          </Header>
          {this.renderFlagInput("flag_mapping_error", "Mapping error flag", "m a")}
          {this.renderFlagInput("flag_genotyping_error", "Genotyping error flag", "g e")}
          {this.renderFlagInput("flag_homopolymer", "Homopolymer flag", "h o")}
          {this.renderFlagInput("flag_no_read_data", "No read data", "n r")}
          {this.renderFlagInput("flag_reference_error", "Reference error", "r e")}
          {this.renderFlagInput("flag_strand_bias", "Strand bias", "b i")}
          <Header sub style={{ margin: "0.25em 0 0.5em" }}>
            Rescue
          </Header>
          {this.renderFlagInput("flag_mnp", "In-phase MNV or frame-restoring indel", "i n")}
          {this.renderFlagInput(
            "flag_essential_splice_rescue",
            "Essential splice site rescue",
            "e s"
          )}
          <Header sub style={{ margin: "0.25em 0 0.5em" }}>
            Impact
          </Header>
          {this.renderFlagInput("flag_minority_of_transcripts", "Minority of transcripts", "m i")}
          {this.renderFlagInput("flag_weak_exon_conservation", "Weak exon conservation", "w e")}
          {this.renderFlagInput("flag_last_exon", "Last exon", "l e")}
          {this.renderFlagInput("flag_other_transcript_error", "Other transcript error", "o t")}
          <Header sub style={{ margin: "0.25em 0 0.5em" }}>
            Verdict
          </Header>
          <Form.Group>
            {verdicts.map((verdict, i) => (
              <React.Fragment key={verdict}>
                <Form.Field
                  control={Radio}
                  checked={result.verdict === verdict}
                  label={{
                    children: (
                      <React.Fragment>
                        {verdictLabels[verdict]}
                        <KeyboardShortcutHint keys={`${i + 1}`} />
                      </React.Fragment>
                    ),
                  }}
                  name="verdict"
                  value={verdict}
                  onChange={(e, { value }) => {
                    this.setResultField("verdict", value);
                  }}
                />
                <KeyboardShortcut
                  keys={`${i + 1}`}
                  onShortcut={() => {
                    this.setResultField("verdict", verdict);
                  }}
                />
              </React.Fragment>
            ))}
          </Form.Group>
          <Divider />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              <Button
                data-shortcut="s"
                disabled={isSaving}
                loading={isSaving}
                primary
                type="submit"
              >
                Save <KeyboardShortcutHint keys="s" color="rgba(255,255,255,0.8)" />
              </Button>
            </span>
            <KeyboardShortcut
              keys="s"
              onShortcut={() => {
                this.saveResult();
              }}
            />

            {this.renderFlagInput("should_revisit", "Revisit this variant", "r v")}
          </div>

          <Message
            error={lastSaveDidFail}
            header={lastSaveStatusMessage}
            success={!lastSaveDidFail}
          />
        </Form>
      </Ref>
    );
  }
}

export default CurationForm;
