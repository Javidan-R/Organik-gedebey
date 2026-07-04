// src/components/ui/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 text-5xl">😅</div>
          <h2 className="mb-2 text-xl font-bold text-slate-800">Xəta baş verdi</h2>
          <p className="text-sm text-slate-500">Bir şeylər səhv getdi. Səhifəni yeniləyin.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-emerald-600 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            Yenilə
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}