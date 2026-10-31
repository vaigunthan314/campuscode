import { useEffect, useState, type ReactNode } from "react";
import { CampusMark } from "../components/Logo";
import { navigate } from "../router";
import "./auth.css";

type AuthLayoutProps = {
  breadcrumb: string;
  accessLabel: string;
  accessCount: string;
  solid: string;
  paragraph: string;
  cards: ReadonlyArray<{ no: string; label: string; note?: string }>;
  status: string;
  children: ReactNode;
};

/** Shared shell for /login and /register: top bar, grid, copy column, form column. */
export function AuthLayout({
  breadcrumb,
  accessLabel,
  accessCount,
  solid,
  paragraph,
  cards,
  status,
  children,
}: AuthLayoutProps) {
  const [entered, setEntered] = useState(false);
  const [paused, setPaused] = useState(false);

  // Coming back from /login or /register must land on the page, not replay the
  // boot loader. IntroShell consumes this once, on its next mount.
  useEffect(() => {
    sessionStorage.setItem("campuscode:skip-intro", "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setEntered(true);
      return;
    }

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setEntered(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div className={`auth-page${paused ? " is-paused" : ""}${entered ? " is-entered" : ""}`}>
      <svg className="auth-grid" aria-hidden="true" focusable="false">
        <defs>
          <pattern id="auth-grid-pattern" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M64 0H0V64" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid-pattern)" />
      </svg>

      <span className="auth-shape auth-shape--1" aria-hidden="true" />
      <span className="auth-shape auth-shape--2" aria-hidden="true" />
      <span className="auth-shape auth-shape--3" aria-hidden="true" />
      <span className="auth-shape auth-shape--4" aria-hidden="true" />

      <header className="auth-top">
        <a className="auth-logo" href="/" aria-label="CampusCode home">
          <CampusMark />
          <span className="auth-logo__type">
            <strong>CAMPUSCODE</strong>
            <small>HACKATHON ARENA</small>
          </span>
        </a>
        <a
          className="auth-back"
          href="/"
          onClick={(event) => {
            event.preventDefault();
            navigate("/");
          }}
        >
          <span aria-hidden="true">←</span> BACK TO HOME
        </a>
      </header>

      <main className="auth-main">
        <div className="auth-copy">
          <p className="auth-breadcrumb auth-reveal">
            <i aria-hidden="true" />
            {breadcrumb}
          </p>

          <p className="auth-access auth-reveal">
            <span>{accessLabel}</span>
            <span>{accessCount}</span>
          </p>

          <h1 className="auth-title">
            <span className="auth-line">
              <span className="auth-line__inner">{solid}</span>
            </span>
            <span className="auth-line">
              <span className="auth-line__inner auth-outline">ARENA.</span>
            </span>
          </h1>

          <p className="auth-lead auth-reveal">{paragraph}</p>

          <ul className="auth-cards auth-reveal">
            {cards.map((card, index) => (
              <li
                key={card.no}
                className="auth-cards__item"
                style={{ animationDelay: `${260 + index * 90}ms` }}
              >
                <span className="auth-cards__no">{card.no}</span>
                <span className="auth-cards__label">{card.label}</span>
                {card.note ? (
                  <span className="auth-cards__note">{card.note}</span>
                ) : null}
              </li>
            ))}
          </ul>

          <div className="auth-gets auth-reveal">
            <p className="auth-gets__label">WHAT YOU GET</p>
            <ul className="auth-gets__list">
              <li className="auth-gets__item">
                <i className="auth-gets__check" aria-hidden="true" />
                <span>Peer teams, mentor review and weekly build targets.</span>
              </li>
              <li className="auth-gets__item">
                <i className="auth-gets__check" aria-hidden="true" />
                <span>One arena for projects, hackathons and shipped ideas.</span>
              </li>
              <li className="auth-gets__item">
                <i className="auth-gets__check" aria-hidden="true" />
                <span>A public portfolio that follows your best work.</span>
              </li>
            </ul>
          </div>

          <div className="auth-strip auth-reveal">
            <span className="auth-strip__status">
              <i className="auth-dot" aria-hidden="true" />
              {status}
            </span>
            <span className="auth-strip__meta">SECURE ACCESS</span>
            <span className="auth-strip__meta">2026</span>
          </div>
        </div>

        <div className="auth-form-col auth-reveal">{children}</div>
      </main>
    </div>
  );
}

type AuthCardProps = {
  eyebrow: string;
  code: string;
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthCard({ eyebrow, code, title, subtitle, children }: AuthCardProps) {
  return (
    <section className="auth-card" aria-labelledby={`${code}-title`}>
      <span className="auth-card__bar" aria-hidden="true">
        <i />
        <i />
      </span>
      <div className="auth-card__head">
        <span className="auth-card__eyebrow">{eyebrow}</span>
        <span className="auth-card__code">{code}</span>
      </div>
      <h2 className="auth-card__title" id={`${code}-title`}>{title}</h2>
      <p className="auth-card__sub">{subtitle}</p>
      <span className="auth-card__rule" aria-hidden="true" />
      {children}
    </section>
  );
}

type AuthFieldProps = {
  id: string;
  label: string;
  error?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function AuthField({ id, label, error, action, children }: AuthFieldProps) {
  return (
    <div
      className={`auth-field${error ? " has-error" : ""}`}
      data-shake={error ? true : undefined}
    >
      <div className="auth-field__head">
        <label className="auth-label" htmlFor={id}>
          {label}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p className="auth-error" id={`${id}-error`} aria-live="polite">
          {error}
        </p>
      ) : null}
    </div>
  );
}
