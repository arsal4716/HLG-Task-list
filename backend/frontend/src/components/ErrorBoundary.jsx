import { Component } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
          <FiAlertTriangle className="mb-4 h-12 w-12 text-red-500" />
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button className="btn-primary mt-6" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
