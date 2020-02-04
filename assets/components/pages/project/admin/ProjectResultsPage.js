import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Header, Table } from "semantic-ui-react";

import Fetch from "../../../Fetch";
import { PermissionRequired } from "../../../../permissions";
import Flags from "../../../result/Flags";
import Verdict from "../../../result/Verdict";
import DocumentTitle from "../../../DocumentTitle";
import VariantId from "../../../VariantId";
import Page from "../../Page";

const ProjectResultsPage = ({ project, user }) => {
  return (
    <Page>
      <DocumentTitle title={project.name} />
      <Header as="h1" dividing>
        {project.name}
      </Header>
      <div>
        <Link to={`/project/${project.id}/admin/`}>Return to project</Link>
      </div>
      <br />

      <PermissionRequired user={user} action="edit" resourceType="project" resource={project}>
        <Fetch path={`/project/${project.id}/results/`}>
          {({ data: { results } }) => {
            return (
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.HeaderCell>Variant ID</Table.HeaderCell>
                    <Table.HeaderCell>Curator</Table.HeaderCell>
                    <Table.HeaderCell>Verdict</Table.HeaderCell>
                    <Table.HeaderCell>Flags</Table.HeaderCell>
                    <Table.HeaderCell>Notes</Table.HeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {results.map(result => (
                    <Table.Row key={`${result.variant.variant_id}-${result.curator}`}>
                      <Table.Cell>
                        <VariantId variantId={result.variant.variant_id} />
                      </Table.Cell>
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
      </PermissionRequired>
    </Page>
  );
};

ProjectResultsPage.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  project: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
  }),
};

ProjectResultsPage.defaultProps = {
  user: null,
};

export default ProjectResultsPage;
