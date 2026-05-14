import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { App } from "./app/App";
import "react-toastify/dist/ReactToastify.css";
import "./styles/global.css";

const Router = import.meta.env.MODE === "github-pages" ? HashRouter : BrowserRouter;

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
      <ToastContainer position="bottom-right" autoClose={2400} />
    </Router>
  </React.StrictMode>
);
