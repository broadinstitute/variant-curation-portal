import { can } from "./permissions";

describe("can", () => {
  describe("add project", () => {
    it("should return false if a user does not have the add_project permission", () => {
      expect(can({ username: "user1", permissions: [] }, "add", "project")).toBe(false);
    });

    it("should return true if a user does not have the add_project permission", () => {
      expect(can({ username: "user1", permissions: ["add_project"] }, "add", "project")).toBe(true);
    });
  });

  describe("edit project", () => {
    // The project API should not include the owners field if the user is not an owner.
    it("should return false if the project does not have an owners list", () => {
      expect(
        can({ username: "user1" }, "edit", "project", {
          name: "Project Foo",
        })
      ).toBe(false);
    });

    // This should never happen. If the user is not a project owner, then the API
    // should not return the owners list.
    it("should return false if the user is not in the owners list", () => {
      expect(
        can({ username: "user1" }, "edit", "project", {
          name: "Project Foo",
          owners: ["user2"],
        })
      ).toBe(false);
    });

    it("should return true if the user is in the owners list", () => {
      expect(
        can({ username: "user1" }, "edit", "project", {
          name: "Project Foo",
          owners: ["user0", "user1", "user2"],
        })
      ).toBe(true);
    });
  });

  describe("add variant to project", () => {
    it("should return false if the project does not have an owners list", () => {
      expect(
        can(
          { username: "user1", permissions: ["add_variant"] },
          "add_variant_to_project",
          "project",
          {
            name: "Project Foo",
          }
        )
      ).toBe(false);
    });

    it("should return false if the user is not in the owners list", () => {
      expect(
        can(
          { username: "user1", permissions: ["add_variant"] },
          "add_variant_to_project",
          "project",
          {
            name: "Project Foo",
            owners: ["user2"],
          }
        )
      ).toBe(false);
    });

    it("should return false if the user does not have add_variant permission", () => {
      expect(
        can({ username: "user1", permissions: [] }, "add_variant_to_project", "project", {
          name: "Project Foo",
          owners: ["user0", "user1", "user2"],
        })
      ).toBe(false);
    });

    it("should return true if the user is in owners list and has add_variant permission", () => {
      expect(
        can(
          { username: "user1", permissions: ["add_variant"] },
          "add_variant_to_project",
          "project",
          {
            name: "Project Foo",
            owners: ["user1", "user2"],
          }
        )
      ).toBe(true);
    });
  });

  describe("unknown actions and resources", () => {
    it("should throw an error for unknown actions", () => {
      expect(() => {
        can({ username: "user1" }, "remove", "project", {
          name: "Project Foo",
          owners: ["user1"],
        });
      }).toThrow();
    });

    it("should throw an error for unknown resource types", () => {
      expect(() => {
        can({ username: "user1" }, "add", "foo");
      }).toThrow();
    });
  });
});
