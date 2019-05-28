import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Button, Header, Item } from "semantic-ui-react";

import DocumentTitle from "../../DocumentTitle";
import BasePage from "../BasePage";

const ProjectsPage = ({ user }) => {
  return (
    <BasePage dataURL="/api/projects/">
      {({ data }) => {
        return (
          <React.Fragment>
            <Header as="h1" dividing>
              Projects
            </Header>
            <DocumentTitle title="Projects" />
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

            {user && user.permissions.includes("add_project") && (
              <Button as={Link} to="/projects/create">
                Create project
              </Button>
            )}
          </React.Fragment>
        );
      }}
    </BasePage>
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
