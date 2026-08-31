import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[YBBF ErrorBoundary Caught]', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          margin: '20px',
          backgroundColor: '#1f1315',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          color: '#ffffff',
          fontFamily: 'monospace',
          zIndex: 99999,
          position: 'relative'
        }}>
          <h2 style={{ color: '#ef4444', fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
            ⚠️ React 렌더링 에러가 발생했습니다 (Debug ErrorBoundary)
          </h2>
          <p style={{ fontSize: '15px', color: '#fca5a5', marginBottom: '16px' }}>
            <strong>Error:</strong> {this.state.error?.toString()}
          </p>
          <div style={{
            backgroundColor: '#0a0a0a',
            padding: '12px',
            borderRadius: '8px',
            overflowX: 'auto',
            fontSize: '12px',
            lineHeight: '1.6',
            color: '#d1d5db',
            maxHeight: '300px'
          }}>
            <strong>Component Stack:</strong>
            <pre style={{ margin: '8px 0 0 0' }}>{this.state.errorInfo?.componentStack || this.state.error?.stack}</pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            새로고침 (Reload)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
