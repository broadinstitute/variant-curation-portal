import getCookie from "./utilities/getCookie";

class ApiClient {
  // eslint-disable-next-line class-methods-use-this
  request(path, options) {
    return fetch(`/api${path}`, options).then(response => {
      if (!response.ok) {
        throw response;
      }
      return response.json();
    });
  }

  get(path) {
    return this.request(path, {});
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
