import React from 'react';

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Keep diagnostics in the console until Sentry (or another APM) is wired in.
    console.error('Unhandled UI error:', error);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#FFFAF0', padding: '24px' }}>
          <div style={{ maxWidth: '520px', textAlign: 'center', background: '#ffffff', borderRadius: '16px', padding: '24px' }}>
            <h2 style={{ marginBottom: '8px' }}>Something went wrong</h2>
            <p style={{ marginBottom: '16px', color: '#5b6470' }}>
              The page hit an unexpected error. Please retry, and if it continues, contact support.
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              style={{ padding: '10px 18px', borderRadius: '999px', background: '#FF8F4B', color: '#fff', border: 'none' }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
