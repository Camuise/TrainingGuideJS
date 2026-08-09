import { Component, type ErrorInfo, type ReactNode } from "react"

import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  resetErrorBoundary?: () => void
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Unhandled application error:", error, errorInfo)
  }

  private resetErrorBoundary = () => {
    this.setState({ error: null })
    this.props.resetErrorBoundary?.()
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center"
        >
          <h2 className="font-heading text-2xl font-bold">
            Something went wrong
          </h2>
          <p className="max-w-md text-xs/relaxed text-muted-foreground">
            An unexpected error interrupted this view. Your saved training
            plans are safe and will still be here after a reload.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={this.resetErrorBoundary}
            >
              Try again
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
