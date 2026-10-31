/**
 * Auth submission boundary.
 *
 * There is no authentication backend in this project yet. These functions are
 * the single place to wire one in later: keep the signatures, replace the body
 * with a real request (for example `fetch("/api/auth/login", ...)`) and the two
 * pages will work unchanged. Never put API secrets in client code.
 */

export type LoginPayload = {
  email: string;
  password: string;
  captcha: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  accountType: string;
  password: string;
  captcha: string;
};

export const NOT_CONNECTED_MESSAGE = "Authentication is not connected yet";

export async function submitLogin(_payload: LoginPayload): Promise<never> {
  throw new Error(NOT_CONNECTED_MESSAGE);
}

export async function submitRegister(_payload: RegisterPayload): Promise<never> {
  throw new Error(NOT_CONNECTED_MESSAGE);
}
