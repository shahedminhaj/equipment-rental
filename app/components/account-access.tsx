"use client";

import { useState, type FormEvent } from "react";
import { apiRequest } from "../lib/api";
import { saveAuth, type AuthUser } from "../lib/auth";
import { GoogleSignInButton } from "./google-sign-in";

type AuthResponse = { token: string; user: AuthUser };

export function AccountAccess({
  onAuthenticated,
}: {
  onAuthenticated: (token: string, user: AuthUser) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function acceptAuth(response: AuthResponse) {
    saveAuth(response.token, response.user);
    onAuthenticated(response.token, response.user);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await apiRequest<AuthResponse>(
        mode === "register" ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(
            mode === "register"
              ? { name: name.trim(), email: email.trim(), password }
              : { email: email.trim(), password },
          ),
        },
      );
      acceptAuth(response);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Could not sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleCredential(credential: string) {
    setIsSubmitting(true);
    setError("");
    try {
      acceptAuth(await apiRequest<AuthResponse>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      }));
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Google sign-in failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="account-access-card">
      <p className="eyebrow">FIELKIT ACCOUNT</p>
      <h1>{mode === "login" ? "Sign in to continue" : "Create your account"}</h1>
      <form className="account-access-form" onSubmit={handleSubmit}>
        {mode === "register" && (
          <label>
            Name
            <input
              type="text"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            pattern={mode === "register" ? "(?=.*[a-z])(?=.*[A-Z]).{6,}" : undefined}
            title="Use at least 6 characters, including uppercase and lowercase letters."
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {mode === "register" && (
          <p className="account-form-hint">
            Use at least 6 characters with uppercase and lowercase letters.
          </p>
        )}
        {error && <p className="booking-field-error" role="alert">{error}</p>}
        <button className="button button-dark" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="account-access-switch">
        {mode === "login" ? "New to Fieldkit?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </button>
      </p>
      <div className="account-access-divider"><span>or continue with</span></div>
      <GoogleSignInButton
        onCredential={handleGoogleCredential}
        onError={setError}
      />
    </section>
  );
}
