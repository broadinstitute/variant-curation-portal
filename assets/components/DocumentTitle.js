import PropTypes from "prop-types";
import { Component } from "react";

class DocumentTitle extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
  };

  componentDidMount() {
    this.updateTitle();
  }

  componentDidUpdate() {
    this.updateTitle();
  }

  updateTitle() {
    const { title } = this.props;
    if (document.title !== title) {
      document.title = title;
    }
  }

  render() {
    return null;
  }
}

export default DocumentTitle;
