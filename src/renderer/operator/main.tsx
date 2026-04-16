import React from "react";
import ReactDOM from "react-dom/client";
import { OperatorApp } from "./app/OperatorApp.js";
import "../operator/styles/operator.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <OperatorApp />
  </React.StrictMode>
);
