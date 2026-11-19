export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "owner" | "admin";
  photo?: string;
};

export function saveAuth(token: string, user: AuthUser) {
  window.localStorage.setItem("fieldkit_token", token);
  window.localStorage.setItem("fieldkit_user_email", user.email);
}

export function clearAuth() {
  window.localStorage.removeItem("fieldkit_token");
  window.localStorage.removeItem("fieldkit_user_email");
}
