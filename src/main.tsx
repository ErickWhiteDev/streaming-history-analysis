import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

type AppErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
    };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message ?? 'Unknown initialization error.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="startup-shell">
          <div className="startup-card panel">
            <h1>Application Error</h1>
            <p>Something failed during startup. Reload this page to try again.</p>
            <div className="status">{this.state.message}</div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
