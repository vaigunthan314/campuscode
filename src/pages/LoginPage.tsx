import { useRef, useState } from "react";
import { AuthCard, AuthField, AuthLayout } from "./AuthLayout";
import { Captcha } from "./Captcha";
import { submitLogin } from "../auth/api";

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const NOTICE = "Authentication isn't connected yet. This page is ready for the backend.";

const makeCode = () => String(Math.floor(10000 + Math.random() * 90000));

type Errors = { email?: string; password?: string; captcha?: string };

function validate(values: { email: string; password: string; captcha: string }, code: string): Errors {
  const errors: Errors = {};
  if (!values.email.trim()) errors.email = "Enter your email address.";
  else if (!EMAIL.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (!values.password) errors.password = "Enter your password.";
  if (!values.captcha) errors.captcha = "Enter the code shown above.";
  else if (values.captcha !== code) errors.captcha = "That code doesn't match. Try the new one.";
  return errors;
}

export function LoginPage() {
  const [values, setValues] = useState({ email: "", password: "", captcha: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState(makeCode);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [bus, setBus] = useState<"idle" | "go" | "error">("idle");
  const [notice, setNotice] = useState<string | null>(null);

  const fields = {
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    captcha: useRef<HTMLInputElement>(null),
  };

  const set = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const checkField = (key: keyof Errors) => () => {
    const next = validate(values, code);
    setErrors((prev) => ({ ...prev, [key]: next[key] }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    const next = validate(values, code);
    setErrors(next);
    const first = (Object.keys(next) as Array<keyof Errors>).find((key) => next[key]);
    if (first) {
      setBus("error");
      fields[first].current?.focus();
      return;
    }

    setBus("go");
    setStatus("submitting");
    try {
      await submitLogin({ email: values.email.trim(), password: values.password, captcha: values.captcha });
    } catch {
      setNotice(NOTICE);
    } finally {
      setStatus("idle");
    }
  };

  return (
    <AuthLayout
      breadcrumb="CAMPUSCODE / AUTHENTICATION"
      accessLabel="ACCESS"
      accessCount="01 / 02"
      solid="ENTER THE"
      paragraph="Sign in to continue building, collaborating and competing with the CampusCode community."
      status="AUTHENTICATION READY"
      cards={[
        { no: "01", label: "BUILD" },
        { no: "02", label: "COMPETE" },
        { no: "03", label: "SHIP" },
      ]}
    >
      <AuthCard eyebrow="EXISTING ACCOUNT" code="CC 01" title="LOGIN" subtitle="Access your CampusCode account.">
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <AuthField id="email" label="EMAIL ADDRESS" error={errors.email}>
            <div className={`auth-input auth-input--icon${errors.email ? " has-error" : ""}`}>
              <svg className="auth-field-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <circle cx="8" cy="8" r="6.4" />
                <path d="M11.4 6.2v3.6a1.6 1.6 0 0 0 3.2 0V8" />
                <circle cx="8" cy="8" r="2.4" />
              </svg>
              <input
                ref={fields.email}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@campus.edu"
                value={values.email}
                onChange={set("email")}
                onBlur={checkField("email")}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
          </AuthField>

          <AuthField
            id="password"
            label="PASSWORD"
            error={errors.password}
            action={
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setShowPassword((show) => !show)}
                aria-pressed={showPassword}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            }
          >
            <div className={`auth-input auth-input--icon${errors.password ? " has-error" : ""}`}>
              <svg className="auth-field-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <circle cx="4.4" cy="8" r="0.6" />
                <circle cx="8" cy="8" r="0.6" />
                <circle cx="11.6" cy="8" r="0.6" />
              </svg>
              <input
                ref={fields.password}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={values.password}
                onChange={set("password")}
                onBlur={checkField("password")}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
            </div>
          </AuthField>

          <AuthField id="captcha" label="CAPTCHA" error={errors.captcha}>
            <Captcha
              code={code}
              value={values.captcha}
              error={errors.captcha}
              onValue={(captcha) => {
                setValues((prev) => ({ ...prev, captcha }));
                setErrors((prev) => ({ ...prev, captcha: undefined }));
              }}
              onRefresh={() => {
                setCode(makeCode());
                setValues((prev) => ({ ...prev, captcha: "" }));
                setErrors((prev) => ({ ...prev, captcha: undefined }));
              }}
            />
          </AuthField>

          <div className="auth-ready" data-state={bus}>
            <i className="auth-dot" aria-hidden="true" />
            <span className="auth-ready__label">{bus === "idle" ? "SECURE LOGIN" : bus === "go" ? "GO" : "CHECK"}</span>
            <span className="auth-ready__meta">CC / SECURE</span>
          </div>

          <button
            type="submit"
            className={`auth-submit${status === "submitting" ? " is-loading" : ""}`}
            disabled={status === "submitting"}
          >
            {status === "submitting" ? (
              <>
                <span className="auth-submit__spinner" aria-hidden="true" />
                SENDING...
              </>
            ) : (
              "SEND LOGIN CODE"
            )}
            <span className="auth-submit__arrow" aria-hidden="true">
              ↗
            </span>
          </button>

          {notice ? (
            <p className="auth-notice" aria-live="polite">
              {notice}
            </p>
          ) : null}

          <a className="auth-link" href="/login">
            FORGOT PASSWORD?
          </a>

          <span className="auth-divider" aria-hidden="true" />

          <p className="auth-switch">
            DON&apos;T HAVE AN ACCOUNT?{" "}
            <a className="auth-link" href="/register">
              CREATE ACCOUNT →
            </a>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
