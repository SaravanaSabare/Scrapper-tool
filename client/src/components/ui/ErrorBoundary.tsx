import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => this.setState({ hasError: false, message: '' })

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex min-h-50 flex-col items-center justify-center gap-4 rounded-lg border border-(--danger)/30 bg-(--danger)/5 p-8 text-center">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-mono-accent text-sm font-semibold text-(--danger)">Something went wrong</p>
            <p className="mt-1 font-mono-accent text-xs text-(--text-faint)">{this.state.message}</p>
          </div>
          <button
            onClick={this.reset}
            className="rounded-md border border-(--border) bg-(--surface-elevated) px-4 py-2 font-mono-accent text-xs text-(--text-muted) transition hover:text-(--text-primary)"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary
