import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Button, Header, List, Segment } from "semantic-ui-react";

import DocumentTitle from "../../../DocumentTitle";
import Fetch from "../../../Fetch";
import KeyboardShortcut, { KeyboardShortcutHint } from "../../../KeyboardShortcut";
import VariantId from "../../../VariantId";
import withParamsAsProps from "../../withParamsAsProps";

import CurationForm from "./CurationForm";
import SampleTable from "./SampleTable";
import { UCSCVariantView, UCSCGeneView } from "./UCSC";

class CurateVariantPage extends React.Component {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
    project: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }).isRequired,
    variantId: PropTypes.number.isRequired,
  };

  state = {
    showForm: true,
  };

  curationForm = React.createRef();

  goToVariant(variantId) {
    const { history, project } = this.props;
    this.curationForm.current.saveResult().then(() => {
      history.push(`/project/${project.id}/variant/${variantId}/curate/`);
    });
  }

  render() {
    const { project, variantId } = this.props;
    const { showForm } = this.state;

    return (
      <React.Fragment>
        <Fetch url={`/api/project/${project.id}/variant/${variantId}/curate/`}>
          {({
            data: { variant, next_variant: nextVariant, previous_variant: previousVariant, result },
          }) => {
            return (
              <React.Fragment>
                <DocumentTitle title={`${project.name} | ${variant.variant_id}`} />
                <Header as="h1" dividing id="top">
                  {project.name} | <VariantId variantId={variant.variant_id} />
                </Header>
                <div
                  style={{
                    position: "fixed",
                    right: "10px",
                    top: "60px",
                    zIndex: 1,
                  }}
                >
                  <Segment raised>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        {project.name} | <VariantId variantId={variant.variant_id} />
                      </span>
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
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>
                        Jump to:
                        <List horizontal style={{ marginLeft: "0.5rem", marginRight: "3rem" }}>
                          <List.Item>
                            <a href="#top">top</a>
                          </List.Item>
                          <List.Item>
                            <a href="#gnomad">gnomAD</a>
                          </List.Item>
                          <List.Item>
                            <a href="#ucsc">UCSC (variant)</a>
                          </List.Item>
                          <List.Item>
                            <a href="#ucsc-gene">UCSC (gene)</a>
                          </List.Item>
                        </List>
                      </span>
                      <Button
                        basic
                        size="small"
                        onClick={() => {
                          this.setState(state => ({ ...state, showForm: !state.showForm }));
                        }}
                      >
                        {showForm ? "Hide" : "Show"} form{" "}
                        <KeyboardShortcutHint color="rgba(0, 0, 0, 0.4)" keys="f" />
                      </Button>
                      <KeyboardShortcut
                        keys="f"
                        onShortcut={() => {
                          this.setState(state => ({ ...state, showForm: !state.showForm }));
                        }}
                      />
                    </div>

                    <div style={showForm ? {} : { display: "none" }}>
                      <CurationForm
                        ref={this.curationForm}
                        projectId={project.id}
                        variantId={variantId}
                        initialResult={result || {}}
                      />
                    </div>
                  </Segment>
                </div>

                <div>
                  <Link to={`/project/${project.id}/`}>All variants in this project</Link>
                </div>

                {/**
                Variant information
               */}
                <List>
                  <List.Item>
                    <strong>Filter:</strong> {variant.qc_filter}
                  </List.Item>
                  <List.Item>
                    <strong>Callset AF:</strong> {variant.AF}
                  </List.Item>
                  <List.Item>
                    <strong>Callset AC:</strong> {variant.AC}
                  </List.Item>
                  <List.Item>
                    <strong>Callset AN:</strong> {variant.AN}
                  </List.Item>
                  <List.Item>
                    <strong>Annotations:</strong>
                    <List>
                      {variant.annotations.map(annotation => (
                        <List.Item key={annotation.transcript_id}>
                          {annotation.transcript_id}: {annotation.consequence}
                        </List.Item>
                      ))}
                    </List>
                  </List.Item>
                </List>

                {/**
                Sample list
               */}
                <SampleTable samples={variant.samples} />

                <hr style={{ margin: "30px 0" }} />

                {/**
                References
               */}

                <iframe
                  title="gnomAD browser"
                  id="gnomad"
                  width="100%"
                  height="3900px"
                  src={`https://gnomad.broadinstitute.org/variant/${variant.variant_id}`}
                />
                <br />

                <UCSCVariantView variant={variant} />
                <br />

                <UCSCGeneView variant={variant} />
                <br />
              </React.Fragment>
            );
          }}
        </Fetch>
      </React.Fragment>
    );
  }
}

export default withParamsAsProps(({ variantId }) => ({
  variantId: parseInt(variantId, 10),
}))(CurateVariantPage);
