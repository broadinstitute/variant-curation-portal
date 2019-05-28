/* eslint-disable import/prefer-default-export */

// Access control is actually enforced server side.
// This is used for cases where a user navigates to a page
// that would require other permissions to use.

export const can = (user, action, resourceType, resource) => {
  if (!user) {
    return false;
  }

  switch (resourceType) {
    case "project":
      switch (action) {
        case "add":
          return user.permissions.includes("add_project");
        case "edit":
          return resource.owners && resource.owners.includes(user.username);
        default:
          throw new Error(`Unknown action "${action}" for resource type "${resourceType}`);
      }
    default:
      throw new Error(`Unknown resource type "${resourceType}"`);
  }
};
