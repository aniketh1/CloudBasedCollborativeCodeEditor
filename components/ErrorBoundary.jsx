'use client';

import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 Component Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-[#1a1a1a] text-red-400 border border-red-800 rounded">
          <div className="text-center p-4">
            <p className="text-sm font-medium mb-2">Terminal Error</p>
            <p className="text-xs text-gray-400">Component failed to load</p>
            <button 
              className="mt-2 px-3 py-1 text-xs bg-red-800 hover:bg-red-700 rounded"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
