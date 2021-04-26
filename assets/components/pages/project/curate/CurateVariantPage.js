import PropTypes from "prop-types";
import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { Button, Divider, Header, List } from "semantic-ui-react";

import { saveResult, setResult } from "../../../../redux/actions/curationResultActions";
import { getCurationResult } from "../../../../redux/selectors/curationResultSelectors";
import DocumentTitle from "../../../DocumentTitle";
import Fetch from "../../../Fetch";
import KeyboardShortcut, { KeyboardShortcutHint } from "../../../KeyboardShortcut";
import VariantId from "../../../VariantId";
import Flags from "../../../result/Flags";
import Verdict from "../../../result/Verdict";
import withParamsAsProps from "../../withParamsAsProps";

import CurationForm from "./CurationForm";
import { GnomadVariantView, GnomadGeneView } from "./gnomad";
import { UCSCVariantView, UCSCGeneView } from "./UCSC";
import VariantData from "./VariantData";

const ResultVerdict = connect(state => ({
  verdict: getCurationResult(state).verdict,
}))(({ verdict }) => (verdict ? <Verdict verdict={verdict} /> : <span>No verdict</span>));

const ResultFlags = connect(state => ({ result: getCurationResult(state) }))(Flags);

class CurateVariantPage extends React.Component {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
    project: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
    user: PropTypes.shape({
      settings: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    }).isRequired,
    variantId: PropTypes.number.isRequired,
    onLoadResult: PropTypes.func.isRequired,
    saveCurrentResult: PropTypes.func.isRequired,
  };

  state = {
    showForm: true,
  };

  goToVariant(variantId) {
    const { history, project, saveCurrentResult } = this.props;
    saveCurrentResult().then(
      () => {
        history.push(`/project/${project.id}/variant/${variantId}/curate/`);
      },
      () => {}
    );
  }

  render() {
    const { project, user, variantId, onLoadResult } = this.props;
    const { showForm } = this.state;

    return (
      <React.Fragment>
        <Fetch path={`/project/${project.id}/variant/${variantId}/curate/`} onLoad={onLoadResult}>
          {({
            data: {
              index,
              variant,
              next_variant: nextVariant,
              previous_variant: previousVariant,
              result,
            },
          }) => {
            const hasAnnotations = variant.annotations.length > 0;

            return (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div
                  style={{
                    position: "relative",
                    padding: "1.5rem 1.5rem 1rem",
                    border: "1px solid rgba(34, 36, 38, 0.15)",
                    boxShadow: "0px 1px 2px 0 rgba(34, 36, 38, 0.15)",
                  }}
                >
                  <DocumentTitle title={`${project.name} | ${variant.variant_id}`} />
                  <div style={{ display: "flex" }}>
                    <Header as="h1" style={{ flexGrow: 1, marginBottom: "0.21428571rem" }}>
                      {project.name} | {index + 1}: <VariantId variantId={variant.variant_id} />
                    </Header>
                    <div style={{ flexShrink: 0 }}>
                      <List horizontal>
                        <List.Item>
                          {previousVariant ? (
                            <React.Fragment>
                              <Link
                                onClick={e => {
                                  e.preventDefault();
                                  this.goToVariant(previousVariant.id);
                                }}
                                to={`/project/${project.id}/variant/${previousVariant.id}/curate/`}
                              >
                                previous variant <KeyboardShortcutHint keys="[" />
                              </Link>
                              <KeyboardShortcut
                                keys="["
                                onShortcut={() => {
                                  this.goToVariant(previousVariant.id);
                                }}
                              />
                            </React.Fragment>
                          ) : (
                            "previous variant"
                          )}
                        </List.Item>
                        <List.Item>
                          {nextVariant ? (
                            <React.Fragment>
                              <Link
                                onClick={e => {
                                  e.preventDefault();
                                  this.goToVariant(nextVariant.id);
                                }}
                                to={`/project/${project.id}/variant/${nextVariant.id}/curate/`}
                              >
                                next variant <KeyboardShortcutHint keys="]" />
                              </Link>
                              <KeyboardShortcut
                                keys="]"
                                onShortcut={() => {
                                  this.goToVariant(nextVariant.id);
                                }}
                              />
                            </React.Fragment>
                          ) : (
                            "next variant"
                          )}
                        </List.Item>
                      </List>
                    </div>
                  </div>
                  <Divider style={{ margin: "0 0 1rem" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div>
                        <Link to={`/project/${project.id}/`}>All variants in this project</Link>
                      </div>

                      <div>
                        Jump to:
                        <List horizontal style={{ marginLeft: "0.5rem", marginRight: "3rem" }}>
                          <List.Item>
                            <a href="#top">top</a>
                          </List.Item>
                          <List.Item>
                            <a href="#gnomad-variant">
                              gnomAD v{variant.reference_genome === "GRCh37" ? "2" : "3"} (variant)
                            </a>
                          </List.Item>
                          {variant.reference_genome === "GRCh37" ? (
                            <List.Item>
                              {hasAnnotations ? (
                                <a href="#gnomad-v2-gene">gnomAD v2 (gene)</a>
                              ) : (
                                "gnomAD v2 (gene)"
                              )}
                            </List.Item>
                          ) : (
                            <>
                              <List.Item>
                                {hasAnnotations ? (
                                  <a href="#gnomad-v3-gene">gnomAD v3 (gene)</a>
                                ) : (
                                  "gnomAD v3 (gene)"
                                )}
                              </List.Item>
                              <List.Item>
                                {hasAnnotations ? (
                                  <a href="#gnomad-v2-gene">gnomAD v2 (gene)</a>
                                ) : (
                                  "gnomAD v2 (gene)"
                                )}
                              </List.Item>
                            </>
                          )}
                          <List.Item>
                            <a href="#ucsc">UCSC (variant)</a>
                          </List.Item>
                          <List.Item>
                            {hasAnnotations ? <a href="#ucsc-gene">UCSC (gene)</a> : "UCSC (gene)"}
                          </List.Item>
                        </List>
                      </div>
                    </div>
                    <div>
                      <List horizontal>
                        <List.Item>
                          <span style={{ marginRight: "10px" }}>
                            <ResultVerdict />
                          </span>
                          <ResultFlags />
                        </List.Item>
                        <List.Item>
                          <Button
                            basic
                            size="small"
                            onClick={() => {
                              this.setState(state => ({ ...state, showForm: !state.showForm }));
                            }}
                          >
                            {showForm ? "Hide" : "Show"} form{" "}
                            <KeyboardShortcutHint color="rgba(0, 0, 0, 0.4)" keys="f f" />
                          </Button>
                          <KeyboardShortcut
                            keys="f"
                            onShortcut={() => {
                              this.setState(state => ({ ...state, showForm: !state.showForm }));
                            }}
                          />
                        </List.Item>
                      </List>
                    </div>
                  </div>

                  <div
                    style={
                      showForm
                        ? {
                            position: "absolute",
                            right: "1.5rem",
                            top: "100%",
                            zIndex: 1,
                            maxHeight: "calc(100vh - 180px)",
                            overflowX: "hidden",
                            overflowY: "auto",
                            padding: "0 1rem 1rem",
                            borderColor: "rgba(34, 36, 38, 0.15)",
                            borderStyle: "solid",
                            borderWidth: "0 1px 1px",
                            borderRadius: "0 0 0.28571429rem 0.28571429rem",
                            background: "#fff",
                            boxShadow: "0px 1px 2px 0 rgba(34, 36, 38, 0.15)",
                          }
                        : { display: "none" }
                    }
                  >
                    <CurationForm
                      projectId={project.id}
                      variantId={variantId}
                      initialResult={result || {}}
                    />
                  </div>
                </div>

                <div
                  style={{
                    flexGrow: 1,
                    height: "100%",
                    overflow: "auto",
                    padding: "0 1.5rem 1.5rem",
                  }}
                >
                  <a id="top" /> {/* eslint-disable-line */}
                  <VariantData variant={variant} />
                  <hr style={{ margin: "30px 0" }} />
                  <div id="gnomad-variant">
                    <GnomadVariantView
                      gnomadVersion={variant.reference_genome === "GRCh37" ? "2" : "3"}
                      variant={variant}
                    />
                  </div>
                  <br />
                  {variant.reference_genome === "GRCh37" ? (
                    <div id="gnomad-v2-gene">
                      <GnomadGeneView
                        gnomadVersion={variant.reference_genome === "GRCh37" ? "2" : "3"}
                        variant={variant}
                      />
                    </div>
                  ) : (
                    <>
                      <div id="gnomad-v3-gene">
                        <GnomadGeneView gnomadVersion="3" variant={variant} />
                      </div>
                      <br />
                      <div id="gnomad-v2-gene">
                        <GnomadGeneView gnomadVersion="2" variant={variant} />
                      </div>
                    </>
                  )}
                  <br />
                  <UCSCVariantView settings={user.settings} variant={variant} />
                  <br />
                  <UCSCGeneView settings={user.settings} variant={variant} />
                  <br />
                </div>
              </div>
            );
          }}
        </Fetch>
      </React.Fragment>
    );
  }
}

const ConnectedCurateVariantPage = connect(null, (dispatch, ownProps) => ({
  onLoadResult: data => {
    dispatch(setResult(data.result, true));
  },
  saveCurrentResult: () =>
    dispatch((thunkDispatch, getState) => {
      return thunkDispatch(
        saveResult(getCurationResult(getState()), ownProps.project.id, ownProps.variantId)
      );
    }),
}))(CurateVariantPage);

export default withParamsAsProps(({ variantId }) => ({
  variantId: parseInt(variantId, 10),
}))(ConnectedCurateVariantPage);
