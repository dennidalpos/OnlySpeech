import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside ErrorBoundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="technical-error-screen" style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", minHeight: "100vh" }}>
          <div className="technical-error-card" style={{ maxWidth: "600px", padding: "40px", borderRadius: "32px", border: "1px solid rgba(255, 255, 255, 0.12)", background: "rgba(7, 15, 25, 0.92)", boxShadow: "0 24px 80px rgba(0, 0, 0, 0.35)", textAlign: "center" }}>
            <span className="eyebrow" style={{ color: "#bfd2de", letterSpacing: "0.18em", textTransform: "uppercase", fontSize: "1rem" }}>System Crash Recovery</span>
            <h1 style={{ fontSize: "2rem", margin: "16px 0", color: "#ff6a63" }}>Si è verificato un errore imprevisto.</h1>
            <p style={{ color: "#bfd2de", marginBottom: "24px", fontSize: "1.1rem" }}>
              L'interfaccia dell'applicazione si è arrestata in modo anomalo. Prova a ricaricare la schermata.
            </p>
            {this.state.error ? (
              <pre style={{ textAlign: "left", background: "rgba(0, 0, 0, 0.4)", padding: "16px", borderRadius: "12px", fontSize: "0.9rem", color: "#f4f7fb", overflowX: "auto", border: "1px solid rgba(255,255,255,0.06)", maxHeight: "150px" }}>
                <code>{this.state.error.stack || this.state.error.message}</code>
              </pre>
            ) : null}
            <button
              className="primary-button"
              type="button"
              onClick={this.handleReload}
              style={{
                width: "100%",
                minHeight: "64px",
                background: "linear-gradient(135deg, #46c5ff, #1b88cc)",
                color: "#06131d",
                fontWeight: "700",
                fontSize: "1.2rem",
                borderRadius: "24px",
                border: "none",
                cursor: "pointer",
                marginTop: "16px",
                boxShadow: "0 10px 30px rgba(27, 136, 204, 0.2)"
              }}
            >
              Ricarica Applicazione
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
