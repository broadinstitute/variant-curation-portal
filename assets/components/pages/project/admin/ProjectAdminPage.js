import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Button, Header, Item } from "semantic-ui-react";

import DocumentTitle from "../../../DocumentTitle";
import BasePage from "../../BasePage";
import withParamsAsProps from "../../withParamsAsProps";

const ProjectAdminPage = ({ projectId }) => (
  <BasePage dataURL={`/api/project/${projectId}/admin/`} title="Variant">
    {({ data: { project, assignments, variants } }) => {
      return (
        <div id="top">
          <DocumentTitle title={`${project.name} | Admin`} />
          <Header as="h1" dividing>
            {project.name}
          </Header>
          <div>
            <Link to="/projects/">Return to all projects</Link>
          </div>
          <Header as="h2">Manage</Header>
          <p>
            <Link to={`/project/${projectId}/variants`}>Upload variants</Link>
          </p>
          <Header as="h2">Curators</Header>
          <Item.Group>
            {Object.entries(assignments).map(([curator, { total, completed }]) => (
              <Item key={curator}>
                <Item.Content>
                  <Item.Header>{curator}</Item.Header>
                  <Item.Meta>
                    {completed} / {total} variants curated
                  </Item.Meta>
                </Item.Content>
              </Item>
            ))}
          </Item.Group>
          <Header as="h2">Results</Header>
          <p>
            {variants.curated} / {variants.total} variants curated
          </p>
          <Button as="a" download href={`/api/project/${project.id}/results/`}>
            Download
          </Button>
        </div>
      );
    }}
  </BasePage>
);

ProjectAdminPage.propTypes = {
  projectId: PropTypes.number.isRequired,
};

export default withParamsAsProps(({ projectId }) => ({
  projectId: parseInt(projectId, 10),
}))(ProjectAdminPage);
