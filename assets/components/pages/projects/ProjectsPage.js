import React from "react";
import { Link } from "react-router-dom";
import { Header, Item } from "semantic-ui-react";

import DocumentTitle from "../../DocumentTitle";
import BasePage from "../BasePage";

const ProjectsPage = () => {
  return (
    <BasePage dataURL="/api/projects/" title="Projects">
      {({ data }) => {
        return (
          <div>
            <DocumentTitle title="Projects" />
            {data.owned.length > 0 && (
              <React.Fragment>
                <Header as="h2" dividing>
                  Projects
                </Header>
                <Header as="h2">Owned Projects</Header>
                <Item.Group>
                  {data.owned.map(project => (
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
            )}
            {data.assigned.length > 0 && (
              <React.Fragment>
                <Header as="h2">Assigned Projects</Header>
                <Item.Group>
                  {data.assigned.map(project => (
                    <Item key={project.id}>
                      <Item.Content>
                        <Item.Header>
                          <Link to={`/project/${project.id}/assignments/`}>{project.name}</Link>
                        </Item.Header>
                        <Item.Meta>
                          {project.variants_curated} / {project.variants_assigned} variants curated
                        </Item.Meta>
                      </Item.Content>
                    </Item>
                  ))}
                </Item.Group>
              </React.Fragment>
            )}
          </div>
        );
      }}
    </BasePage>
  );
};

export default ProjectsPage;
