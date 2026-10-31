import { useEffect, useRef, useState } from "react";
import "./SectionHeader.css";

export type SectionHeaderProps = {
  /** Two digit section number, e.g. "03". */
  number: string;
  /** Eyebrow label, without the number. */
  label: string;
  title?: string;
  subtitle?: string;
  variant?: "full" | "eyebrow";
  as?: "h1" | "h2";
  className?: string;
};

/**
 * One header for every section: "NN / LABEL" eyebrow, optional title with the
 * lime full stop, optional right-aligned subtitle and an optional divider.
 * Reveals once when it enters the viewport.
 */
export function SectionHeader({
  number,
  label,
  title,
  subtitle,
  variant = "full",
  as = "h2",
  className = "",
}: SectionHeaderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const Heading = as;
  const classes = [
    "sh-header",
    `sh-header--${variant}`,
    visible ? "is-visible" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={rootRef} className={classes}>
      <p className="sh-eyebrow">
        <span className="sh-eyebrow__line" aria-hidden="true" />
        <span className="sh-eyebrow__label">
          {number} / {label}
        </span>
      </p>

      {variant === "full" && title ? (
        <div className="sh-title-row">
          <Heading className="sh-title">
            <span className="sh-title__clip">
              <span className="sh-title__inner">
                {title}
                <i className="sh-title__stop" aria-hidden="true" />
              </span>
            </span>
          </Heading>
          {subtitle ? <p className="sh-subtitle">{subtitle}</p> : null}
        </div>
      ) : null}

      {variant === "full" ? <div className="sh-divider" aria-hidden="true" /> : null}
    </div>
  );
}

export default SectionHeader;
