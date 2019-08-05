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

import api from "../../../../api";
import verdicts, { verdictLabels } from "../../../../constants/verdicts";
import { showNotification } from "../../../Notifications";
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
      result: cloneDeep(props.initialResult),
      saveError: null,
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

    this.setState({ isSaving: true, saveError: null });

    return new Promise((resolve, reject) => {
      api.post(`/project/${projectId}/variant/${variantId}/curate/`, result).then(
        () => {
          showNotification({ title: "Success", message: "Curation saved", status: "success" });
          this.setState({ isSaving: false }, resolve);
        },
        err => {
          showNotification({ title: "Error", message: "Unable to save curation", status: "error" });
          this.setState({ isSaving: false, saveError: err }, reject);
        }
      );
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
    const { isSaving, result, saveError } = this.state;

    return (
      <Ref innerRef={this.formElement}>
        <Form
          id="curationForm"
          onSubmit={e => {
            e.preventDefault();
            this.saveResult();
          }}
          error={Boolean(saveError)}
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
          <div style={{ columns: 2 }}>
            <Header sub>Technical</Header>
            {this.renderFlagInput("flag_mapping_error", "Mapping error", "m a")}
            {this.renderFlagInput("flag_genotyping_error", "Genotyping error", "g e")}
            {this.renderFlagInput("flag_homopolymer", "Homopolymer", "h o")}
            {this.renderFlagInput("flag_no_read_data", "No read data", "n r")}
            {this.renderFlagInput("flag_reference_error", "Reference error", "r e")}
            {this.renderFlagInput("flag_strand_bias", "Strand bias", "b i")}
            <Header sub>Rescue</Header>
            {this.renderFlagInput("flag_mnp", "In-phase MNV or frame-restoring indel", "i n")}
            {this.renderFlagInput(
              "flag_essential_splice_rescue",
              "Essential splice site rescue",
              "e s"
            )}
            <Header sub>Impact</Header>
            {this.renderFlagInput("flag_minority_of_transcripts", "Minority of transcripts", "m i")}
            {this.renderFlagInput("flag_weak_exon_conservation", "Weak exon conservation", "w e")}
            {this.renderFlagInput("flag_last_exon", "Last exon", "l e")}
            {this.renderFlagInput("flag_other_transcript_error", "Other transcript error", "o t")}
          </div>
          <Header sub>Verdict</Header>
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
          {saveError && saveError.data && saveError.data.verdict && (
            <Message error>{saveError.data.verdict}</Message>
          )}
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
        </Form>
      </Ref>
    );
  }
}

export default CurationForm;
