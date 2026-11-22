"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Heart,
  LayoutDashboard,
  LogOut,
  PackageSearch,
  Printer,
  ReceiptText,
  RefreshCw,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { apiRequest, formatCurrency, type EquipmentListing } from "../lib/api";
import { clearAuth, saveAuth, type AuthUser } from "../lib/auth";
import { dashboardHref } from "../lib/dashboard-routes";
import { GoogleSignInButton } from "./google-sign-in";
import { useToast } from "./toast-provider";

type AccountUser = AuthUser & { phone?: string; address?: string };

type Booking = {
  id: string;
  equipmentName: string;
  rentalStartDate: string;
  rentalEndDate: string;
  createdAt?: string;
  quantity: number;
  totalAmount: number;
  bookingStatus: string;
  paymentStatus: string;
  equipment?: { id: string; image?: string; location?: string };
};

type Payment = {
  id: string;
  bookingId: string;
  paymentIntentId?: string;
  status: string;
  createdAt: string;
};

type Favorite = { favoriteId: string; equipment: EquipmentListing | null };

type AccountData = {
  user: AccountUser;
  bookings: Booking[];
  payments: Payment[];
  favorites: Favorite[];
  reviewedBookingIds: string[];
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

async function loadAccountData(token: string): Promise<AccountData> {
  const headers = { Authorization: `Bearer ${token}` };
  const profile = await apiRequest<{ user: AccountUser }>("/profile", { headers });
  if (profile.user.role !== "customer") {
    return { user: profile.user, bookings: [], payments: [], favorites: [], reviewedBookingIds: [] };
  }
  const [bookings, payments, favorites, reviews] = await Promise.all([
    apiRequest<{ items: Booking[] }>("/bookings/mine", { headers }),
    apiRequest<{ items: Payment[] }>("/payments/mine", { headers }),
    apiRequest<{ items: Favorite[] }>("/favorites", { headers }),
    apiRequest<{ items: { bookingId: string }[] }>("/reviews/mine", { headers }),
  ]);
  return {
    user: profile.user,
    bookings: bookings.items,
    payments: payments.items,
    favorites: favorites.items,
    reviewedBookingIds: reviews.items.map((review) => review.bookingId),
  };
}

function formatRentalDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-BD", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
}

