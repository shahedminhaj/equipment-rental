"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "../lib/api";
import { saveAuth, type AuthUser } from "../lib/auth";
import { useToast } from "./toast-provider";
import { GoogleSignInButton } from "./google-sign-in";

type AuthResponse = { token: string; user: AuthUser };
type AdminSetupStatus = { configured: boolean; available: boolean };

export function AccountAccess({
  onAuthenticated,
  initialMode = "login",
  allowRegistration = true,
  allowGoogle = true,
  allowAdminSetup = false,
}: {
  onAuthenticated: (token: string, user: AuthUser) => void;
  initialMode?: "login" | "register";
  allowRegistration?: boolean;
  allowGoogle?: boolean;
  allowAdminSetup?: boolean;
}) {
  const [mode, setMode] = useState<"login" | "register" | "admin-setup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminSetupAvailable, setAdminSetupAvailable] = useState(false);
  const [isCheckingSetup, setIsCheckingSetup] = useState(allowAdminSetup);
  const [setupStatusError, setSetupStatusError] = useState("");
  const { notify } = useToast();

  useEffect(() => {
    if (!allowAdminSetup) return;
    let active = true;

    apiRequest<AdminSetupStatus>("/auth/admin/setup-status")
      .then((status) => {
        if (active) setAdminSetupAvailable(status.configured && status.available);
      })
      .catch((statusError) => {
        if (active) {
          setSetupStatusError(
            statusError instanceof Error ? statusError.message : "Could not check admin setup status",
          );
        }
      })
      .finally(() => {
        if (active) setIsCheckingSetup(false);
      });

    return () => {
      active = false;
    };
  }, [allowAdminSetup]);

  function acceptAuth(response: AuthResponse) {
    saveAuth(response.token, response.user);
    notify(
      mode === "register"
        ? "Account created. Welcome to Fieldkit!"
        : mode === "admin-setup"
          ? "Administrator account created."
          : `Welcome back, ${response.user.name.split(" ")[0]}!`,
    );
    onAuthenticated(response.token, response.user);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const endpoint = mode === "register"
        ? "/auth/register"
        : mode === "admin-setup"
          ? "/auth/admin/setup"
          : "/auth/login";
      const response = await apiRequest<AuthResponse>(
        endpoint,
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
      const message = authError instanceof Error ? authError.message : "Could not sign in";
      setError(
        mode === "login" && allowAdminSetup && message === "Email or password is incorrect"
          ? `${message}. Check ADMIN_EMAIL and ADMIN_PASSWORD in the backend .env file, then restart the API so it can sync the configured admin password.`
          : message,
      );
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
    <Card className="account-access-card gap-0">
      <CardHeader className="p-0">
        <p className="eyebrow">{mode === "admin-setup" ? "ONE-TIME ADMIN SETUP" : "FIELDKIT ACCOUNT"}</p>
        <h1>
          {mode === "admin-setup"
            ? "Create the first administrator"
            : mode === "register"
              ? "Create your account"
              : "Sign in to continue"}
        </h1>
        {mode === "admin-setup" && (
          <p className="account-form-hint">
            Enter the exact email and password configured as ADMIN_EMAIL and ADMIN_PASSWORD in the backend environment.
          </p>
        )}
        {mode === "admin-setup" && <Badge variant="outline">One-time setup</Badge>}
      </CardHeader>
      <CardContent className="p-0">
        <form className="account-access-form" onSubmit={handleSubmit}>
          {mode === "register" && (
            <div className="account-form-field">
              <Label htmlFor="account-name">Name</Label>
              <Input
                id="account-name"
                type="text"
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
          )}
          <div className="account-form-field">
            <Label htmlFor="account-email">Email</Label>
            <Input
              id="account-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="account-form-field">
            <Label htmlFor="account-password">Password</Label>
            <Input
              id="account-password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              pattern={mode === "register" ? "(?=.*[a-z])(?=.*[A-Z]).{6,}" : undefined}
              title="Use at least 6 characters, including uppercase and lowercase letters."
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {mode === "register" && (
            <p className="account-form-hint">
              Use at least 6 characters with uppercase and lowercase letters.
            </p>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button className="button button-dark w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : mode === "admin-setup"
                ? "Create administrator and continue"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
          </Button>
        </form>
        {allowRegistration && (
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
        )}
        {allowAdminSetup && mode === "login" && (
          <div className="admin-setup-prompt">
            {isCheckingSetup ? (
              <p role="status">Checking first-admin setup...</p>
            ) : adminSetupAvailable ? (
              <p>
                No admin account exists yet.{" "}
                <Button
                  type="button"
                  variant="link"
                  className="admin-setup-link"
                  onClick={() => {
                    setMode("admin-setup");
                    setError("");
                  }}
                >
                  Set up the first admin
                </Button>
              </p>
            ) : setupStatusError ? (
              <Alert variant="destructive">
                <AlertDescription>Could not check first-admin setup: {setupStatusError}</AlertDescription>
              </Alert>
            ) : null}
          </div>
        )}
        {allowGoogle && mode !== "admin-setup" && (
          <>
            <div className="account-access-divider"><span>or continue with</span></div>
            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              onError={setError}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
