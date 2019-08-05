import React from "react";
import { render } from "@testing-library/react";

import Notifications, { showNotification } from "./Notifications";

describe("Notifications", () => {
  it("should render notifications", () => {
    const { queryAllByTestId } = render(<Notifications />);

    showNotification({ title: "foo" });
    showNotification({ title: "bar" });

    const notifications = queryAllByTestId("notification");
    expect(notifications).toHaveLength(2);

    expect(notifications[0].textContent).toEqual(expect.stringContaining("bar"));
    expect(notifications[1].textContent).toEqual(expect.stringContaining("foo"));
  });

  it("should remove notifications and update subscribers after their duration has expired", () => {
    jest.useFakeTimers();

    const { queryAllByTestId } = render(<Notifications />);

    showNotification({ title: "foo", duration: 5 });
    showNotification({ title: "bar" });

    expect(queryAllByTestId("notification")).toHaveLength(2);
    jest.advanceTimersByTime(3000);
    expect(queryAllByTestId("notification")).toHaveLength(1);
    jest.advanceTimersByTime(2000);
    expect(queryAllByTestId("notification")).toHaveLength(0);
  });
});
