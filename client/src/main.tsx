import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
    constructor(props: any) {
        super(props);
        this.state = { error: null };
    }
    static getDerivedStateFromError(error: Error) { return { error }; }
    componentDidCatch(error: Error, info: any) { console.error("App crashed:", error, info); }
    render() {
        if (this.state.error) {
            return (
                <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fafafa", padding: "24px", fontFamily: "system-ui, sans-serif", textAlign: "center" }}>
                    <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
                    <h1 style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>Something went wrong</h1>
                    <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24, maxWidth: 320 }}>{this.state.error.message}</p>
                    <button onClick={() => { this.setState({ error: null }); window.location.href = "/"; }}
                        style={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: 12, padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
                        Go to Dashboard
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
);

