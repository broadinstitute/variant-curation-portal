import Mousetrap from "mousetrap";

// Mousetrap doesn't provide a way to remove individual callbacks
// Wrap it to provide that functionality
class MousetrapWrapper {
  callbacks = {};

  constructor() {
    this.mousetrap = new Mousetrap();

    // Allow keyboard shortcuts to work when a checkbox or verdict radio button has focus.
    // The default implementation of stopCallback could be used if it was possible to add
    // the "mousetrap" class to the input elements. However, semantic-ui-react's form
    // components don't support that.
    this.mousetrap.stopCallback = (e, element) => {
      // if the element has the class "mousetrap" then no need to stop
      if (element.classList.contains("mousetrap")) {
        return false;
      }

      // stop for input, select, and textarea
      return (
        (element.tagName === "INPUT" &&
          !(element.type === "checkbox" || element.type === "radio")) ||
        element.tagName === "SELECT" ||
        element.tagName === "TEXTAREA"
      );
    };
  }

  onKeys = (e, keys) => {
    this.callbacks[keys].forEach(cb => {
      cb(e, keys);
    });
  };

  bind(keys, callback) {
    if (!this.callbacks[keys]) {
      this.callbacks[keys] = [];
      this.mousetrap.bind(keys, this.onKeys);
    }

    this.callbacks[keys].push(callback);
  }

  unbind(keys, callback) {
    if (callback) {
      this.callbacks[keys] = this.callbacks[keys].filter(cb => cb !== callback);
    } else {
      this.callbacks[keys] = [];
    }

    if (this.callbacks[keys].length === 0) {
      this.mousetrap.unbind(keys);
      this.callbacks[keys] = null;
    }
  }
}

export default MousetrapWrapper;
