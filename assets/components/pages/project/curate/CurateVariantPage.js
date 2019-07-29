import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Button, Header, List, Segment } from "semantic-ui-react";

import DocumentTitle from "../../../DocumentTitle";
import Fetch from "../../../Fetch";
import KeyboardShortcut, { KeyboardShortcutHint } from "../../../KeyboardShortcut";
import VariantId from "../../../VariantId";
import Page from "../../Page";
import withParamsAsProps from "../../withParamsAsProps";

import CurationForm from "./CurationForm";
import { getGnomadVariantId, GnomadVariantView, GnomadGeneView } from "./gnomad";
import SampleTable from "./SampleTable";
import { UCSCVariantView, UCSCGeneView } from "./UCSC";
import VariantData from "./VariantData";

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
        <Fetch path={`/project/${project.id}/variant/${variantId}/curate/`}>
          {({
            data: {
              index,
              variant,
              next_variant: nextVariant,
              previous_variant: previousVariant,
              result,
            },
          }) => {
            const gnomadVariantId = getGnomadVariantId(variant);
            const hasAnnotations = variant.annotations.length > 0;

            return (
              <Page>
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
                        {project.name} | {index + 1}: <VariantId variantId={variant.variant_id} />
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
                            {gnomadVariantId ? (
                              <a href="#gnomad-variant">gnomAD (variant)</a>
                            ) : (
                              "gnomAD (variant)"
                            )}
                          </List.Item>
                          <List.Item>
                            {hasAnnotations ? (
                              <a href="#gnomad-gene">gnomAD (gene)</a>
                            ) : (
                              "gnomAD (gene)"
                            )}
                          </List.Item>
                          <List.Item>
                            <a href="#ucsc">UCSC (variant)</a>
                          </List.Item>
                          <List.Item>
                            {hasAnnotations ? <a href="#ucsc-gene">UCSC (gene)</a> : "UCSC (gene)"}
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

                    <div
                      style={
                        showForm
                          ? {
                              maxHeight: "calc(100vh - 200px)",
                              overflowX: "hidden",
                              overflowY: "auto",
                            }
                          : { display: "none" }
                      }
                    >
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
                <VariantData variant={variant} />

                {/**
                Sample list
               */}
                {variant.samples.length ? (
                  <SampleTable samples={variant.samples} />
                ) : (
                  <Segment placeholder textAlign="center" style={{ minHeight: "6rem" }}>
                    <Header>Sample data not available for this variant</Header>
                  </Segment>
                )}

                <hr style={{ margin: "30px 0" }} />

                {/**
                References
               */}

                <GnomadVariantView variant={variant} />
                <br />

                <GnomadGeneView variant={variant} />
                <br />

                <UCSCVariantView variant={variant} />
                <br />

                <UCSCGeneView variant={variant} />
                <br />
              </Page>
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
