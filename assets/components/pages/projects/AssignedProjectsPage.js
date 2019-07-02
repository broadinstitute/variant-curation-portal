import React from "react";
import { Link } from "react-router-dom";
import { Header, Item } from "semantic-ui-react";

import DocumentTitle from "../../DocumentTitle";
import BasePage from "../BasePage";

const AssignedProjectsPage = () => {
  return (
    <BasePage dataPath="/assignments/">
      {({ data }) => {
        return (
          <React.Fragment>
            <Header as="h1" dividing>
              Assignments
            </Header>
            <DocumentTitle title="Assignments" />
            {data.projects.length > 0 ? (
              <Item.Group>
                {data.projects.map(project => (
                  <Item key={project.id}>
                    <Item.Content>
                      <Item.Header>
                        <Link to={`/project/${project.id}/`}>{project.name}</Link>
                      </Item.Header>
                      <Item.Meta>
                        {project.variants_curated} / {project.variants_assigned} variants curated
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
    </BasePage>
  );
};

export default AssignedProjectsPage;
