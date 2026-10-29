import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/base.css";
import "./styles/hero.css";
import "./styles/loading.css";
import "./styles/intro.css";
import "./styles/sections.css";
import "./components/MissionScene.css";

// The boot screen must be the first thing on screen — never a restored scroll
// position from the previous visit.
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
