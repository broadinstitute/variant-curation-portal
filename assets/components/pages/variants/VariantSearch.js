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

const VariantSearch = withRouter(({ history }) => {
  return (
    <Segment attached>
      <Header as="h4">Look up variant</Header>
      <VariantIdForm onSubmit={variantId => history.push(`/variant/${variantId}/`)} />
    </Segment>
  );
});

export default VariantSearch;
