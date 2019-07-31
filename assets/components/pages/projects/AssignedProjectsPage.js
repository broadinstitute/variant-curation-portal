import React from "react";
import { Link } from "react-router-dom";
import { Header, Item } from "semantic-ui-react";

import DocumentTitle from "../../DocumentTitle";
import Fetch from "../../Fetch";
import Page from "../Page";

const AssignedProjectsPage = () => {
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
      </Fetch>
    </Page>
  );
};

export default AssignedProjectsPage;
