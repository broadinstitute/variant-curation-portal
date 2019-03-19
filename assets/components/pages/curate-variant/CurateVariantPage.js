import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Button, Header, List, Segment } from "semantic-ui-react";

import DocumentTitle from "../../DocumentTitle";
import KeyboardShortcut, { KeyboardShortcutHint } from "../../KeyboardShortcut";
import VariantId from "../../VariantId";
import BasePage from "../BasePage";
import withParamsAsProps from "../withParamsAsProps";

import CurationForm from "./CurationForm";

class CurateVariantPage extends React.Component {
  static propTypes = {
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
    projectId: PropTypes.number.isRequired,
    variantId: PropTypes.number.isRequired,
  };

  state = {
    showForm: true,
  };

  curationForm = React.createRef();

  goToVariant(variantId) {
    const { history, projectId } = this.props;
    this.curationForm.current.saveResult().then(() => {
      history.push(`/project/${projectId}/variant/${variantId}/curate/`);
    });
  }

  render() {
    const { projectId, variantId } = this.props;
    const { showForm } = this.state;

    return (
      <BasePage dataURL={`/api/project/${projectId}/variant/${variantId}/curate/`} title="Variant">
        {({
          data: {
            project,
            variant,
            next_variant: nextVariant,
            previous_variant: previousVariant,
            result,
          },
        }) => {
          return (
            <div id="top">
              <DocumentTitle title={`${project.name} | ${variant.variant_id}`} />
              <Header as="h1" dividing>
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
                              to={`/project/${projectId}/variant/${previousVariant.id}/curate/`}
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
                              to={`/project/${projectId}/variant/${nextVariant.id}/curate/`}
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
                      projectId={projectId}
                      variantId={variantId}
                      initialResult={result || {}}
                    />
                  </div>
                </Segment>
              </div>

              <div>
                <Link to={`/project/${projectId}/assignments/`}>All variants in this project</Link>
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
                  <strong>Consequence:</strong> {variant.consequence}
                </List.Item>
              </List>

              {/**
                Sample list
               */}

              {/* <table style={{ borderSpacing: '10px', textAlign: 'center', width: '100%' }}>
          <thead>
            <tr>
              <th />
              <th>Genotype</th>
              <th style={{ width: '150px' }}>
                Allele Balance
                <br />
                <span style={{ fontSize: '10px' }}>REF, ALT (ALT/DP)</span>
              </th>
              <th>DP</th>
              <th>GQ</th>
            </tr>
          </thead>
          <tbody>
            {this.props.samples.map((sample, i) => (
              <tr key={sample.sample_id}>
                <td>{i + 1}</td>
                <td>{sample.GT === '1/1' ? 'HOM' : sample.GT === '0/1' ? 'HET' : sample.GT}</td>
                <td
                  style={{
                    backgroundColor:
                      sample.GT !== '1/1' ? 'white' : sample.AB >= 0.8 ? 'LightGreen' : '#FF9999',
                  }}
                >
                  {sample.AD_REF}, {sample.AD_ALT} ({Math.round(sample.AB * 100)}%)
                </td>
                <td
                  style={{
                    backgroundColor:
                      sample.GT !== '1/1' ? 'white' : sample.DP >= 7 ? 'white' : '#FF9999',
                  }}
                >
                  {sample.DP}
                </td>
                <td>{sample.GQ}</td>
              </tr>
            ))}
          </tbody>
        </table> */}

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

              {/* https://genome.ucsc.edu/FAQ/FAQlink.html
	                https://genome.ucsc.edu/goldenPath/help/customTrack.html#optParams
              */}
              <iframe
                title="UCSC variant view"
                id="ucsc"
                width="100%"
                height="4000px"
                src={`https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=${encodeURIComponent(
                  `chr${variant.chrom}:${parseInt(variant.pos, 10) - 25}-${parseInt(
                    variant.pos,
                    10
                  ) + 25}`
                )}&highlight=${encodeURIComponent(
                  `hg19.chr${variant.chrom}:${parseInt(variant.pos, 10)}-${parseInt(
                    variant.pos,
                    10
                  )}`
                )}`}
              />
              <br />

              {variant.gene_name && variant.transcript_id && (
                <iframe
                  title="UCSC gene view"
                  id="ucsc-gene"
                  width="100%"
                  height="4000px"
                  src={`https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=${
                    variant.gene_name
                  }&singleSearch=knownCanonical&hgFind.matches=${
                    variant.transcript_id
                  }&highlight=${encodeURIComponent(
                    `hg19.chr${variant.chrom}:${parseInt(variant.pos, 10)}-${parseInt(
                      variant.pos,
                      10
                    )}`
                  )}`}
                />
              )}
              <br />
            </div>
          );
        }}
      </BasePage>
    );
  }
}

export default withParamsAsProps(({ projectId, variantId }) => ({
  projectId: parseInt(projectId, 10),
  variantId: parseInt(variantId, 10),
}))(CurateVariantPage);
