import api from "./api";

describe("ApiClient", () => {
  it("should prefix the request path with '/api'", async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );

    await api.get("/projects/");

    expect(global.fetch).toHaveBeenCalledWith("/api/projects/", {});

    global.fetch.mockClear();
  });

  it("should handle failed requests", async () => {
    global.fetch = jest.fn().mockImplementation(() => Promise.reject(new Error("Failed to fetch")));

    await expect(api.get("/")).rejects.toThrow("Failed to fetch");

    global.fetch.mockClear();
  });

  it("should handle invalid response", async () => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.reject(new Error()),
      })
    );

    await expect(api.get("/")).rejects.toThrow("Unable to parse response");

    global.fetch.mockClear();
  });

  describe("error responses", () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              reason: "invalid",
            }),
        })
      );
    });

    afterEach(() => {
      global.fetch.mockClear();
    });

    it("should reject", async () => {
      await expect(api.get("/")).rejects.toThrow("Unknown error");
    });

    it("should use the detail error message from the response if available", async () => {
      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              detail: "Something went wrong",
            }),
        })
      );

      await expect(api.get("/")).rejects.toThrow("Something went wrong");
    });

    it("should attach response data to the error", async () => {
      let error;
      try {
        await api.get("/");
      } catch (e) {
        error = e;
      }
      expect(error.data).toEqual({ reason: "invalid" });
    });
  });

  ["post", "patch"].forEach(method => {
    describe(`${method} request`, () => {
      beforeEach(() => {
        global.fetch = jest.fn().mockImplementation(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ success: true }),
          })
        );
      });

      afterEach(() => {
        global.fetch.mockClear();
      });

      it(`should use the '${method.toUpperCase()}' method`, async () => {
        await api[method]("/", {});

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/",
          expect.objectContaining({
            method: method.toUpperCase(),
          })
        );
      });

      it("should set the content type header", async () => {
        await api[method]("/", {});

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/",
          expect.objectContaining({
            headers: expect.objectContaining({
              "Content-Type": "application/json",
            }),
          })
        );
      });

      it("should send the CRSF token", async () => {
        const cookie = jest
          .spyOn(document, "cookie", "get")
          .mockReturnValue("csrftoken=sometoken;");

        await api[method]("/", {});

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/",
          expect.objectContaining({
            headers: expect.objectContaining({
              "X-CSRFToken": "sometoken",
            }),
          })
        );

        cookie.mockReset();
      });

      it("should send request data serialized as JSON", async () => {
        const requestData = { foo: "bar" };

        await api[method]("/", requestData);

        expect(global.fetch).toHaveBeenCalledWith(
          "/api/",
          expect.objectContaining({
            body: '{"foo":"bar"}',
          })
        );
      });

      it("should return response data", async () => {
        const data = await api[method]("/", {});

        expect(data).toEqual({ success: true });
      });
    });
  });
});
