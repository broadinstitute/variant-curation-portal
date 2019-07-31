import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Button, Header, Item } from "semantic-ui-react";

import { can } from "../../../permissions";
import DocumentTitle from "../../DocumentTitle";
import Fetch from "../../Fetch";
import Page from "../Page";

const ProjectsPage = ({ user }) => {
  return (
    <Page>
      <DocumentTitle title="Projects" />
      <Header as="h1" dividing>
        Projects
      </Header>

      <Fetch path="/projects/">
        {({ data }) => {
          return (
            <React.Fragment>
              {data.projects.length > 0 ? (
                <React.Fragment>
                  <Item.Group>
                    {data.projects.map(project => (
                      <Item key={project.id}>
                        <Item.Content>
                          <Item.Header>
                            <Link to={`/project/${project.id}/admin/`}>{project.name}</Link>
                          </Item.Header>
                        </Item.Content>
                      </Item>
                    ))}
                  </Item.Group>
                </React.Fragment>
              ) : (
                <p>No projects.</p>
              )}

              {can(user, "add", "project") && (
                <Button as={Link} to="/projects/create">
                  Create project
                </Button>
              )}
            </React.Fragment>
          );
        }}
      </Fetch>
    </Page>
  );
};

ProjectsPage.propTypes = {
  user: PropTypes.shape({
    permissions: PropTypes.arrayOf(PropTypes.string).isRequired,
  }),
};

ProjectsPage.defaultProps = {
  user: null,
};

export default ProjectsPage;
