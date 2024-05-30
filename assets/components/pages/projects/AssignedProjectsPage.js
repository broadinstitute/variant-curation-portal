import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Button, Header, Item } from "semantic-ui-react";

import DocumentTitle from "../../DocumentTitle";
import Fetch from "../../Fetch";
import Page from "../Page";

const AssignedProjectsPage = ({ user }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const referenceGenome = urlParams.get("reference_genome") || "GRCh37";

  return (
    <Page>
      <DocumentTitle title="Assignments" />
      <Header as="h1" dividing>
        Assignments
      </Header>

      <Fetch path="/assignments/">
        {({ data }) => {
          return (
            <React.Fragment>
              {data.projects.length > 0 ? (
                <Item.Group>
                  {data.projects.map(project => (
                    <Item key={project.id}>
                      <Item.Content>
                        <Item.Header>
                          <Link to={`/project/${project.id}/`}>{project.name}</Link>
                        </Item.Header>
                        <Item.Meta>
                          <p>
                            {project.variants_curated} / {project.variants_assigned} variants
                            curated
                          </p>
                          {/*
                            The restriction that curators can only download their own results is enforced server side.
                            The filter query parameter here is for the case where a project owner is also a curator.
                            For those users, clicking the download button here should download only their own results,
                            not all results for the project.
                           */}
                          <Button
                            as="a"
                            disabled={project.variants_curated === 0}
                            download
                            href={`/api/project/${project.id}/results/export/?curator__username=${user.username}&reference_genome=${referenceGenome}`}
                          >
                            Download results
                          </Button>
                        </Item.Meta>
                      </Item.Content>
                    </Item>
                  ))}
                </Item.Group>
              ) : (
                <p>No assignments.</p>
              )}
            </React.Fragment>
          );
        }}
      </Fetch>
    </Page>
  );
};

AssignedProjectsPage.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
  }),
};

AssignedProjectsPage.defaultProps = {
  user: null,
};

export default AssignedProjectsPage;
