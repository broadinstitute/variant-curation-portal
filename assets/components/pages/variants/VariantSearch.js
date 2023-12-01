import PropTypes from "prop-types";
import React, { useState } from "react";
import { withRouter } from "react-router-dom";
import { Button, Form, Header, Message, Segment } from "semantic-ui-react";

const VARIANT_ID_REGEX = /^(\d+|X|Y)[-:]([0-9]+)[-:]([ACGT]+)[-:]([ACGT]+)$/;

const VariantIdForm = ({ onSubmit }) => {
  const [variantId, setVariantId] = useState("");

  const isValid = !!variantId.match(VARIANT_ID_REGEX);

  const showError = !!variantId && !isValid;

  return (
    <Form error={showError} onSubmit={() => onSubmit(variantId)}>
      <Form.Input
        error={showError}
        id="variant-search-variant-id"
        label="Variant ID"
        placeholder="chrom-pos-ref-alt"
        value={variantId}
        onChange={(e, { value }) => {
          setVariantId(value);
        }}
      />
      <Message error content="Invalid variant ID" />
      <Button disabled={!variantId || !isValid} type="submit">
        Search
      </Button>
    </Form>
  );
};

VariantIdForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

const fetchVariantIdFromClingenRegistry = canonicalAlleleId =>
  fetch(`https://reg.clinicalgenome.org/allele/${canonicalAlleleId.toUpperCase()}`)
    .then(null, () => {
      throw new Error("Error querying ClinGen Allele Registry");
    })
    .then(response => {
      if (response.ok) {
        return response.json();
      }

      if (response.status === 404) {
        throw new Error("Allele not found");
      } else {
        throw new Error("Error querying ClinGen Allele Registry");
      }
    })
    .then(response => {
      const record = response.externalRecords.gnomAD || response.externalRecords.ExAC;
      if (!record) {
        throw new Error("No variant ID found for this allele");
      }

      return record[0].id;
    });

const ClingenAlleleIdForm = ({ onMatch }) => {
  const [caId, setCaId] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const isValid = !!caId.match(/^CA\d+$/i);

  const showError = (!!caId && !isValid) || !!errorMessage;

  return (
    <Form
      error={showError}
      onSubmit={() => {
        setIsFetching(true);
        setErrorMessage(null);
        fetchVariantIdFromClingenRegistry(caId).then(
          variantId => {
            setIsFetching(false);
            onMatch(variantId);
          },
          err => {
            setIsFetching(false);
            setErrorMessage(err.message);
          }
        );
      }}
    >
      <Form.Input
        disabled={isFetching}
        error={showError}
        id="variant-search-clingen-allele-id"
        label="ClinGen Canonical Allele ID"
        placeholder="CA123123"
        value={caId}
        onChange={(e, { value }) => {
          setCaId(value);
        }}
      />
      {errorMessage && (
        <Message error content={errorMessage} onDismiss={() => setErrorMessage(null)} />
      )}
      {!isValid && <Message error content="Invalid canonical allele ID" />}
      <Button disabled={!caId || !isValid || isFetching} type="submit">
        Search
      </Button>
    </Form>
  );
};

ClingenAlleleIdForm.propTypes = {
  onMatch: PropTypes.func.isRequired,
};

const VariantSearch = withRouter(({ history }) => {
  const [searchType, setSearchType] = useState("VariantID");
  const [searchReferenceGenome, setSearchReferenceGenome] = useState("GRCh38");
  return (
    <Segment attached>
      <Header as="h4">Look up variant</Header>

      <Form>
        <Form.Group inline>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label>Look up by</label>
          <Form.Radio
            id="variant-search-type-variant-id"
            label="Variant ID"
            value="VariantID"
            checked={searchType === "VariantID"}
            onChange={(e, { value }) => setSearchType(value)}
          />
          <Form.Radio
            id="variant-search-type-caid"
            label="ClinGen Canonical Allele ID"
            value="CAID"
            checked={searchType === "CAID"}
            onChange={(e, { value }) => setSearchType(value)}
          />
        </Form.Group>
        <Form.Group inline>
          {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
          <label>Reference genome</label>
          <Form.Radio
            id="variant-search-reference-genome-grch38"
            label="GRCh38"
            value="GRCh38"
            checked={searchReferenceGenome === "GRCh38"}
            onChange={(e, { value }) => setSearchReferenceGenome(value)}
          />
          <Form.Radio
            id="variant-search-reference-genome-grch37"
            label="GRCh37"
            value="GRCh37"
            checked={searchReferenceGenome === "GRCh37"}
            onChange={(e, { value }) => setSearchReferenceGenome(value)}
          />
        </Form.Group>
      </Form>

      {searchType === "VariantID" && (
        <VariantIdForm
          onSubmit={variantId =>
            history.push(`/variant/${variantId}/?reference_genome=${searchReferenceGenome}`)
          }
        />
      )}
      {searchType === "CAID" && (
        <ClingenAlleleIdForm
          onMatch={variantId =>
            history.push(`/variant/${variantId}/?reference_genome=${searchReferenceGenome}`)
          }
        />
      )}
    </Segment>
  );
});

export default VariantSearch;
