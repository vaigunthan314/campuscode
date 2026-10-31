import { useRef, useState } from "react";
import { AuthCard, AuthField, AuthLayout } from "./AuthLayout";
import { Captcha } from "./Captcha";
import { submitRegister } from "../auth/api";

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const NOTICE = "Authentication isn't connected yet. This page is ready for the backend.";
const ACCOUNT_TYPES = ["STUDENT", "TEAM LEADER"];

const makeCode = () => String(Math.floor(10000 + Math.random() * 90000));

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
  captcha?: string;
};

type Values = {
  name: string;
  email: string;
  accountType: string;
  password: string;
  confirm: string;
  captcha: string;
};

function strength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/i.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (password.length >= 12) score += 1;
  return score;
}

function validate(values: Values, code: string): Errors {
  const errors: Errors = {};
  if (values.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!values.email.trim()) errors.email = "Enter your email address.";
  else if (!EMAIL.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (values.password.length < 8) errors.password = "Use at least 8 characters.";
  else if (!/[a-z]/i.test(values.password) || !/\d/.test(values.password))
    errors.password = "Include at least one letter and one number.";
  if (!values.confirm) errors.confirm = "Re-enter your password.";
  else if (values.confirm !== values.password) errors.confirm = "Passwords do not match.";
  if (!values.captcha) errors.captcha = "Enter the code shown above.";
  else if (values.captcha !== code) errors.captcha = "That code doesn't match. Try the new one.";
  return errors;
}

export function RegisterPage() {
  const [values, setValues] = useState<Values>({
    name: "",
    email: "",
    accountType: ACCOUNT_TYPES[0],
    password: "",
    confirm: "",
    captcha: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [code, setCode] = useState(makeCode);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [notice, setNotice] = useState<string | null>(null);

  const fields = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLInputElement>(null),
    confirm: useRef<HTMLInputElement>(null),
    captcha: useRef<HTMLInputElement>(null),
  };

  const set = (key: keyof Values) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [key]: event.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    const next = validate(values, code);
    setErrors(next);
    const first = (Object.keys(next) as Array<keyof Errors>).find((key) => next[key]);
    if (first) {
      fields[first].current?.focus();
      return;
    }

    setStatus("submitting");
    try {
      await submitRegister({
        name: values.name.trim(),
        email: values.email.trim(),
        accountType: values.accountType,
        password: values.password,
        captcha: values.captcha,
      });
    } catch {
      setNotice(NOTICE);
    } finally {
      setStatus("idle");
    }
  };

  const meter = strength(values.password);

  return (
    <AuthLayout
      breadcrumb="CAMPUSCODE / REGISTRATION"
      accessLabel="CREATE"
      accessCount="02 / 02"
      solid="JOIN THE"
      paragraph="Create your CampusCode identity and become part of a student ecosystem designed around ideas, teams, technology and competition."
      status="REGISTRATION READY"
      cards={[
        { no: "01", label: "CREATE", note: "IDENTITY" },
        { no: "02", label: "COLLABORATE", note: "TEAM" },
        { no: "03", label: "COMPETE", note: "ARENA" },
      ]}
    >
      <AuthCard eyebrow="NEW ACCOUNT" code="CC 02" title="REGISTER" subtitle="Create your CampusCode account.">
        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <AuthField id="name" label="FULL NAME" error={errors.name}>
            <input
              ref={fields.name}
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              className={`auth-input${errors.name ? " has-error" : ""}`}
              value={values.name}
              onChange={set("name")}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
          </AuthField>

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
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
          </AuthField>

          <AuthField id="accountType" label="ACCOUNT TYPE">
            <div className="auth-input auth-input--icon auth-input--select">
              <svg className="auth-field-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M8 1.6 15 5 8 8.4 1 5z" />
                <path d="M3.4 7.6v3.2c0 1.5 2 2.6 4.6 2.6s4.6-1.1 4.6-2.6V7.6" />
              </svg>
              <select
                id="accountType"
                name="accountType"
                value={values.accountType}
                onChange={(event) => setValues((prev) => ({ ...prev, accountType: event.target.value }))}
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </AuthField>

          <p className="auth-note">
            Organizer? Accounts are created by our team — contact{" "}
            <a className="auth-link" href="mailto:campuscode@gmail.com">
              campuscode@gmail.com
            </a>
          </p>

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
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={values.password}
                onChange={set("password")}
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? "password-error" : "password-strength"}
              />
            </div>
            <div
              className={`auth-strength${meter >= 3 ? " is-strong" : meter >= 2 ? " is-good" : meter >= 1 ? " is-fair" : " is-weak"}`}
              id="password-strength"
              role="status"
              aria-live="polite"
            >
              <span className="auth-strength__label" aria-hidden="true">
                {meter === 0 ? "Weak" : meter === 1 ? "Fair" : meter === 2 ? "Good" : "Strong"}
              </span>
              {[0, 1, 2, 3].map((segment) => (
                <i key={segment} className={segment < meter ? "is-on" : ""} />
              ))}
            </div>
          </AuthField>

          <AuthField
            id="confirm"
            label="CONFIRM PASSWORD"
            error={errors.confirm}
            action={
              <button
                type="button"
                className="auth-toggle"
                onClick={() => setShowConfirm((show) => !show)}
                aria-pressed={showConfirm}
              >
                {showConfirm ? "HIDE" : "SHOW"}
              </button>
            }
          >
            <div className={`auth-input auth-input--icon${errors.confirm ? " has-error" : ""}`}>
              <svg className="auth-field-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <circle cx="4.4" cy="8" r="0.6" />
                <circle cx="8" cy="8" r="0.6" />
                <circle cx="11.6" cy="8" r="0.6" />
              </svg>
              <input
                ref={fields.confirm}
                id="confirm"
                name="confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={values.confirm}
                onChange={set("confirm")}
                aria-invalid={errors.confirm ? true : undefined}
                aria-describedby={errors.confirm ? "confirm-error" : undefined}
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

          <button
            type="submit"
            className={`auth-submit${status === "submitting" ? " is-loading" : ""}`}
            disabled={status === "submitting"}
          >
            {status === "submitting" ? (
              <>
                <span className="auth-submit__spinner" aria-hidden="true" />
                CREATING...
              </>
            ) : (
              "CREATE ACCOUNT"
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

          <p className="auth-switch">
            ALREADY HAVE AN ACCOUNT?{" "}
            <a className="auth-link" href="/login">
              LOGIN →
            </a>
          </p>
        </form>
      </AuthCard>
    </AuthLayout>
  );
}
