import PropTypes from "prop-types";
import React from "react";
import { Link } from "react-router-dom";
import { Header, Item, Segment } from "semantic-ui-react";

import DocumentTitle from "../../../DocumentTitle";
import Fetch from "../../../Fetch";
import Page from "../../Page";
import AssignmentListItem from "./AssignmentListItem";
import Legend from "./Legend";

const ProjectAssignmentsPage = ({ project }) => {
  return (
    <Page>
      <DocumentTitle title={project.name} />
      <Header as="h1" dividing>
        {project.name}
      </Header>
      <div>
        <Link to="/assignments/">All assigned projects</Link>
      </div>

      <Fetch path={`/project/${project.id}/assignments/`}>
        {({ data: { assignments } }) => {
          const numAssignments = assignments.length;
          const numCompleted = assignments.filter(
            assignment => assignment.result && assignment.result.verdict !== null
          ).length;

          const renderedAssignments = assignments.map((assignment, index) => ({
            ...assignment,
            index,
          }));

          return (
            <React.Fragment>
              <Header as="h2">Assigned Variants</Header>
              {numCompleted} completed / {numAssignments} total
              <div
                style={{
                  position: "fixed",
                  right: "10px",
                  top: "60px",
                  zIndex: 1,
                }}
              >
                <Segment raised>
                  <Legend />
                </Segment>
              </div>
              <Item.Group>
                {renderedAssignments.map(assignment => (
                  <AssignmentListItem
                    key={assignment.variant.variant_id}
                    assignment={assignment}
                    projectId={project.id}
                  />
                ))}
              </Item.Group>
            </React.Fragment>
          );
        }}
      </Fetch>
    </Page>
  );
};

ProjectAssignmentsPage.propTypes = {
  project: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};

export default ProjectAssignmentsPage;
