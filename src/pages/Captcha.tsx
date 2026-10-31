type CaptchaProps = {
  code: string;
  value: string;
  error?: string;
  onValue: (value: string) => void;
  onRefresh: () => void;
};

const PALETTE = ["#7455FF", "#44640B", "#111111", "#7C5CFF", "#5C7A18"];

/**
 * Decorative client-side captcha.
 *
 * NOTE: this is a placeholder for presentation only — the code is generated and
 * checked in the browser, so it is NOT real bot protection. Replace it with a
 * server-verified captcha when authentication is wired up.
 */
export function Captcha({ code, value, error, onValue, onRefresh }: CaptchaProps) {
  const seed = Number(code) || 1;
  const jitter = (index: number) => {
    const raw = Math.sin(seed * (index + 3) * 12.9898) * 43758.5453;
    return raw - Math.floor(raw);
  };

  return (
    <div className="auth-captcha">
      <div className="auth-captcha__frame">
        <svg viewBox="0 0 148 48" aria-hidden="true" focusable="false">
          {code.split("").map((digit, index) => {
            const x = 16 + index * 27 + (jitter(index) * 6 - 3);
            const y = 32 + (jitter(index + 9) * 6 - 3);
            const rotate = jitter(index + 21) * 26 - 13;
            return (
              <text
                key={`${digit}-${index}`}
                x={x}
                y={y}
                fill={PALETTE[Number(digit) % PALETTE.length]}
                transform={`rotate(${rotate.toFixed(1)} ${x} 26)`}
                className="auth-captcha__digit"
              >
                {digit}
              </text>
            );
          })}
          <line
            className="auth-captcha__noise"
            x1="8"
            y1={14 + jitter(31) * 14}
            x2="140"
            y2={18 + jitter(32) * 16}
          />
          <line
            className="auth-captcha__noise"
            x1="12"
            y1={30 + jitter(33) * 12}
            x2="136"
            y2={26 + jitter(34) * 14}
          />
        </svg>
        <span className="auth-captcha__tag">NOT A ROBOT? PROVE IT.</span>
      </div>

      <label className="auth-sr" htmlFor="captcha">
        Enter the five digit code shown
      </label>
      <input
        id="captcha"
        name="captcha"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={5}
        placeholder="ENTER CODE"
        className={`auth-input${error ? " has-error" : ""}`}
        value={value}
        onChange={(event) => onValue(event.target.value.replace(/\D/g, ""))}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "captcha-error" : undefined}
      />
      <button type="button" className="auth-refresh" onClick={onRefresh}>
        ↻ NEW
      </button>
    </div>
  );
}
