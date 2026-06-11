import React, { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, ShieldAlert, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * GlobalErrorBoundary
 * Handles main-level application crashes with a beautiful standalone recovery screen.
 */
export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🔴 [GlobalErrorBoundary] CRITICAL RENDERING CRASH:", error, errorInfo);
  }

  private handleReset = () => {
    try {
      // Clear potentially corrupt local states
      localStorage.removeItem('lifeos_open_tabs_v2');
      localStorage.removeItem('lifeos_page_meta_map_v2');
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div id="global-error-screen" className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-indigo-500" />
            
            <div className="flex items-center space-x-3 mb-5">
              <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-100 font-sans tracking-tight">System Intervention</h3>
                <p className="text-xs text-zinc-400 font-sans">LifeOS global recovery utility running</p>
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-normal mb-4 font-sans">
              The application encountered a runtime error that prevented launching your workspace. Active tab configurations and memory states have been isolated.
            </p>

            <div className="bg-black/40 border border-zinc-800/60 rounded-xl p-3 mb-5 font-mono text-[11px] text-red-300/90 overflow-auto max-h-[120px] scrollbar-thin">
              <div className="font-bold mb-1 flex items-center space-x-1 text-red-400">
                <AlertCircle className="h-3.5 w-3.5 inline" />
                <span>{this.state.error?.name || "RuntimeError"}:</span>
              </div>
              <div className="whitespace-pre-wrap">{this.state.error?.message}</div>
              {this.state.error?.stack && (
                <div className="mt-2 text-zinc-500 text-[10px] border-t border-zinc-800/40 pt-1.5 leading-relaxed">
                  {this.state.error.stack.split('\n').slice(1, 4).join('\n')}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                id="reset-state-btn"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold font-sans flex items-center justify-center space-x-2 transition-all cursor-pointer font-sans"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Core States</span>
              </button>
              <button
                id="reload-page-btn"
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold font-sans flex items-center justify-center space-x-2 transition-all cursor-pointer font-sans border border-zinc-700/50"
              >
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface WidgetProps {
  children: ReactNode;
  title?: string;
}

interface WidgetState {
  hasError: boolean;
  error: Error | null;
}

/**
 * WidgetErrorBoundary
 * Isolates nested dashboards & widgets so visual components don't crash other page segments.
 */
export class WidgetErrorBoundary extends React.Component<WidgetProps, WidgetState> {
  constructor(props: WidgetProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): WidgetState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🟠 [WidgetErrorBoundary] WIDGET CRASH:`, error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="widget-error-card bg-red-500/[0.02] border border-red-500/20 rounded-2xl p-4 my-2 text-zinc-800 dark:text-zinc-200 relative overflow-hidden font-sans">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-500/10 rounded-xl text-red-500 shrink-0">
              <Bug className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-red-500 dark:text-red-400 font-sans flex items-center space-x-1.5">
                <span>Rendering Interference</span>
                {this.props.title && (
                  <span className="text-[10px] text-zinc-400 font-normal">({this.props.title})</span>
                )}
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal font-sans">
                This widget encountered a crash but other page elements are functioning normally.
              </p>
              <div className="mt-2 bg-zinc-100 dark:bg-black/30 rounded-lg p-2 font-mono text-[10px] text-zinc-600 dark:text-red-300/80 overflow-x-auto select-all border border-zinc-200/50 dark:border-white/5 max-h-[80px]">
                {this.state.error?.name}: {this.state.error?.message}
              </div>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="mt-2 text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 hover:underline flex items-center space-x-1"
              >
                <RotateCcw className="h-3 w-3 inline" />
                <span>Retry Rendering</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
