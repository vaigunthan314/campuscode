type LogoProps = {
  className?: string;
  onClick?: () => void;
  href?: string;
};

/**
 * The original CampusCode identity: three skewed bars (black / purple / lime)
 * beside the CAMPUSCODE wordmark and HACKATHON ARENA descriptor.
 * Recovered from the live site's own markup and CSS — not redrawn.
 */
export function CampusMark({ className = "" }: { className?: string }) {
  return (
    <span className={`landing-logo-mark ${className}`.trim()} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function Logo({ className = "", onClick, href }: LogoProps) {
  const content = (
    <>
      <CampusMark />
      <span className="landing-logo-type">
        <strong>CAMPUSCODE</strong>
        <small>HACKATHON ARENA</small>
      </span>
    </>
  );

  if (href) {
    return (
      <a className={`landing-logo ${className}`.trim()} href={href} onClick={onClick} aria-label="CampusCode home">
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={`landing-logo ${className}`.trim()}
      onClick={onClick}
      aria-label="CampusCode home"
    >
      {content}
    </button>
  );
}
