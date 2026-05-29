import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement =
  document.getElementById("payroll-chatbot-root") ??
  document.querySelector<HTMLElement>("[data-chatbot-root]") ??
  document.getElementById("root");

if (!rootElement) {
  throw new Error("Chatbot root element was not found.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
