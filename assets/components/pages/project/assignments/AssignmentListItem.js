import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Item, List } from "semantic-ui-react";

import verdicts, { verdictColors, verdictSymbols } from "../../../../constants/verdicts";
import { CurationAssignmentPropType, CurationResultPropType } from "../../../propTypes";
import VariantId from "../../../VariantId";

const Verdict = ({ verdict }) => (
  <span
    style={{
      color: verdictColors[verdict],
    }}
  >
    {verdictSymbols[verdict]}
  </span>
);

Verdict.propTypes = {
  verdict: PropTypes.oneOf(verdicts).isRequired,
};

const Flags = ({ result }) => (
  <span style={{ fontFamily: "monospace" }}>
    {result.flag_mapping_error ? "M" : "_"}
    {result.flag_genotyping_error ? "G" : "_"}
    {result.flag_homopolymer ? "H" : "_"}
    {result.flag_no_read_data ? "N" : "_"}
    {result.flag_reference_error ? "E" : "_"}
    {result.flag_strand_bias ? "S" : "_"}
    {result.flag_mnp ? "P" : "_"}
    {result.flag_essential_splice_rescue ? "R" : "_"}
    {result.flag_minority_of_transcripts ? "T" : "_"}
    {result.flag_weak_exon_conservation ? "C" : "_"}
    {result.flag_last_exon ? "L" : "_"}
    {result.flag_other_transcript_error ? "O" : "_"}
  </span>
);

Flags.propTypes = {
  result: CurationResultPropType.isRequired,
};

const CurationResult = ({ result }) => (
  <React.Fragment>
    {result.verdict && <Verdict verdict={result.verdict} />} <Flags result={result} />{" "}
    {result.notes && (
      <span>
        <strong>note:</strong> {result.notes}
      </span>
    )}
    {result.should_revisit && <div style={{ color: "red" }}>Revisit this variant</div>}
  </React.Fragment>
);

CurationResult.propTypes = {
  result: CurationResultPropType.isRequired,
};

const AssignmentListItem = ({ assignment, projectId }) => {
  const { result, variant } = assignment;

  // Verdict is currently a required field in the curation form.
  // However, it was not in earlier versions of the portal.
  // Thus we have to account for the possibility of a result without a verdict.
  const hasVerdict = Boolean((result || {}).verdict);

  return (
    <Item key={variant.variant_id}>
      <Item.Content>
        <Item.Header>
          {assignment.index + 1}:{" "}
          <Link to={`/project/${projectId}/variant/${variant.id}/curate/`}>
            <VariantId variantId={variant.variant_id} />
          </Link>
        </Item.Header>
        <Item.Meta>
          <List className="variant-attributes" horizontal>
            <List.Item>
              <strong>Genes:</strong> {variant.genes.join(", ")}
            </List.Item>
            <List.Item>
              <strong>AC:</strong> {variant.AC}
            </List.Item>
            <List.Item>
              <strong>AF:</strong> {Number(variant.AF.toPrecision(4)).toExponential()}
            </List.Item>
          </List>
        </Item.Meta>
        <Item.Description>
          {!hasVerdict && <span>No verdict</span>}
          {result && <CurationResult result={result} />}
        </Item.Description>
      </Item.Content>
    </Item>
  );
};

AssignmentListItem.propTypes = {
  assignment: CurationAssignmentPropType.isRequired,
  projectId: PropTypes.number.isRequired,
};

export default AssignmentListItem;
