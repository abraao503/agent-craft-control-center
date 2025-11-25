import { Component, ErrorInfo, ReactNode } from "react";
import { H } from "highlight.run";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class HighlightErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Report the error to Highlight
    H.consumeError(error, "Error caught in error boundary", {
      componentStack: errorInfo.componentStack || "",
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          <p>The error has been reported. Please try again later.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
