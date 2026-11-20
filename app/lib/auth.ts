export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "owner" | "admin";
  photo?: string;
};

export const AUTH_CHANGED_EVENT = "fieldkit-auth-changed";

export function saveAuth(token: string, user: AuthUser) {
  window.localStorage.setItem("fieldkit_token", token);
  window.localStorage.setItem("fieldkit_user_email", user.email);
  window.localStorage.setItem("fieldkit_user_role", user.role);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearAuth() {
  window.localStorage.removeItem("fieldkit_token");
  window.localStorage.removeItem("fieldkit_user_email");
  window.localStorage.removeItem("fieldkit_user_role");
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}
