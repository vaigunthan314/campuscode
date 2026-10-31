import { useEffect, useState } from "react";

export type Route = "/" | "/login" | "/register";

const ROUTES: Route[] = ["/", "/login", "/register"];

function read(): Route {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return ROUTES.find((route) => route === path) ?? "/";
}

export function navigate(to: string) {
  if (to === window.location.pathname + window.location.search + window.location.hash) return;
  window.history.pushState({}, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(read);

  useEffect(() => {
    const update = () => setRoute(read());
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  return route;
}

/**
 * Follows same-origin `<a href="/...">` clicks without a page reload, so
 * middle-click and "open in new tab" keep working. External links, downloads,
 * new-tab links and in-page `#` anchors are left alone (App owns those).
 */
export function useLinkRouting() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href") ?? "";
      if (!href) return;

      // In-page anchors belong to the home page: go home first, then scroll.
      if (href.startsWith("#")) {
        if (window.location.pathname === "/") return;
        const id = href.slice(1);
        if (!id) return;
        event.preventDefault();
        navigate("/");
        window.setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 140);
        return;
      }

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && !url.hash) return;

      event.preventDefault();
      navigate(url.pathname + url.search + url.hash);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}
