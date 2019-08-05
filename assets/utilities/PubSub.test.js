import PubSub from "./PubSub";

describe("PubSub", () => {
  it("should call subscribers with published objects", () => {
    const service = new PubSub();
    const callbackOne = jest.fn();
    const callbackTwo = jest.fn();
    service.subscribe(callbackOne);
    service.subscribe(callbackTwo);
    service.publish({ message: "foo" });
    expect(callbackOne).toHaveBeenCalledWith({ message: "foo" });
    expect(callbackTwo).toHaveBeenCalledWith({ message: "foo" });
  });

  it("should allow removing subscriptions", () => {
    const service = new PubSub();
    const callback = jest.fn();
    service.subscribe(callback);
    service.publish({ n: 1 });
    service.publish({ n: 2 });
    service.unsubscribe(callback);
    service.publish({ n: 3 });

    expect(callback).toHaveBeenCalledTimes(2);
  });
});
