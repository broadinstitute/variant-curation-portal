import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Button, Header, Item, List } from "semantic-ui-react";

import { PermissionRequired } from "../../../../permissions";
import DocumentTitle from "../../../DocumentTitle";

const ProjectAdminPage = ({ project, user }) => {
  const curators = Object.keys(project.assignments);
  return (
    <React.Fragment>
      <DocumentTitle title={project.name} />
      <Header as="h1" dividing>
        {project.name}
      </Header>
      <PermissionRequired user={user} action="edit" resourceType="project" resource={project}>
        <div>
          <Link to="/projects/">Return to all projects</Link>
        </div>
        <Header as="h2">Owners</Header>
        <List bulleted>
          {project.owners.map(username => (
            <List.Item key={username}>{username}</List.Item>
          ))}
        </List>
        <p>
          <Link to={`/project/${project.id}/owners/`}>Edit project owners</Link>
        </p>
        <Header as="h2">Manage</Header>
        <p>
          <Link to={`/project/${project.id}/variants`}>Upload variants</Link>
        </p>
        <Header as="h2">Curators</Header>
        {curators.length ? (
          <Item.Group>
            {curators.map(curator => {
              const { total, completed } = project.assignments[curator];
              return (
                <Item key={curator}>
                  <Item.Content>
                    <Item.Header>{curator}</Item.Header>
                    <Item.Meta>
                      {completed} / {total} variants curated
                    </Item.Meta>
                  </Item.Content>
                </Item>
              );
            })}
          </Item.Group>
        ) : (
          <p>No curators assigned</p>
        )}
        <p>
          <Link to={`/project/${project.id}/assign`}>Assign curators</Link>
        </p>
        <Header as="h2">Results</Header>
        <p>
          {project.variants.curated} / {project.variants.total} variants curated
        </p>
        <p>
          <Link to={`/project/${project.id}/results/import/`}>Import curation results</Link>
        </p>
        <Button as="a" download href={`/api/project/${project.id}/results/export/`}>
          Download
        </Button>
      </PermissionRequired>
    </React.Fragment>
  );
};

ProjectAdminPage.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    assignments: PropTypes.objectOf(
      PropTypes.shape({
        total: PropTypes.number.isRequired,
        completed: PropTypes.number.isRequired,
      })
    ).isRequired,
    variants: PropTypes.shape({
      total: PropTypes.number.isRequired,
      curated: PropTypes.number.isRequired,
    }).isRequired,
  }).isRequired,
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
  }),
};

ProjectAdminPage.defaultProps = {
  user: null,
};

export default ProjectAdminPage;
