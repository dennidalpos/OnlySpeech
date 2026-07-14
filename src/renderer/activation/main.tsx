import React from "react";
import ReactDOM from "react-dom/client";
import { ActivationApp } from "./ActivationApp.js";
import { ErrorBoundary } from "../operator/components/ErrorBoundary.js";
import "./styles/activation.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ActivationApp />
    </ErrorBoundary>
  </React.StrictMode>
);

