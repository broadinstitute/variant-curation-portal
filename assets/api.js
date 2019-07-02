import getCookie from "./utilities/getCookie";

class ApiClient {
  // eslint-disable-next-line class-methods-use-this
  request(path, options) {
    return fetch(`/api${path}`, options).then(response => {
      const isOk = response.ok;
      return response.json().then(
        data => {
          if (isOk) {
            return data;
          }

          const error = new Error(data.detail || "Unknown error");
          error.data = data;
          throw error;
        },
        () => {
          throw new Error("Unable to parse response");
        }
      );
    });
  }

  get(path) {
    return this.request(path, {});
  }

  patch(path, data) {
    return this.request(path, {
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      method: "PATCH",
    });
  }

  post(path, data) {
    return this.request(path, {
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      method: "POST",
    });
  }
}

export default new ApiClient();
