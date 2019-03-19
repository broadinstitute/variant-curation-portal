import PropTypes from "prop-types";
import { Component } from "react";

import makeCancelable from "../utilities/makeCancelable";

class Fetch extends Component {
  static propTypes = {
    children: PropTypes.func.isRequired,
    url: PropTypes.string.isRequired,
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
    const { url } = this.props;
    if (url !== prevProps.url) {
      this.loadData();
    }
  }

  componentWillUnmount() {
    if (this.currentRequest) {
      this.currentRequest.cancel();
    }
  }

  loadData() {
    const { url } = this.props;

    this.setState({
      isFetching: true,
      error: null,
    });

    if (this.currentRequest) {
      this.currentRequest.cancel();
    }

    this.currentRequest = makeCancelable(fetch(url));
    this.currentRequest
      .then(response => {
        if (!response.ok) {
          throw response;
        }
        return response.json();
      })
      .then(
        data => {
          this.setState({
            data,
            error: null,
            isFetching: false,
          });
        },
        response =>
          response.json().then(data => {
            this.setState({
              data,
              error: response,
              isFetching: false,
            });
          })
      );
  }

  render() {
    const { children } = this.props;
    return children(this.state);
  }
}

export default Fetch;
