import PropTypes from "prop-types";
import React, { Component } from "react";
import { Popup } from "semantic-ui-react";

import Mousetrap from "../utilities/Mousetrap";

const mousetrap = new Mousetrap();

class KeyboardShortcut extends Component {
  static propTypes = {
    keys: PropTypes.string.isRequired,
    onShortcut: PropTypes.func.isRequired,
  };

  componentDidMount() {
    const { keys, onShortcut } = this.props;
    mousetrap.bind(keys, onShortcut);
  }

  componentDidUpdate(prevProps) {
    const { keys, onShortcut } = this.props;
    if (keys !== prevProps.keys || onShortcut !== prevProps.onShortcut) {
      mousetrap.unbind(prevProps.keys, prevProps.onShortcut);
      mousetrap.bind(keys, onShortcut);
    }
  }

  componentWillUnmount() {
    const { keys, onShortcut } = this.props;
    mousetrap.unbind(keys, onShortcut);
  }

  render() {
    return null;
  }
}

export default KeyboardShortcut;

export const KeyboardShortcutHint = ({ color, keys }) => (
  <Popup
    position="top center"
    trigger={
      <span
        style={{
          borderColor: color,
          borderStyle: "solid",
          borderWidth: "1px",
          borderRadius: "5px",
          padding: "1px 4px 2px",
          marginLeft: "0.5em",
          color,
          fontSize: "0.8em",
        }}
      >
        {keys}
      </span>
    }
  >
    Keyboard shortcut
  </Popup>
);

KeyboardShortcutHint.propTypes = {
  color: PropTypes.string,
  keys: PropTypes.string.isRequired,
};

KeyboardShortcutHint.defaultProps = {
  color: "rgba(0,0,0,0.55)",
};
