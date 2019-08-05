import { uniqueId } from "lodash";
import React, { Component } from "react";
import { Message } from "semantic-ui-react";

import PubSub from "../utilities/PubSub";

const notificationService = new PubSub();

export const showNotification = notificationService.publish.bind(notificationService);

class Notifications extends Component {
  state = {
    notifications: [],
  };

  removeTimeouts = new Map();

  componentDidMount() {
    notificationService.subscribe(this.addNotification);
  }

  componentWillUnmount() {
    notificationService.unsubscribe(this.addNotification);
    this.removeTimeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
  }

  addNotification = ({ title, message = null, status = "info", duration = 3 }) => {
    const id = uniqueId();
    const notification = {
      id,
      title,
      message,
      status,
    };
    this.setState(state => ({ notifications: [notification, ...state.notifications] }));

    this.removeTimeouts.set(
      id,
      setTimeout(() => {
        this.removeNotification(id);
      }, duration * 1000)
    );
  };

  removeNotification(id) {
    this.setState(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
    this.removeTimeouts.delete(id);
  }

  render() {
    const { notifications } = this.state;

    if (!notifications.length) {
      return null;
    }

    return (
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", right: "1.5rem", top: "1.5rem", zIndex: 2 }}>
          {notifications.map(notification => {
            const { id, title, message, status } = notification;
            return (
              <Message
                key={id}
                data-testid="notification"
                error={status === "error"}
                info={status === "info"}
                success={status === "success"}
                warning={status === "warning"}
                style={{ marginBottom: "1rem" }}
              >
                <Message.Header>{title}</Message.Header>
                {message && <p>{message}</p>}
              </Message>
            );
          })}
        </div>
      </div>
    );
  }
}

export default Notifications;
