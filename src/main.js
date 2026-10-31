"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var client_1 = require("react-dom/client");
var App_1 = require("./App");
require("./styles/base.css");
require("./styles/hero.css");
require("./styles/loading.css");
require("./styles/intro.css");
require("./styles/sections.css");
// The boot screen must be the first thing on screen — never a restored scroll
// position from the previous visit.
if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
}
window.scrollTo(0, 0);
(0, client_1.createRoot)(document.getElementById("root")).render(<react_1.StrictMode>
    <App_1.default />
  </react_1.StrictMode>);
