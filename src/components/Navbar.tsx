import { useEffect, useRef, useState } from "react";
import "./Navbar.css";
import { Logo } from "./Logo";
import { scrollToSection } from "./scrollToSection";

const LINKS = [
  { label: "ABOUT", target: "about" },
  { label: "HOW IT WORKS", target: "howitworks" },
  { label: "HACKATHONS", target: "hackathons" },
  { label: "COMMUNITY", target: "community" },
] as const;

const WATCHED = ["about", "experience", "howitworks", "hackathons", "mission", "community"];

function useClock() {
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tick = () => setTime(format.format(new Date()));
    tick();
    const timer = window.setInterval(tick, 60000);
    return () => window.clearInterval(timer);
  }, []);

  return time;
}

/** Top bar + status strip for the front page. */
export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("about");
  const [underline, setUnderline] = useState({ left: 0, width: 0 });
  const barRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const time = useClock();

  // Active section tracking.
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.id !== "experience") {
            setActive(entry.target.id);
          }
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    WATCHED.forEach((id) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, []);

  // Sliding underline under the active desktop link.
  useEffect(() => {
    const link = linkRefs.current[active];
    const bar = barRef.current;
    if (!link || !bar) {
      setUnderline({ left: 0, width: 0 });
      return;
    }
    const barRect = bar.getBoundingClientRect();
    const rect = link.getBoundingClientRect();
    setUnderline({ left: rect.left - barRect.left, width: rect.width });
  }, [active, menuOpen]);

  // Mobile panel: focus trap, scroll lock, Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";

    const panel = panelRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>("a, button") ?? []);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panel?.contains(target) || toggleRef.current?.contains(target)) return;
      setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    // The panel is display:none until the is-open class paints, so focus after
    // the next frame or the browser drops it onto <body>.
    const focusFrame = window.requestAnimationFrame(() => focusables()[0]?.focus());

    return () => {
      window.cancelAnimationFrame(focusFrame);
      root.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      toggleRef.current?.focus();
    };
  }, [menuOpen]);

  const go = (target: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    setMenuOpen(false);
    scrollToSection(target);
  };

  return (
    <>
      <header className="landing-nav nv-bar" ref={barRef}>
        <div className="nv-logo-box">
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
        </div>

        <nav className="nv-links" aria-label="Primary">
          {LINKS.map((link) => (
            <a
              key={link.target}
              href={`#${link.target}`}
              ref={(el) => {
                linkRefs.current[link.target] = el;
              }}
              className={`nv-link${active === link.target ? " is-active" : ""}`}
              aria-current={active === link.target ? "page" : undefined}
              onClick={go(link.target)}
            >
              {link.label}
            </a>
          ))}
          <span
            className="nv-underline"
            aria-hidden="true"
            style={{ transform: `translateX(${underline.left}px)`, width: underline.width }}
          />
        </nav>

        <div className="nv-actions">
          <a className="nv-login" href="/login">
            LOGIN
          </a>
          <a className="nv-join" href="/register">
            JOIN CAMPUSCODE <span aria-hidden="true">↗</span>
          </a>
        </div>

        <button
          type="button"
          className="nv-burger"
          ref={toggleRef}
          aria-expanded={menuOpen}
          aria-controls="nv-panel"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </header>

      <div className="nv-strip">
        <span className="nv-strip__status">
          <i className="nv-dot" aria-hidden="true" />
          THE DIGITAL HOME FOR STUDENT INNOVATION
        </span>
        <span className="nv-strip__place">
          CHENNAI · INDIA
          <span className="nv-strip__time">{time} IST</span>
        </span>
      </div>

      <div className={`nv-panel${menuOpen ? " is-open" : ""}`} id="nv-panel" ref={panelRef} aria-hidden={!menuOpen}>
        <div className="nv-panel__head">
          <span>MENU / 01</span>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            ×
          </button>
        </div>
        <nav className="nv-panel__links" aria-label="Mobile primary">
          {LINKS.map((link, index) => (
            <a key={link.target} href={`#${link.target}`} onClick={go(link.target)}>
              <span>0{index + 1}</span>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="nv-panel__actions">
          <a className="nv-panel-login" href="/login" onClick={() => setMenuOpen(false)}>
            LOGIN
          </a>
          <a href="/register" onClick={() => setMenuOpen(false)}>
            JOIN CAMPUSCODE ↗
          </a>
        </div>
        <p className="nv-panel__foot">CHENNAI · INDIA — BUILD / COMPETE / SHIP</p>
      </div>
    </>
  );
}
