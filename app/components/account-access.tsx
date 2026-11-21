"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [accountType, setAccountType] = useState<"user" | "admin">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminSetupStatus, setAdminSetupStatus] = useState<AdminSetupStatus | null>(null);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const [setupStatusError, setSetupStatusError] = useState("");
  const { notify } = useToast();

  const isSignup = initialMode === "register";
  const adminSetupAvailable = adminSetupStatus?.configured === true && adminSetupStatus.available;

  useEffect(() => {
    let active = true;

    apiRequest<AdminSetupStatus>("/auth/admin/setup-status")
      .then((status) => {
        if (active) setAdminSetupStatus(status);
      })
      .catch((statusError) => {
        if (active) {
          const message =
            statusError instanceof Error ? statusError.message : "Could not check admin setup status";
          setSetupStatusError(message);
        }
      })
      .finally(() => {
        if (active) setIsCheckingSetup(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function resetFormState() {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
  }

  function acceptAuth(response: AuthResponse, kind: "login" | "register" | "admin-setup") {
    saveAuth(response.token, response.user);
    notify(
      kind === "register"
        ? "Account created. Welcome to Fieldkit!"
        : kind === "admin-setup"
          ? "Administrator account created."
          : `Welcome back, ${response.user.name.split(" ")[0]}!`,
    );
    onAuthenticated(response.token, response.user);
  }

  async function handleUserLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      acceptAuth(response, "login");
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Could not sign in";
      notify(message, "error");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdminLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      acceptAuth(response, "login");
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Could not sign in";
      notify(message, "error");
      setError(
        allowAdminSetup && message === "Email or password is incorrect"
          ? `${message}. Check ADMIN_EMAIL and ADMIN_PASSWORD in the backend .env file, then restart the API so it can sync the configured admin password.`
          : message,
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUserRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      acceptAuth(response, "register");
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Could not create account";
      notify(message, "error");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAdminSetup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await apiRequest<AuthResponse>("/auth/admin/setup", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      acceptAuth(response, "admin-setup");
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Could not create administrator";
      notify(message, "error");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleCredential(credential: string) {
    setIsSubmitting(true);
    setError("");
    try {
      acceptAuth(
        await apiRequest<AuthResponse>("/auth/google", {
          method: "POST",
          body: JSON.stringify({ credential }),
        }),
        isSignup ? "register" : "login",
      );
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Google sign-in failed";
      notify(message, "error");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = isSignup
    ? accountType === "admin"
      ? "Create admin account"
      : "Create your account"
    : accountType === "admin"
      ? "Admin sign in"
      : "Sign in to continue";

  const eyebrow = isSignup ? "CREATE ACCOUNT" : "SIGN IN";

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <div className="auth-aside-brand">
          <svg viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <path d="M7 25.5 18 7l11 18.5H7Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M12 25.5 18 15l6 10.5M18 7v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          fieldkit.
        </div>
        <h2>Good gear. Better projects.</h2>
        <p>One account for finding gear, saving favorites, and tracking every rental from start to finish.</p>
        <div className="auth-steps">
          <div className="auth-step">
            <span className="auth-step-index">01</span>
            <div><strong>Find the right equipment</strong><small>Search live listings near you</small></div>
          </div>
          <div className="auth-step">
            <span className="auth-step-index">02</span>
            <div><strong>Book with confidence</strong><small>Secure Stripe checkout and confirmation</small></div>
          </div>
          <div className="auth-step">
            <span className="auth-step-index">03</span>
            <div><strong>Manage everything</strong><small>Rentals, favorites, and profile in one place</small></div>
          </div>
        </div>
      </aside>
      <Card className="auth-card gap-0">
        <CardHeader className="space-y-4 p-0">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <Tabs
            value={accountType}
            onValueChange={(value) => {
              if (value === "user" || value === "admin") {
                setAccountType(value);
                resetFormState();
              }
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user">User</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
          </Tabs>
          {accountType === "admin" && (
            <p className="account-form-hint">
              {isSignup
                ? "Admin access is provisioned from the backend configuration. If first-admin setup is available, you can create it here."
                : "Sign in with your administrator credentials."}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4 p-0 pt-4">
          {isSignup && accountType === "user" && (
            <form className="account-access-form" onSubmit={handleUserRegister}>
              <div className="account-form-field">
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  minLength={2}
                  maxLength={100}
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="account-form-field">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="account-form-field">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  pattern="(?=.*[a-z])(?=.*[A-Z]).{6,}"
                  title="Use at least 6 characters, including uppercase and lowercase letters."
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <p className="account-form-hint">
                Use at least 6 characters with uppercase and lowercase letters.
              </p>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button className="button button-dark w-full" type="submit" disabled={isSubmitting || !allowRegistration}>
                {isSubmitting ? "Please wait..." : "Create account"}
              </Button>
            </form>
          )}

          {isSignup && accountType === "admin" && (
            <>
              {isCheckingSetup ? (
                <p className="account-form-hint" role="status">Checking admin setup status...</p>
              ) : adminSetupAvailable ? (
                <form className="account-access-form" onSubmit={handleAdminSetup}>
                  <Badge variant="outline" className="w-fit">One-time setup</Badge>
                  <p className="account-form-hint">
                    Enter the exact email and password configured as <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> in the backend environment.
                  </p>
                  <div className="account-form-field">
                    <Label htmlFor="admin-setup-email">Admin email</Label>
                    <Input
                      id="admin-setup-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div className="account-form-field">
                    <Label htmlFor="admin-setup-password">Admin password</Label>
                    <Input
                      id="admin-setup-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button className="button button-dark w-full" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Please wait..." : "Create administrator account"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-3">
                  {adminSetupStatus?.configured && !adminSetupStatus.available ? (
                    <Alert>
                      <AlertDescription>
                        An administrator account already exists. Please sign in as admin instead.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <AlertDescription>
                        Admin accounts are managed by the backend configuration. If you need first-time admin setup, configure <code>ADMIN_EMAIL</code> and <code>ADMIN_PASSWORD</code> in the backend environment.
                      </AlertDescription>
                    </Alert>
                  )}
                  {setupStatusError && (
                    <Alert variant="destructive">
                      <AlertDescription>{setupStatusError}</AlertDescription>
                    </Alert>
                  )}
                  <Link
                    href="/login"
                    className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Go to admin sign in
                  </Link>
                </div>
              )}
            </>
          )}

          {!isSignup && (
            <form
              className="account-access-form"
              onSubmit={accountType === "admin" ? handleAdminLogin : handleUserLogin}
            >
              <div className="account-form-field">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="account-form-field">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button className="button button-dark w-full" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : accountType === "admin" ? "Sign in as admin" : "Sign in"}
              </Button>
            </form>
          )}

          {allowGoogle && accountType === "user" && (
            <>
              <div className="account-access-divider"><span>or continue with</span></div>
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                onError={(message) => {
                  notify(message, "error");
                  setError(message);
                }}
              />
            </>
          )}

          {!isSignup && (
            <p className="account-access-switch">
              Don&apos;t have an account? <Link href="/signup">Create account</Link>
            </p>
          )}
          {isSignup && (
            <p className="account-access-switch">
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
