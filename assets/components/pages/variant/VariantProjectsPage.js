import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Header, Item } from "semantic-ui-react";

import DocumentTitle from "../../DocumentTitle";
import Fetch from "../../Fetch";
import VariantId from "../../VariantId";
import Page from "../Page";

const VariantProjectsPage = ({ variantId }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const referenceGenome = urlParams.get("reference_genome") || "GRCh37";

  return (
    <Page>
      <DocumentTitle title={`Projects | ${variantId}`} />
      <Header as="h1" dividing>
        <VariantId variantId={variantId} referenceGenome={referenceGenome} />
      </Header>

      <p>
        <Link to={`/variants/?reference_genome=${referenceGenome}`}>Return to all variants</Link>
      </p>

      <p>
        <Link to={`/variant/${variantId}/results/?reference_genome=${referenceGenome}`}>
          View all results for this variant
        </Link>
      </p>

      <Fetch
        path={`/variant/${variantId}/projects/`}
        params={{ reference_genome: referenceGenome }}
      >
        {({ data: { variant } }) => {
          const ownedProjects = variant.projects.filter(project => project.is_project_owner);
          const assignedProjects = variant.projects.filter(project => project.is_variant_curator);

          return (
            <React.Fragment>
              <Header as="h2">Projects</Header>
              <p>
                This variant appears in {ownedProjects.length} project
                {ownedProjects.length !== 1 && "s"} that you manage.
              </p>
              <Item.Group>
                {ownedProjects.map(project => (
                  <Item key={project.id}>
                    <Item.Content>
                      <Item.Header>
                        <Link to={`/project/${project.id}/admin/`}>{project.name}</Link>
                      </Item.Header>
                      <Item.Description>
                        {project.assignments.completed} / {project.assignments.total} curation
                        assignments completed.
                      </Item.Description>
                    </Item.Content>
                  </Item>
                ))}
              </Item.Group>

              <Header as="h2">Assignments</Header>
              <p>
                You are assigned to curate this variant in {assignedProjects.length} project
                {assignedProjects.length !== 1 && "s"}.
              </p>
              <Item.Group>
                {assignedProjects.map(project => (
                  <Item key={project.id}>
                    <Item.Content>
                      <Item.Header>
                        <Link to={`/project/${project.id}/variant/${project.variant_id}/curate/`}>
                          {project.name}
                        </Link>
                      </Item.Header>
                    </Item.Content>
                  </Item>
                ))}
              </Item.Group>
            </React.Fragment>
          );
        }}
      </Fetch>
    </Page>
  );
};

VariantProjectsPage.propTypes = {
  variantId: PropTypes.string.isRequired,
};

export default VariantProjectsPage;
