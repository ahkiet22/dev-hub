'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  appName: string;
  onRetry: () => void;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

export class RemoteErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'Remote crashed' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-500/30 bg-red-500/5 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <h3 className="mt-3 text-sm font-semibold">
            {this.props.appName} encountered an error
          </h3>
          <p className="mt-1 max-w-md font-mono text-xs text-[hsl(var(--muted-foreground))]">
            {this.state.message}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, message: null });
              this.props.onRetry();
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--primary-foreground))]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry Remote
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
