// src/components/ErrorBoundary.jsx
//
// Catches render errors thrown anywhere in its subtree and shows a fallback
// UI instead of leaving the whole page blank. See App.jsx for where this is
// mounted (around the routed page content, so a crash in one page doesn't
// take down navigation/the rest of the app).
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-white px-6 py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-[#333] mb-4">
            Something went wrong
          </h1>
          <p className="text-[#666] mb-8 max-w-md">
            We're sorry, an unexpected error occurred while loading this page.
            Please try reloading.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-block bg-[#af8564] hover:bg-[#96704f] text-white font-semibold py-3 px-6 rounded transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
