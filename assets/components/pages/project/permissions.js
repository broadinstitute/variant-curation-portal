/* eslint-disable import/prefer-default-export */

// Access control is actually enforced server side.
// This is only used for cases where a curator navigates to a page
// that would require project owner permissions to user.
export const canEditProject = (user, project) =>
  user && project.owners && project.owners.includes(user.username);
