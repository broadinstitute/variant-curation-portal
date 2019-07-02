import PropTypes from "prop-types";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import { Dimmer, Loader, Message } from "semantic-ui-react";

import api from "../api";
import makeCancelable from "../utilities/makeCancelable";

class BaseFetch extends Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
    path: PropTypes.string.isRequired,
  };

  state = {
    data: null,
    error: null,
    isFetching: true,
  };

  componentDidMount() {
    this.loadData();
  }

  componentDidUpdate(prevProps) {
    const { path } = this.props;
    if (path !== prevProps.path) {
      this.loadData();
    }
  }

  componentWillUnmount() {
    if (this.currentRequest) {
      this.currentRequest.cancel();
    }
  }

  loadData() {
    const { path } = this.props;

    this.setState({
      isFetching: true,
      error: null,
    });

    if (this.currentRequest) {
      this.currentRequest.cancel();
    }

    this.currentRequest = makeCancelable(api.get(path));
    this.currentRequest.then(
      data => {
        this.setState({
          data,
          error: null,
          isFetching: false,
        });
      },
      error => {
        this.setState({
          data: null,
          error,
          isFetching: false,
        });
      }
    );
  }

  render() {
    const { children } = this.props;
    return children({ ...this.state, refresh: this.loadData.bind(this) });
  }
}

const Fetch = ({ path, children }) => (
  <BaseFetch path={path}>
    {({ data, error, isFetching, refresh }) => {
      if (isFetching) {
        return (
          <Dimmer active inverted>
            <Loader inverted content="Loading" />
          </Dimmer>
        );
      }

      if (error) {
        return (
          <Message error>
            <Message.Header>Error</Message.Header>
            <p>{error.message}</p>
            <p>
              <Link to="/">Return to home page</Link>
            </p>
          </Message>
        );
      }

      return children({ data, refresh });
    }}
  </BaseFetch>
);

Fetch.propTypes = {
  children: PropTypes.func.isRequired,
  path: PropTypes.string.isRequired,
};

export default Fetch;
