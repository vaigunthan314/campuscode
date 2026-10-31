import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { useLinkRouting, useRoute, type Route } from "./router";
import "./styles/base.css";
import "./styles/hero.css";
import "./styles/loading.css";
import "./styles/intro.css";
import "./styles/sections.css";
import "./components/GatewayScene.css";

const TITLES: Record<Route, string> = {
  "/": "CampusCode — Build. Compete. Ship.",
  "/login": "Login · CampusCode",
  "/register": "Register · CampusCode",
};

// The boot screen must be the first thing on screen — never a restored scroll
// position from the previous visit.
if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);

/** Home stays exactly as it was; /login and /register are the only other routes. */
function Root() {
  const route = useRoute();
  useLinkRouting();

  useEffect(() => {
    document.title = TITLES[route];
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [route]);

  if (route === "/login") return <LoginPage />;
  if (route === "/register") return <RegisterPage />;
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