function statusBadgeClass(status: string) {
  const value = status.toLowerCase();
  if (value.includes("paid") || value.includes("succeeded") || value.includes("confirmed")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value.includes("fail") || value.includes("cancel") || value.includes("refund")) {
    return "border-[#f0d6d3] bg-[#fff7f6] text-rose-700";
  }
  if (value.includes("pending") || value.includes("processing")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function initialsFor(name?: string) {
  const initials = (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "FK";
}

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

export function AccountDashboard({
  initialView = "overview",
}: {
  initialView?: "overview" | "rentals" | "favorites" | "profile";
}) {
  const router = useRouter();
  const { notify } = useToast();
  const [token, setToken] = useState("");
  const [profile, setProfile] = useState<AccountUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<string[]>([]);
  const [reviewingBookingId, setReviewingBookingId] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewQuote, setReviewQuote] = useState("");
  const [bookingPage, setBookingPage] = useState(1);
  const [view, setView] = useState(initialView);
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountDataLoaded, setAccountDataLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function initializeAccount() {
      const savedToken = window.localStorage.getItem("fieldkit_token") || "";
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      setToken(savedToken);
      setIsAuthenticated(true);
      setEmail(window.localStorage.getItem("fieldkit_user_email") || "");
      try {
        const account = await loadAccountData(savedToken);
        if (cancelled) return;
        saveAuth(savedToken, account.user);
        if (account.user.role !== "customer") {
          router.replace(dashboardHref(account.user.role));
          return;
        }
        setProfile(account.user);
        setName(account.user.name);
        setEmail(account.user.email);
        setPhoto(account.user.photo || "");
        setPhone(account.user.phone || "");
        setAddress(account.user.address || "");
        setBookings(account.bookings);
        setPayments(account.payments);
        setFavorites(account.favorites);
        setReviewedBookingIds(account.reviewedBookingIds);
        setAccountDataLoaded(true);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load your account.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void initializeAccount();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleAuthentication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await apiRequest<AuthResponse>(
        authMode === "register" ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: JSON.stringify(
            authMode === "register"
              ? { name: name.trim(), email: email.trim(), password }
              : { email: email.trim(), password },
          ),
        },
      );
      saveAuth(response.token, response.user);
      router.replace(dashboardHref(response.user.role));
      return;
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Could not sign in.");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }

  async function handleGoogleCredential(credential: string) {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await apiRequest<AuthResponse>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      });
      saveAuth(response.token, response.user);
      router.replace(dashboardHref(response.user.role));
      return;
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Google sign-in failed.");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }

  async function retryLoadingAccount() {
    if (!token || isLoading) return;
    setIsLoading(true);
    setError("");
    try {
      const account = await loadAccountData(token);
      if (account.user.role !== "customer") {
        router.replace(dashboardHref(account.user.role));
        return;
      }
      setProfile(account.user);
      setName(account.user.name);
      setPhoto(account.user.photo || "");
      setPhone(account.user.phone || "");
      setAddress(account.user.address || "");
      setBookings(account.bookings);
      setPayments(account.payments);
      setFavorites(account.favorites);
      setReviewedBookingIds(account.reviewedBookingIds);
      setAccountDataLoaded(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your account.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleProfilePhotoUpload(file: File | null) {
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
      notify("Profile photo uploaded successfully.");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Could not upload image";
      notify(message, "error");
      setError(message);
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || isSaving || !name.trim()) return;

    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<{ user: AccountUser }>("/profile", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: name.trim(),
          photo: photo.trim(),
          phone: phone.trim(),
          address: address.trim(),
        }),
      });
      setProfile(result.user);
      setName(result.user.name);
      setPhoto(result.user.photo || "");
      setPhone(result.user.phone || "");
      setAddress(result.user.address || "");
      setNotice("Your profile has been updated.");
      notify("Your profile has been updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update your profile.");
    } finally {
      setIsSaving(false);
    }
  }

  async function removeFavorite(equipmentId: string) {
    if (!token) return;
    try {
      await apiRequest(`/favorites/${equipmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites((current) => current.filter((item) => item.equipment?.id !== equipmentId));
      notify("Removed from your favorites.");
    } catch (removeError) {
      notify(removeError instanceof Error ? removeError.message : "Could not remove favorite", "error");
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>, bookingId: string) {
    event.preventDefault();
    if (!token || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiRequest("/reviews", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId, rating: Number(reviewRating), quote: reviewQuote.trim() }),
      });
      setReviewedBookingIds((current) => [...current, bookingId]);
      setReviewingBookingId("");
      setReviewQuote("");
      setReviewRating("5");
      notify("Thanks for sharing your rental experience.");
    } catch (reviewError) {
      notify(reviewError instanceof Error ? reviewError.message : "Could not submit your review.", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  function signOut() {
    clearAuth();
    setToken("");
    setProfile(null);
    setBookings([]);
    setPayments([]);
    setFavorites([]);
    setReviewedBookingIds([]);
    setReviewingBookingId("");
    setReceiptBooking(null);
    setIsAuthenticated(false);
    setAccountDataLoaded(false);
    setPassword("");
    setError("");
    setNotice("");
  }

  return (
    <>
      <main className={cn(appSurfaces.page, "account-page-v2 relative isolate overflow-hidden")}>
        <div aria-hidden="true" className={appSurfaces.pageGlow} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 top-10 size-[26rem] rounded-full bg-[#d9ef94]/20 blur-[120px]"
        />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className={cn(appSurfaces.eyebrow, "flex items-center gap-2", publicTone.accentText)}>
                <span className="h-px w-6 bg-current" />
                Your Fieldkit
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                {isAuthenticated ? "Your account." : "Welcome back."}
              </h1>
              <p className={cn("mt-3 max-w-xl", appSurfaces.body)}>
                {isAuthenticated
                  ? "Keep your details up to date and stay on top of your rentals."
                  : "Sign in or create an account to manage your rentals."}
              </p>
            </div>
            {isAuthenticated && (
              <div className="flex flex-wrap items-center gap-2">
                {profile && (
                  <Badge
                    variant="outline"
                    className={cn("h-auto rounded-full px-3 py-1 text-[11px] font-bold capitalize", publicTone.softBadge)}
                  >
                    {profile.role}
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={signOut}
                  className="h-10 rounded-full border-slate-200 bg-white text-slate-700 hover:bg-[#edf3e2] hover:text-[#315c3c]"
                >
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </div>
            )}
          </header>

          {isLoading ? (
            <div className={cn(appSurfaces.card, "p-7 sm:p-9")} role="status">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className="size-2 animate-pulse rounded-full bg-[#edf3e2]0" />
                Loading your account...
              </p>
              <div className="mt-6 grid gap-3">
                <Skeleton className="h-20 w-full rounded-2xl bg-[#e8efdc]/80" />
                <Skeleton className="h-20 w-full rounded-2xl bg-[#e8efdc]/70" />
                <Skeleton className="h-20 w-2/3 rounded-2xl bg-sky-100/70" />
              </div>
            </div>
          ) : !isAuthenticated ? (
            <Card
              className={cn(appSurfaces.card, "mx-auto w-full max-w-xl gap-0 [--card-spacing:0px]")}
            >
              <div className={cn("h-1.5 w-full bg-linear-to-r", publicTone.panelAccent)} />
              <CardHeader className="p-7 pb-0 sm:p-9 sm:pb-0">
                <span className={cn("flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] uppercase", publicTone.softBadge)}>
                  <Sparkles className="size-3" />
                  Customer account
                </span>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                  {authMode === "login" ? "Sign in to Fieldkit" : "Create your account"}
                </h2>
                <p className={cn("mt-2", appSurfaces.body)}>
                  {authMode === "login"
                    ? "Access your profile and booking history."
                    : "Join Fieldkit to book equipment and track your rentals."}
                </p>
              </CardHeader>
              <CardContent className="p-7 pt-5 sm:p-9 sm:pt-6">
                <form className="grid gap-4" onSubmit={handleAuthentication}>
                  {authMode === "register" && (
                    <div className="grid gap-2">
                      <Label htmlFor="customer-name" className="text-xs font-semibold text-slate-700">
                        Full name
                      </Label>
                      <Input
                        id="customer-name"
                        autoComplete="name"
                        maxLength={100}
                        minLength={2}
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className={inputClass}
                      />
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="customer-email" className="text-xs font-semibold text-slate-700">
                      Email address
                    </Label>
                    <Input
                      id="customer-email"
                      autoComplete="email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customer-password" className="text-xs font-semibold text-slate-700">
                      Password
                    </Label>
                    <Input
                      id="customer-password"
                      autoComplete={authMode === "login" ? "current-password" : "new-password"}
                      type="password"
                      minLength={6}
                      pattern={authMode === "register" ? "(?=.*[a-z])(?=.*[A-Z]).{6,}" : undefined}
                      title="Use at least 6 characters, including uppercase and lowercase letters."
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  {authMode === "register" && (
                    <p className="text-xs leading-5 text-slate-500">
                      Use at least 6 characters with uppercase and lowercase letters.
                    </p>
                  )}
                  {error && (
                    <Alert variant="destructive" className="rounded-xl border-[#f0d6d3] bg-[#fff7f6]/80">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button className={primaryButtonClass} type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? "Please wait..."
                      : authMode === "login"
                        ? "Sign in"
                        : "Create account"}
                    {!isSubmitting && <ArrowUpRight className="size-4" />}
                  </Button>
                  <div className="relative py-2">
                    <Separator className="bg-slate-200" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-white px-3 text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">
                        Or continue with
                      </span>
                    </span>
                  </div>
                  <div className="flex min-h-11 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
                    <GoogleSignInButton
                      onCredential={handleGoogleCredential}
                      onError={setError}
                    />
                  </div>
                </form>
                <p className="pt-5 text-center text-sm text-slate-600">
                  {authMode === "login" ? "New to Fieldkit?" : "Already have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === "login" ? "register" : "login");
                      setError("");
                    }}
                    className={cn(appSurfaces.link, "cursor-pointer hover:underline")}
                  >
                    {authMode === "login" ? "Create an account" : "Sign in"}
                  </button>
                </p>
              </CardContent>
            </Card>
          ) : !accountDataLoaded ? (
            <Card
              className={cn(
                appSurfaces.card,
                "mx-auto grid w-full max-w-xl justify-items-start gap-4 p-7 sm:p-9",
              )}
            >
              {error && (
                <Alert variant="destructive" className="rounded-xl border-[#f0d6d3] bg-[#fff7f6]/80">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                className={primaryButtonClass}
                type="button"
                disabled={isLoading}
                onClick={retryLoadingAccount}
              >
                <RefreshCw className="size-4" />
                {isLoading ? "Loading..." : "Retry loading account"}
              </Button>
              <button
                type="button"
                onClick={signOut}
                className={cn(appSurfaces.link, "cursor-pointer text-sm hover:underline")}
              >
                Sign out and use a different account
              </button>
            </Card>
          ) : (
            <div className="grid gap-5">
              {error && (
                <Alert variant="destructive" className="rounded-2xl border-[#f0d6d3] bg-[#fff7f6]/80">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {notice && (
                <Alert className="rounded-2xl border-emerald-200 bg-emerald-50/80 text-emerald-800">
                  <Check className="size-4" />
                  <AlertDescription>{notice}</AlertDescription>
                </Alert>
              )}

              <Tabs
                value={view}
                onValueChange={(value) => {
                  if (
                    value === "overview" ||
                    value === "rentals" ||
                    value === "favorites" ||
                    value === "profile"
                  ) {
                    setView(value);
                  }
                }}
                className="w-full"
              >
                <TabsList className="flex w-full flex-wrap justify-start gap-1 rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 shadow-sm group-data-horizontal/tabs:h-auto">
                  <TabsTrigger
                    value="overview"
                    className="h-9 gap-2 rounded-xl px-4 text-slate-600 data-active:bg-linear-to-r data-active:from-[#315c3c] data-active:via-[#4c6d45] data-active:to-[#7ba356] data-active:text-white data-active:shadow-md data-active:shadow-[#315c3c]/15"
                  >
                    <LayoutDashboard className="size-4" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="rentals"
                    className="h-9 gap-2 rounded-xl px-4 text-slate-600 data-active:bg-linear-to-r data-active:from-[#315c3c] data-active:via-[#4c6d45] data-active:to-[#7ba356] data-active:text-white data-active:shadow-md data-active:shadow-[#315c3c]/15"
                  >
                    <CalendarDays className="size-4" />
                    My rentals
                  </TabsTrigger>
                  <TabsTrigger
                    value="favorites"
                    className="h-9 gap-2 rounded-xl px-4 text-slate-600 data-active:bg-linear-to-r data-active:from-[#315c3c] data-active:via-[#4c6d45] data-active:to-[#7ba356] data-active:text-white data-active:shadow-md data-active:shadow-[#315c3c]/15"
                  >
                    <Heart className="size-4" />
                    Favorites
                  </TabsTrigger>
                  <TabsTrigger
                    value="profile"
                    className="h-9 gap-2 rounded-xl px-4 text-slate-600 data-active:bg-linear-to-r data-active:from-[#315c3c] data-active:via-[#4c6d45] data-active:to-[#7ba356] data-active:text-white data-active:shadow-md data-active:shadow-[#315c3c]/15"
                  >
                    <UserRound className="size-4" />
                    Profile
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
                {view !== "rentals" && view !== "favorites" && (
                  <Card
                    className={cn(
                      appSurfaces.card,
                      "gap-0",
                      view === "profile" ? "lg:col-span-2" : "lg:row-span-2",
                    )}
                  >
                    <div className={cn("h-1.5 w-full bg-linear-to-r", publicTone.panelAccent)} />
                    <CardHeader className="p-6 pb-0 sm:p-7 sm:pb-0">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-11 ring-2 ring-[#dce7cd]">
                          <AvatarFallback className={cn("text-xs font-bold", publicTone.softBadge)}>
                            {initialsFor(profile?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className={appSurfaces.eyebrow}>Personal details</p>
                          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                            Your profile
                          </h2>
                          <p className={cn("mt-1", appSurfaces.body)}>
                            These details help owners coordinate your rental.
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-5 sm:p-7 sm:pt-6">
                      <form className="grid gap-4" onSubmit={saveProfile}>
                        <div className="grid gap-2">
                          <Label htmlFor="profile-name" className="text-xs font-semibold text-slate-700">
                            Full name
                          </Label>
                          <Input
                            id="profile-name"
                            autoComplete="name"
                            maxLength={100}
                            minLength={2}
                            required
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className={inputClass}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="profile-email" className="text-xs font-semibold text-slate-700">
                            Email address
                          </Label>
                          <Input
                            id="profile-email"
                            type="email"
                            value={profile?.email || email}
                            readOnly
                            className={inputClass}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="profile-photo" className="text-xs font-semibold text-slate-700">
                            Profile image URL or upload
                          </Label>
                          <Input
                            id="profile-photo"
                            type="url"
                            placeholder="https://..."
                            value={photo}
                            onChange={(event) => setPhoto(event.target.value)}
                            className={inputClass}
                          />
                          <Input
                            id="profile-photo-file"
                            type="file"
                            accept="image/*"
                            className={cn(inputClass, "h-auto py-2")}
                            onChange={(event) => void handleProfilePhotoUpload(event.target.files?.[0] || null)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="profile-phone" className="text-xs font-semibold text-slate-700">
                            Phone number
                          </Label>
                          <Input
                            id="profile-phone"
                            autoComplete="tel"
                            maxLength={30}
                            type="tel"
                            value={phone}
                            onChange={(event) => setPhone(event.target.value)}
                            className={inputClass}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="profile-address" className="text-xs font-semibold text-slate-700">
                            Address
                          </Label>
                          <textarea
                            id="profile-address"
                            autoComplete="street-address"
                            maxLength={300}
                            rows={3}
                            value={address}
                            onChange={(event) => setAddress(event.target.value)}
                            className={cn(
                              "min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-colors",
                              "placeholder:text-slate-400 focus-visible:border-[#7ba356] focus-visible:ring-3 focus-visible:ring-[#cfe0bf]/60",
                            )}
                          />
                        </div>
                        <Button className={primaryButtonClass} type="submit" disabled={isSaving || isUploadingPhoto}>
                          {isUploadingPhoto ? "Uploading photo..." : isSaving ? "Saving..." : "Save changes"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                {view !== "favorites" && view !== "profile" && (
                  <Card
                    className={cn(
                      appSurfaces.card,
                      "gap-0",
                      view === "rentals" && "lg:col-span-2",
                    )}
                  >
                    <div className={cn("h-1.5 w-full bg-linear-to-r", publicTone.panelAccent)} />
                    <CardHeader className="p-6 pb-0 sm:p-7 sm:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span
                            className={cn("grid size-10 place-items-center rounded-xl", publicTone.iconTile)}
                          >
                            <CalendarDays className="size-5" />
                          </span>
                          <div>
                            <p className={appSurfaces.eyebrow}>Your rentals</p>
                            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                              Booking history
                            </h2>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold",
                            publicTone.softBadge,
                          )}
                        >
                          {bookings.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-5 sm:p-7 sm:pt-6">
                      {bookings.length ? (
                        <div className="grid gap-3">
                          {bookings.slice((bookingPage - 1) * 6, bookingPage * 6).map((booking) => {
                            const payment = payments.find((item) => String(item.bookingId) === booking.id);
                            return (
                              <article
                                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors hover:border-[#d7dfd1]"
                                key={booking.id}
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900">
                                      {booking.equipmentName}
                                    </h3>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                      {formatRentalDate(booking.rentalStartDate)} - {formatRentalDate(booking.rentalEndDate)} · {booking.quantity} {booking.quantity === 1 ? "item" : "items"}
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-slate-400">
                                      Booking date: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : "—"}
                                    </p>
                                  </div>
                                  <strong className="text-sm font-bold text-slate-900">
                                    {formatCurrency(booking.totalAmount)}
                                  </strong>
                                </div>
                                <Separator className="my-3 bg-slate-100" />
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "h-auto rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                                      statusBadgeClass(booking.paymentStatus),
                                    )}
                                  >
                                    Payment: {booking.paymentStatus}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "h-auto rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
                                      statusBadgeClass(booking.bookingStatus),
                                    )}
                                  >
                                    Booking: {booking.bookingStatus}
                                  </Badge>
                                  {booking.equipment?.id && (
                                    <Link
                                      href={`/equipment/${booking.equipment.id}`}
                                      className={cn(
                                        appSurfaces.link,
                                        "ml-auto inline-flex items-center gap-1 text-xs hover:underline",
                                      )}
                                    >
                                      View equipment <ArrowUpRight className="size-3.5" />
                                    </Link>
                                  )}
                                </div>
                                {payment?.status === "paid" && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReceiptBooking(booking)}
                                    className="mt-4 h-9 rounded-full border-[#d7dfd1] bg-[#f3f7ee]/80 text-[#315c3c] hover:bg-[#e8efdc]"
                                  >
                                    <ReceiptText className="size-3.5" />
                                    View / print payment receipt
                                  </Button>
                                )}
                                {booking.bookingStatus === "completed" && booking.paymentStatus === "paid" ? (
                                  reviewedBookingIds.includes(booking.id) ? (
                                    <Badge variant="outline" className="mt-4 ml-2 rounded-full border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700">
                                      Review submitted
                                    </Badge>
                                  ) : (
                                    <div className="mt-4">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setReviewingBookingId((current) => current === booking.id ? "" : booking.id)}
                                        className="h-9 rounded-full border-[#d7dfd1] bg-[#f3f7ee]/80 text-[#315c3c] hover:bg-[#e8efdc]"
                                      >
                                        {reviewingBookingId === booking.id ? "Close review" : "Leave a review"}
                                      </Button>
                                      {reviewingBookingId === booking.id ? (
                                        <form onSubmit={(event) => void submitReview(event, booking.id)} className="mt-3 grid gap-3 rounded-2xl border border-[#dfe6d8] bg-[#f3f7ee]/70 p-4">
                                          <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                                            Your rating
                                            <select value={reviewRating} onChange={(event) => setReviewRating(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800">
                                              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} out of 5</option>)}
                                            </select>
                                          </label>
                                          <label className="grid gap-1.5 text-xs font-semibold text-slate-600">
                                            Share your rental experience
                                            <textarea value={reviewQuote} onChange={(event) => setReviewQuote(event.target.value)} required minLength={10} maxLength={1000} rows={3} className="resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-[#cfe0bf]" placeholder="What went well?" />
                                          </label>
                                          <Button type="submit" size="sm" disabled={isSubmitting || reviewQuote.trim().length < 10} className={cn("w-fit rounded-full text-white", publicTone.gradient)}>
                                            {isSubmitting ? "Submitting..." : "Submit review"}
                                          </Button>
                                        </form>
                                      ) : null}
                                    </div>
                                  )
                                ) : null}
                              </article>
                            );
                          })}
                          {bookings.length > 6 ? (
                            <div className="flex items-center justify-between gap-3 pt-2">
                              <p className="text-xs text-slate-500">Page {bookingPage} of {Math.ceil(bookings.length / 6)}</p>
                              <div className="flex gap-2">
                                <Button type="button" size="sm" variant="outline" disabled={bookingPage === 1} onClick={() => setBookingPage((page) => Math.max(1, page - 1))}>Previous</Button>
                                <Button type="button" size="sm" variant="outline" disabled={bookingPage >= Math.ceil(bookings.length / 6)} onClick={() => setBookingPage((page) => Math.min(Math.ceil(bookings.length / 6), page + 1))}>Next</Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="grid justify-items-start gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6">
                          <span
                            className={cn("grid size-10 place-items-center rounded-xl", publicTone.iconTile)}
                          >
                            <PackageSearch className="size-5" />
                          </span>
                          <h3 className="text-base font-bold text-slate-900">
                            {profile?.role === "customer"
                              ? "No bookings yet"
                              : "Your rentals are managed separately"}
                          </h3>
                          <p className={cn("max-w-sm", appSurfaces.body)}>
                            {profile?.role === "customer"
                              ? "Your paid and pending rentals will appear here."
                              : "Open the management dashboard to manage your listings and rentals."}
                          </p>
                          <Link
                            className={buttonVariants({
                              className: cn(primaryButtonClass, "mt-2 w-auto"),
                            })}
                            href={profile?.role === "customer" ? "/equipment" : "/dashboard"}
                          >
                            {profile?.role === "customer" ? "Find equipment" : "Open dashboard"}
                            <ArrowUpRight className="size-4" />
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {view !== "rentals" && view !== "profile" && (
                  <Card
                    className={cn(
                      appSurfaces.card,
                      "gap-0",
                      view === "favorites" && "lg:col-span-2",
                    )}
                  >
                    <div className={cn("h-1.5 w-full bg-linear-to-r", publicTone.panelAccent)} />
                    <CardHeader className="p-6 pb-0 sm:p-7 sm:pb-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span
                            className={cn("grid size-10 place-items-center rounded-xl", publicTone.iconTile)}
                          >
                            <Heart className="size-5" />
                          </span>
                          <div>
                            <p className={appSurfaces.eyebrow}>Saved for later</p>
                            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                              Favorite equipment
                            </h2>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold",
                            publicTone.softBadge,
                          )}
                        >
                          {favorites.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-5 sm:p-7 sm:pt-6">
                      {favorites.length ? (
                        <div className="grid gap-3">
                          {favorites.map((favorite) => {
                            const item = favorite.equipment;
                            if (!item) return null;
                            return (
                              <article
                                className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-colors hover:border-[#d7dfd1]"
                                key={favorite.favoriteId}
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <span
                                      className={cn(
                                        "grid size-10 place-items-center rounded-xl",
                                        publicTone.iconTile,
                                      )}
                                    >
                                      <Wrench className="size-5" />
                                    </span>
                                    <div>
                                      <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                                      <p className="mt-1 text-xs leading-5 text-slate-500">
                                        {item.category} · {item.location}
                                      </p>
                                    </div>
                                  </div>
                                  <strong className="text-sm font-bold text-slate-900">
                                    {formatCurrency(item.price)}
                                  </strong>
                                </div>
                                <Separator className="my-3 bg-slate-100" />
                                <div className="flex flex-wrap items-center gap-2">
                                  <Link
                                    href={`/equipment/${item.id}`}
                                    className={cn(
                                      appSurfaces.link,
                                      "inline-flex items-center gap-1 text-xs hover:underline",
                                    )}
                                  >
                                    View details <ArrowUpRight className="size-3.5" />
                                  </Link>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFavorite(item.id)}
                                    className="h-8 rounded-full px-3 text-xs text-[#9a3f37] hover:bg-[#fff7f6] hover:text-rose-700"
                                  >
                                    Remove favorite
                                  </Button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="grid justify-items-start gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-6">
                          <span
                            className={cn("grid size-10 place-items-center rounded-xl", publicTone.iconTile)}
                          >
                            <Heart className="size-5" />
                          </span>
                          <h3 className="text-base font-bold text-slate-900">No favorites yet</h3>
                          <p className={cn("max-w-sm", appSurfaces.body)}>
                            Save equipment from its details page to find it here later.
                          </p>
                          <Link
                            className={buttonVariants({
                              className: cn(primaryButtonClass, "mt-2 w-auto"),
                            })}
                            href="/equipment"
                          >
                            Browse equipment <ArrowUpRight className="size-4" />
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {receiptBooking && (
        <ReceiptDialog
          booking={receiptBooking}
          payment={payments.find((item) => String(item.bookingId) === receiptBooking.id)}
          onClose={() => setReceiptBooking(null)}
        />
      )}
    </>
  );
}

function ReceiptDialog({
  booking,
  payment,
  onClose,
}: {
  booking: Booking;
  payment?: Payment;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-sm"
        type="button"
        aria-label="Close receipt"
        onClick={onClose}
      />
      <Card
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-title"
        className={cn(
          appSurfaces.card,
          "relative z-10 w-full max-w-lg gap-0 [--card-spacing:0px]",
        )}
      >
        <div className={cn("h-1.5 w-full rounded-t-3xl bg-linear-to-r", publicTone.panelAccent)} />
        <CardHeader className="relative p-6 pb-0 sm:p-7 sm:pb-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close receipt"
            onClick={onClose}
            className="absolute top-5 right-5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </Button>
          <p className={cn(appSurfaces.eyebrow, publicTone.accentText)}>Fieldkit / Payment receipt</p>
          <h2 id="receipt-title" className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Payment receipt
          </h2>
          <p className={cn("mt-1", appSurfaces.body)}>A printable summary of your rental payment.</p>
        </CardHeader>
        <CardContent className="p-6 pt-5 sm:p-7 sm:pt-6">
          <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200/70 bg-slate-50/60 px-4">
            <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <dt className="text-xs font-medium text-slate-500">Receipt</dt>
              <dd className="text-sm font-semibold text-slate-900">{payment?.id || booking.id}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <dt className="text-xs font-medium text-slate-500">Equipment</dt>
              <dd className="text-sm font-semibold text-slate-900">{booking.equipmentName}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <dt className="text-xs font-medium text-slate-500">Rental dates</dt>
              <dd className="text-sm font-semibold text-slate-900">
                {formatRentalDate(booking.rentalStartDate)} – {formatRentalDate(booking.rentalEndDate)}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <dt className="text-xs font-medium text-slate-500">Quantity</dt>
              <dd className="text-sm font-semibold text-slate-900">{booking.quantity}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <dt className="text-xs font-medium text-slate-500">Amount paid</dt>
              <dd className="text-sm font-bold text-slate-900">{formatCurrency(booking.totalAmount)}</dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <dt className="text-xs font-medium text-slate-500">Payment status</dt>
              <dd className="text-sm font-semibold text-slate-900">
                {payment?.status || booking.paymentStatus}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <dt className="text-xs font-medium text-slate-500">Paid at</dt>
              <dd className="text-sm font-semibold text-slate-900">
                {payment ? new Date(payment.createdAt).toLocaleString() : "Confirmed by Stripe"}
              </dd>
            </div>
            {payment?.paymentIntentId && typeof payment.paymentIntentId === "string" && (
              <div className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <dt className="text-xs font-medium text-slate-500">Stripe reference</dt>
                <dd className="break-all text-sm font-semibold text-slate-900">
                  {payment.paymentIntentId}
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => window.print()}
              className={cn(primaryButtonClass, "h-10 w-auto")}
            >
              <Printer className="size-4" />
              Print receipt
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
