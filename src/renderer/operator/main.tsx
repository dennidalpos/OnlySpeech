import React from "react";
import ReactDOM from "react-dom/client";
import { OperatorApp } from "./app/OperatorApp.js";
import { ErrorBoundary } from "./components/ErrorBoundary.js";
import "../operator/styles/operator.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <OperatorApp />
    </ErrorBoundary>
  </React.StrictMode>
);

