import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Header, Table } from "semantic-ui-react";

import Fetch from "../../Fetch";
import Flags from "../../result/Flags";
import Verdict from "../../result/Verdict";
import DocumentTitle from "../../DocumentTitle";
import VariantId from "../../VariantId";
import Page from "../Page";

const VariantResultsPage = ({ variantId }) => {
  return (
    <Page>
      <DocumentTitle title={`Results | ${variantId}`} />
      <Header as="h1" dividing>
        <VariantId variantId={variantId} />
      </Header>
      <div>
        <Link to={`/variant/${variantId}/`}>Return to list of projects for this variant</Link>
      </div>
      <br />

      <Fetch path={`/variant/${variantId}/results/`}>
        {({ data: { results } }) => {
          return (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Project</Table.HeaderCell>
                  <Table.HeaderCell>Curator</Table.HeaderCell>
                  <Table.HeaderCell>Verdict</Table.HeaderCell>
                  <Table.HeaderCell>Flags</Table.HeaderCell>
                  <Table.HeaderCell>Notes</Table.HeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {results.map(result => (
                  <Table.Row key={`${result.project.id}-${result.curator}`}>
                    <Table.Cell>{result.project.name}</Table.Cell>
                    <Table.Cell>{result.curator}</Table.Cell>
                    <Table.Cell>
                      {result.verdict ? <Verdict verdict={result.verdict} /> : "No verdict"}
                    </Table.Cell>
                    <Table.Cell>
                      <Flags result={result} />
                    </Table.Cell>
                    <Table.Cell>{result.notes}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          );
        }}
      </Fetch>
    </Page>
  );
};

VariantResultsPage.propTypes = {
  variantId: PropTypes.string.isRequired,
};

export default VariantResultsPage;
