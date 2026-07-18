'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-4 rounded border border-danger/30 bg-danger-bg text-text-primary text-center my-4 max-w-lg mx-auto">
          <div className="flex items-center justify-center gap-2 text-danger font-semibold mb-1">
            <AlertTriangle size={16} />
            <span>Failed to load content</span>
          </div>
          <p className="text-xs text-text-secondary leading-normal mb-2">
            An unexpected error occurred while rendering this section.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-2.5 py-1 text-2xs font-semibold bg-white dark:bg-enterprise-800 border border-enterprise-300 dark:border-enterprise-700 rounded hover:border-enterprise-400 transition-all text-text-primary"
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
