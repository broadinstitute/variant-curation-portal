import React from "react";
import { Link } from "react-router-dom";
import { Header, Item } from "semantic-ui-react";

import DocumentTitle from "../../DocumentTitle";
import BasePage from "../BasePage";

const ProjectsPage = () => {
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
          </React.Fragment>
        );
      }}
    </BasePage>
  );
};

export default ProjectsPage;
