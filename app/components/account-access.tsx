"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { appSurfaces, publicTone } from "../data/app-theme";
import { apiRequest } from "../lib/api";
import { saveAuth, type AuthUser } from "../lib/auth";
import { useToast } from "./toast-provider";
import { GoogleSignInButton } from "./google-sign-in";

type AuthResponse = { token: string; user: AuthUser };
type AdminSetupStatus = { configured: boolean; available: boolean };

const fieldClass = "grid gap-2";

const inputClass = cn(
  "h-11 rounded-xl border-slate-200 bg-slate-50/80 px-3.5 text-sm text-slate-900 shadow-sm transition-colors",
  "placeholder:text-slate-400 focus-visible:border-[#7ba356] focus-visible:ring-3 focus-visible:ring-[#cfe0bf]/60",
  "read-only:bg-slate-100/80 read-only:text-slate-500",
);

const primaryButtonClass = cn(
  "h-11 w-full rounded-full px-6 text-sm font-semibold text-white shadow-lg shadow-[#315c3c]/20",
  "transition-all hover:-translate-y-0.5",
  "bg-linear-to-r",
  publicTone.gradient,
  "hover:from-[#3a6a45] hover:via-[#5b8249] hover:to-[#8fb361]",
);

const authSteps = [
  {
    index: "01",
    icon: Search,
    title: "Find the right equipment",
    detail: "Search live listings near you",
  },
  {
    index: "02",
    icon: ShieldCheck,
    title: "Book with confidence",
    detail: "Secure Stripe checkout and confirmation",
  },
  {
    index: "03",
    icon: LayoutDashboard,
    title: "Manage everything",
    detail: "Rentals, favorites, and profile in one place",
  },
] as const;

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
  const [photo, setPhoto] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
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
    setPhoto("");
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
      if (response.user.role !== "admin") {
        throw new Error("This account does not have administrator access. Use the User sign-in option.");
      }
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

  async function handlePhotoUpload(file: File | null) {
    if (!file) return;
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    if (!apiKey) {
      setError("Image upload is not configured. Please provide a direct image URL.");
      return;
    }
    setIsUploadingPhoto(true);
    setError("");
    try {
      const form = new FormData();
      form.append("image", file);
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as {
        success?: boolean;
        data?: { display_url?: string; url?: string };
        error?: { message?: string };
      };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || "Could not upload image");
      }
      const url = payload.data?.display_url || payload.data?.url || "";
      if (!url) throw new Error("Image upload did not return a URL");
      setPhoto(url);
      notify("Photo uploaded successfully.");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Could not upload image";
      notify(message, "error");
      setError(message);
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function handleUserRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const response = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          photo: photo.trim(),
        }),
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
    <div className="access-shell mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[0.92fr_1fr]">
      <aside
        className={cn(
          "access-aside relative isolate flex min-h-[560px] flex-col overflow-hidden rounded-[2rem] p-8 text-white shadow-2xl shadow-[#17241b]/25 sm:p-10",
          "bg-linear-to-br",
          publicTone.sidebar,
        )}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-[0.13] [background-image:linear-gradient(to_right,rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
          <div className="absolute -top-28 -left-24 size-80 rounded-full bg-[#4c6d45]/30 blur-[110px]" />
          <div className="absolute top-1/3 -right-28 size-96 rounded-full bg-[#d9ef94]/15 blur-[120px]" />
          <div className="absolute -bottom-32 left-1/4 size-80 rounded-full bg-sky-400/20 blur-[110px]" />
        </div>

        <div className="relative flex items-center gap-3">
          <span
            className={cn(
              "grid size-10 place-items-center rounded-2xl shadow-lg shadow-[#315c3c]/20",
              "bg-linear-to-br",
              publicTone.gradient,
            )}
          >
            <svg viewBox="0 0 36 36" fill="none" aria-hidden="true" className="size-6">
              <path d="M7 25.5 18 7l11 18.5H7Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
              <path d="M12 25.5 18 15l6 10.5M18 7v5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-xl font-black tracking-[-0.05em]">
            fieldkit<span className="text-[#d9ef94]">.</span>
          </span>
          <Badge className="ml-auto rounded-full border border-white/15 bg-white/10 text-[10px] font-bold tracking-[0.12em] text-[#edf3e2] uppercase">
            Member access
          </Badge>
        </div>

        <div className="relative mt-14 sm:mt-20">
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-[#dce7cd] uppercase">
            <Sparkles className="size-3.5" />
            Fieldkit membership
          </p>
          <h2 className="mt-4 max-w-md text-4xl leading-[1.05] font-bold tracking-[-0.05em] sm:text-[2.7rem]">
            Good gear.
            <br />
            <span className="bg-linear-to-r from-[#d9ef94] via-[#c8dea8] to-[#e8efdc] bg-clip-text text-transparent">
              Better projects.
            </span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
            One account for finding gear, saving favorites, and tracking every rental from start to finish.
          </p>
        </div>

        <div className="relative mt-auto grid gap-3 pt-12">
          {authSteps.map((step) => (
            <div
              key={step.index}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-sm"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-[#315c3c]/90 to-[#6f8f4c]/90 text-xs font-bold text-white shadow-md shadow-[#17241b]/25">
                {step.index}
              </span>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#edf3e2]">
                <step.icon className="size-4" />
              </span>
              <div className="min-w-0">
                <strong className="block text-sm font-semibold text-white">{step.title}</strong>
                <small className="mt-0.5 block text-xs text-slate-300/80">{step.detail}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="relative mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
          <AvatarGroup>
            {["AK", "JM", "RS"].map((initials) => (
              <Avatar key={initials} className="size-8 ring-2 ring-white/15">
                <AvatarFallback className="bg-linear-to-br from-[#5d8350] to-[#8fb361] text-[10px] font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <p className="text-xs leading-5 text-slate-400">
            Trusted by makers, crews, and weekend builders.
          </p>
        </div>
      </aside>

      <Card
        className={cn(
          "access-card mx-auto w-full max-w-[480px] gap-0 [--card-spacing:0px]",
          appSurfaces.card,
        )}
      >
        <div className={cn("h-1.5 w-full bg-linear-to-r", publicTone.panelAccent)} />
        <CardHeader className="gap-5 p-7 pb-0 sm:p-9 sm:pb-0">
          <div>
            <p className={cn(appSurfaces.eyebrow, publicTone.accentText)}>{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className={cn("mt-2", appSurfaces.body)}>
              {isSignup
                ? "Start renting better gear in just a few steps."
                : "Welcome back. Pick up right where you left off."}
            </p>
          </div>

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
            <TabsList className="grid w-full grid-cols-2 rounded-full bg-slate-100 p-1 group-data-horizontal/tabs:h-11">
              <TabsTrigger
                value="user"
                className="h-9 rounded-full text-slate-600 data-active:bg-white data-active:text-slate-900 data-active:shadow-sm"
              >
                User
              </TabsTrigger>
              <TabsTrigger
                value="admin"
                className="h-9 rounded-full text-slate-600 data-active:bg-white data-active:text-slate-900 data-active:shadow-sm"
              >
                Admin
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {accountType === "user" ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
              Customers and equipment owners both sign in here. New email and Google accounts start as customers; an admin can promote a customer to owner.
            </p>
          ) : null}

          {accountType === "admin" && (
            <p className="rounded-xl border border-[#dfe6d8] bg-[#f3f7ee]/80 p-3 text-xs leading-6 text-slate-600">
              {isSignup
                ? "Admin access is provisioned from the backend configuration. If first-admin setup is available, you can create it here."
                : "Sign in with your administrator credentials."}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-5 p-7 pt-5 sm:p-9 sm:pt-6">
          {isSignup && accountType === "user" && (
            <form className="grid gap-4" onSubmit={handleUserRegister}>
              <div className={fieldClass}>
                <Label htmlFor="signup-name" className="text-xs font-semibold text-slate-700">
                  Name
                </Label>
                <Input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  minLength={2}
                  maxLength={100}
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <Label htmlFor="signup-email" className="text-xs font-semibold text-slate-700">
                  Email
                </Label>
                <Input
                  id="signup-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <Label htmlFor="signup-photo" className="text-xs font-semibold text-slate-700">
                  Photo URL or imgbb upload
                </Label>
                <Input
                  id="signup-photo"
                  type="url"
                  placeholder="https://..."
                  value={photo}
                  onChange={(event) => setPhoto(event.target.value)}
                  className={inputClass}
                />
                <Input
                  id="signup-photo-file"
                  type="file"
                  accept="image/*"
                  className={cn(inputClass, "h-auto py-2")}
                  onChange={(event) => void handlePhotoUpload(event.target.files?.[0] || null)}
                />
                <p className="text-xs leading-5 text-slate-500">
                  Provide a direct image link, or upload an image to imgbb.
                </p>
              </div>
              <div className={fieldClass}>
                <Label htmlFor="signup-password" className="text-xs font-semibold text-slate-700">
                  Password
                </Label>
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
                  className={inputClass}
                />
              </div>
              <p className="text-xs leading-5 text-slate-500">
                Use at least 6 characters with uppercase and lowercase letters.
              </p>
              {error && (
                <Alert variant="destructive" className="rounded-xl border-[#f0d6d3] bg-[#fff7f6]/80">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button className={primaryButtonClass} type="submit" disabled={isSubmitting || isUploadingPhoto || !allowRegistration}>
                {isUploadingPhoto ? "Uploading photo..." : isSubmitting ? "Please wait..." : "Create account"}
                {!isSubmitting && <ArrowRight className="size-4" />}
              </Button>
            </form>
          )}

          {isSignup && accountType === "admin" && (
            <>
              {isCheckingSetup ? (
                <div className="space-y-3" role="status">
                  <p className={cn("flex items-center gap-2", appSurfaces.body)}>
                    <span className="size-1.5 animate-pulse rounded-full bg-[#edf3e2]0" />
                    Checking admin setup status...
                  </p>
                  <Skeleton className="h-11 w-full rounded-xl bg-[#e8efdc]" />
                  <Skeleton className="h-11 w-full rounded-xl bg-[#e8efdc]" />
                </div>
              ) : adminSetupAvailable ? (
                <form className="grid gap-4" onSubmit={handleAdminSetup}>
                  <Badge
                    variant="outline"
                    className={cn("h-auto rounded-full px-3 py-1 text-[11px] font-bold", publicTone.softBadge)}
                  >
                    One-time setup
                  </Badge>
                  <p className="text-xs leading-6 text-slate-600">
                    Enter the exact email and password configured as{" "}
                    <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-slate-700">ADMIN_EMAIL</code>{" "}
                    and{" "}
                    <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-slate-700">ADMIN_PASSWORD</code>{" "}
                    in the backend environment.
                  </p>
                  <div className={fieldClass}>
                    <Label htmlFor="admin-setup-email" className="text-xs font-semibold text-slate-700">
                      Admin email
                    </Label>
                    <Input
                      id="admin-setup-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className={fieldClass}>
                    <Label htmlFor="admin-setup-password" className="text-xs font-semibold text-slate-700">
                      Admin password
                    </Label>
                    <Input
                      id="admin-setup-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive" className="rounded-xl border-[#f0d6d3] bg-[#fff7f6]/80">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button className={primaryButtonClass} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Please wait..." : "Create administrator account"}
                  </Button>
                </form>
              ) : (
                <div className="space-y-3">
                  {adminSetupStatus?.configured && !adminSetupStatus.available ? (
                    <Alert className="rounded-xl border-[#dfe6d8] bg-[#f3f7ee]/80">
                      <AlertDescription>
                        An administrator account already exists. Please sign in as admin instead.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="rounded-xl border-[#dfe6d8] bg-[#f3f7ee]/80">
                      <AlertDescription>
                        Admin accounts are managed by the backend configuration. If you need first-time admin setup, configure{" "}
                        <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-slate-700">ADMIN_EMAIL</code>{" "}
                        and{" "}
                        <code className="rounded bg-white px-1 py-0.5 font-mono text-[11px] text-slate-700">ADMIN_PASSWORD</code>{" "}
                        in the backend environment.
                      </AlertDescription>
                    </Alert>
                  )}
                  {setupStatusError && (
                    <Alert variant="destructive" className="rounded-xl border-[#f0d6d3] bg-[#fff7f6]/80">
                      <AlertDescription>{setupStatusError}</AlertDescription>
                    </Alert>
                  )}
                  <Link
                    href="/login"
                    className={buttonVariants({
                      variant: "outline",
                      className:
                        "h-11 w-full rounded-full border-slate-200 bg-white text-slate-700 hover:bg-[#edf3e2] hover:text-[#315c3c]",
                    })}
                  >
                    Go to admin sign in
                  </Link>
                </div>
              )}
            </>
          )}

          {!isSignup && (
            <form
              className="grid gap-4"
              onSubmit={accountType === "admin" ? handleAdminLogin : handleUserLogin}
            >
              <div className={fieldClass}>
                <Label htmlFor="login-email" className="text-xs font-semibold text-slate-700">
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                />
              </div>
              <div className={fieldClass}>
                <Label htmlFor="login-password" className="text-xs font-semibold text-slate-700">
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                />
              </div>
              {error && (
                <Alert variant="destructive" className="rounded-xl border-[#f0d6d3] bg-[#fff7f6]/80">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button className={primaryButtonClass} type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : accountType === "admin" ? "Sign in as admin" : "Sign in"}
                {!isSubmitting && <ArrowRight className="size-4" />}
              </Button>
            </form>
          )}

          {allowGoogle && accountType === "user" && (
            <>
              <div className="relative py-1">
                <Separator className="bg-slate-200" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-white px-3 text-[11px] font-medium text-slate-400">
                    or continue with
                  </span>
                </span>
              </div>
              <div className="flex min-h-11 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                <GoogleSignInButton
                  onCredential={handleGoogleCredential}
                  onError={(message) => {
                    notify(message, "error");
                    setError(message);
                  }}
                />
              </div>
            </>
          )}

          {!isSignup && (
            <p className="pt-1 text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className={cn(appSurfaces.link, "hover:underline")}>
                Create account
              </Link>
            </p>
          )}
          {isSignup && (
            <p className="pt-1 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className={cn(appSurfaces.link, "hover:underline")}>
                Sign in
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
