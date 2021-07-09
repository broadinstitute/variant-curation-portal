import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
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

import { FLAG_LABELS, FLAG_SHORTCUTS } from "../../../../constants/flags";
import verdicts, { verdictLabels } from "../../../../constants/verdicts";
import { saveResult, setResult } from "../../../../redux/actions/curationResultActions";
import {
  getCurationResult,
  getCurationResultErrors,
} from "../../../../redux/selectors/curationResultSelectors";
import { showNotification } from "../../../Notifications";
import { CurationResultPropType } from "../../../propTypes";
import KeyboardShortcut, { KeyboardShortcutHint } from "../../../KeyboardShortcut";

class CurationForm extends React.Component {
  static propTypes = {
    value: CurationResultPropType.isRequired,
    errors: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
  };

  static defaultProps = {
    errors: null,
  };

  formElement = React.createRef();

  constructor(props) {
    super(props);

    this.state = {
      isSaving: false,
    };
  }

  setResultField(field, fieldValue) {
    const { value, onChange } = this.props;
    onChange({ ...value, [field]: fieldValue });
  }

  toggleResultField(field) {
    const { value, onChange } = this.props;
    onChange({ ...value, [field]: !value[field] });
  }

  saveResult() {
    const { value, onSubmit } = this.props;

    this.setState({ isSaving: true });
    onSubmit(value).then(
      () => {
        showNotification({ title: "Success", message: "Curation saved", status: "success" });
        this.setState({ isSaving: false });
      },
      () => {
        showNotification({ title: "Error", message: "Unable to save curation", status: "error" });
        this.setState({ isSaving: false });
      }
    );
  }

  renderFlagInput(field, label, shortcut) {
    const { value } = this.props;
    return (
      <React.Fragment key={field}>
        <Form.Field
          checked={value[field]}
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
    const { value, errors } = this.props;
    const { isSaving } = this.state;

    return (
      <Ref innerRef={this.formElement}>
        <Form
          id="curationForm"
          onSubmit={e => {
            e.preventDefault();
            this.saveResult();
          }}
          error={Boolean(errors)}
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
            value={value.notes}
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
            {[
              "flag_mapping_error",
              "flag_genotyping_error",
              "flag_homopolymer",
              "flag_no_read_data",
              "flag_reference_error",
              "flag_strand_bias",
            ].map(flag => this.renderFlagInput(flag, FLAG_LABELS[flag], FLAG_SHORTCUTS[flag]))}
            <Header sub>Rescue</Header>
            {["flag_mnp", "flag_essential_splice_rescue", "flag_in_frame_exon"].map(flag =>
              this.renderFlagInput(flag, FLAG_LABELS[flag], FLAG_SHORTCUTS[flag])
            )}
            <Header sub>Impact</Header>
            {[
              "flag_minority_of_transcripts",
              "flag_weak_exon_conservation",
              "flag_last_exon",
              "flag_other_transcript_error",
              "flag_first_150_bp",
              "flag_long_exon",
              "flag_low_pext",
              "flag_pext_less_than_half_max",
              "flag_uninformative_pext",
              "flag_weak_gene_conservation",
              "flag_untranslated_transcript",
            ].map(flag => this.renderFlagInput(flag, FLAG_LABELS[flag], FLAG_SHORTCUTS[flag]))}
            <Header sub>Comments</Header>
            {["flag_skewed_ab", "flag_possible_splice_site_rescue"].map(flag =>
              this.renderFlagInput(flag, FLAG_LABELS[flag], FLAG_SHORTCUTS[flag])
            )}
          </div>
          <Header sub>Verdict</Header>
          <Form.Group>
            {verdicts.map((verdict, i) => (
              <React.Fragment key={verdict}>
                <Form.Field
                  control={Radio}
                  checked={value.verdict === verdict}
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
                  onChange={(e, { value: selectedVerdict }) => {
                    this.setResultField("verdict", selectedVerdict);
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
          {errors && errors.verdict && <Message error>{errors.verdict}</Message>}
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

const ConnectedCurationForm = connect(
  state => ({
    errors: getCurationResultErrors(state),
    value: getCurationResult(state),
  }),
  (dispatch, ownProps) => ({
    onChange: result => dispatch(setResult(result)),
    onSubmit: result => dispatch(saveResult(result, ownProps.projectId, ownProps.variantId)),
  })
)(CurationForm);

ConnectedCurationForm.propTypes = {
  projectId: PropTypes.number.isRequired,
  variantId: PropTypes.number.isRequired,
};

export default ConnectedCurationForm;
