import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error, info) {
    console.log('Error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong: {this.state.errorMessage}</h1>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
