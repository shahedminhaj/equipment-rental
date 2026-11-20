"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, formatCurrency, type EquipmentListing } from "../lib/api";
import { clearAuth, saveAuth, type AuthUser } from "../lib/auth";
import { GoogleSignInButton } from "./google-sign-in";
import { useToast } from "./toast-provider";

type AccountUser = AuthUser & { phone?: string; address?: string };

type Booking = {
  id: string;
  equipmentName: string;
  rentalStartDate: string;
  rentalEndDate: string;
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
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

async function loadAccountData(token: string): Promise<AccountData> {
  const headers = { Authorization: `Bearer ${token}` };
  const profile = await apiRequest<{ user: AccountUser }>("/profile", { headers });
  if (profile.user.role !== "customer") {
    return { user: profile.user, bookings: [], payments: [], favorites: [] };
  }
  const [bookings, payments, favorites] = await Promise.all([
    apiRequest<{ items: Booking[] }>("/bookings/mine", { headers }),
    apiRequest<{ items: Payment[] }>("/payments/mine", { headers }),
    apiRequest<{ items: Favorite[] }>("/favorites", { headers }),
  ]);
  return {
    user: profile.user,
    bookings: bookings.items,
    payments: payments.items,
    favorites: favorites.items,
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
  const [view, setView] = useState(initialView);
  const [receiptBooking, setReceiptBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accountDataLoaded, setAccountDataLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          router.replace("/dashboard");
          return;
        }
        setProfile(account.user);
        setName(account.user.name);
        setEmail(account.user.email);
        setPhone(account.user.phone || "");
        setAddress(account.user.address || "");
        setBookings(account.bookings);
        setPayments(account.payments);
      setFavorites(account.favorites);
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
      if (response.user.role !== "customer") {
        router.replace("/dashboard");
        return;
      }
      setToken(response.token);
      setProfile(response.user);
      setName(response.user.name);
      setEmail(response.user.email);
      setIsAuthenticated(true);
      setIsLoading(true);

      const account = await loadAccountData(response.token);
      setProfile(account.user);
      setName(account.user.name);
      setPhone(account.user.phone || "");
      setAddress(account.user.address || "");
      setBookings(account.bookings);
      setPayments(account.payments);
      setFavorites(account.favorites);
      setAccountDataLoaded(true);
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
      if (response.user.role !== "customer") {
        router.replace("/dashboard");
        return;
      }
      setToken(response.token);
      setProfile(response.user);
      setName(response.user.name);
      setEmail(response.user.email);
      setIsAuthenticated(true);
      setIsLoading(true);

      const account = await loadAccountData(response.token);
      setProfile(account.user);
      setName(account.user.name);
      setPhone(account.user.phone || "");
      setAddress(account.user.address || "");
      setBookings(account.bookings);
      setPayments(account.payments);
      setFavorites(account.favorites);
      setAccountDataLoaded(true);
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
        router.replace("/dashboard");
        return;
      }
      setProfile(account.user);
      setName(account.user.name);
      setPhone(account.user.phone || "");
      setAddress(account.user.address || "");
      setBookings(account.bookings);
      setPayments(account.payments);
      setFavorites(account.favorites);
      setAccountDataLoaded(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your account.");
    } finally {
      setIsLoading(false);
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
          phone: phone.trim(),
          address: address.trim(),
        }),
      });
      setProfile(result.user);
      setName(result.user.name);
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

  function signOut() {
    clearAuth();
    setToken("");
    setProfile(null);
    setBookings([]);
    setPayments([]);
    setFavorites([]);
    setReceiptBooking(null);
    setIsAuthenticated(false);
    setAccountDataLoaded(false);
    setPassword("");
    setError("");
    setNotice("");
  }

  return (
    <>
    <main className="account-page">
      <div className="account-shell">
        <div className="account-heading">
          <div>
            <p className="eyebrow"><span className="eyebrow-line" /> YOUR FIELDKIT</p>
            <h1>{isAuthenticated ? "Your account." : "Welcome back."}</h1>
            <p>
              {isAuthenticated
                ? "Keep your details up to date and stay on top of your rentals."
                : "Sign in or create an account to manage your rentals."}
            </p>
          </div>
          {isAuthenticated && (
            <button className="account-signout" type="button" onClick={signOut}>
              Sign out
            </button>
          )}
        </div>

        {isLoading ? (
          <p className="account-message" role="status">Loading your account...</p>
        ) : !isAuthenticated ? (
          <Card className="account-card account-auth-card gap-0">
            <CardHeader className="account-card-heading p-0">
              <span className="eyebrow">CUSTOMER ACCOUNT</span>
              <h2>{authMode === "login" ? "Sign in to Fieldkit" : "Create your account"}</h2>
              <p>
                {authMode === "login"
                  ? "Access your profile and booking history."
                  : "Join Fieldkit to book equipment and track your rentals."}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <form className="account-form" onSubmit={handleAuthentication}>
              {authMode === "register" && (
                <div className="account-form-field">
                  <Label htmlFor="customer-name">Full name</Label>
                  <Input
                    id="customer-name"
                    autoComplete="name"
                    maxLength={100}
                    minLength={2}
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              )}
              <div className="account-form-field">
                <Label htmlFor="customer-email">Email address</Label>
                <Input
                  id="customer-email"
                  autoComplete="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="account-form-field">
                <Label htmlFor="customer-password">Password</Label>
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
                />
              </div>
              {authMode === "register" && (
                <p className="account-form-hint">
                  Use at least 6 characters with uppercase and lowercase letters.
                </p>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button className="button button-dark account-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Please wait..."
                  : authMode === "login"
                    ? "Sign in"
                    : "Create account"}
                {!isSubmitting && <span aria-hidden="true">↗</span>}
              </Button>
              <div className="account-google-signin">
                <span>OR CONTINUE WITH</span>
                <GoogleSignInButton
                  onCredential={handleGoogleCredential}
                  onError={setError}
                />
              </div>
              </form>
              <p className="account-switch">
                {authMode === "login" ? "New to Fieldkit?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === "login" ? "register" : "login");
                    setError("");
                  }}
                >
                  {authMode === "login" ? "Create an account" : "Sign in"}
                </button>
              </p>
            </CardContent>
          </Card>
        ) : !accountDataLoaded ? (
          <section className="account-card account-load-error">
            {error && <p className="account-error" role="alert">{error}</p>}
            <button
              className="button button-dark"
              type="button"
              disabled={isLoading}
              onClick={retryLoadingAccount}
            >
              {isLoading ? "Loading..." : "Retry loading account"}
            </button>
            <button className="account-switch" type="button" onClick={signOut}>
              Sign out and use a different account
            </button>
          </section>
        ) : (
          <div className="account-content">
            {error && <p className="account-error account-feedback" role="alert">{error}</p>}
            {notice && <p className="account-success account-feedback" role="status">{notice}</p>}

            <nav className="dashboard-tabs" aria-label="Account sections">
              {([
                ["overview", "Overview"],
                ["rentals", "My rentals"],
                ["favorites", "Favorites"],
                ["profile", "Profile"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={view === value ? "is-active" : ""}
                  onClick={() => setView(value)}
                  aria-current={view === value ? "page" : undefined}
                >
                  {label}
                </button>
              ))}
            </nav>

            <div className="account-grid">
              {view !== "rentals" && view !== "favorites" && (
              <section className="account-card">
                <div className="account-card-heading">
                  <span className="eyebrow">PERSONAL DETAILS</span>
                  <h2>Your profile</h2>
                  <p>These details help owners coordinate your rental.</p>
                </div>
                <form className="account-form" onSubmit={saveProfile}>
                  <label>
                    Full name
                    <input
                      autoComplete="name"
                      maxLength={100}
                      minLength={2}
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>
                  <label>
                    Email address
                    <input type="email" value={profile?.email || email} readOnly />
                  </label>
                  <label>
                    Phone number
                    <input
                      autoComplete="tel"
                      maxLength={30}
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                    />
                  </label>
                  <label>
                    Address
                    <textarea
                      autoComplete="street-address"
                      maxLength={300}
                      rows={3}
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                    />
                  </label>
                  <button className="button button-dark account-submit" type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </form>
              </section>
              )}

              {view !== "favorites" && view !== "profile" && (
              <section className="account-card account-bookings">
                <div className="account-card-heading account-bookings-heading">
                  <div>
                    <span className="eyebrow">YOUR RENTALS</span>
                    <h2>Booking history</h2>
                  </div>
                  <span className="account-booking-count">{bookings.length}</span>
                </div>
                {bookings.length ? (
                  <div className="account-booking-list">
                    {bookings.map((booking) => {
                      const payment = payments.find((item) => String(item.bookingId) === booking.id);
                      return (
                      <article className="account-booking" key={booking.id}>
                        <div className="account-booking-top">
                          <div>
                            <h3>{booking.equipmentName}</h3>
                            <p>
                              {formatRentalDate(booking.rentalStartDate)} –{" "}
                              {formatRentalDate(booking.rentalEndDate)}
                              {" · "}{booking.quantity} {booking.quantity === 1 ? "item" : "items"}
                            </p>
                          </div>
                          <strong>{formatCurrency(booking.totalAmount)}</strong>
                        </div>
                        <div className="account-booking-bottom">
                          <span className={`account-status account-status-${booking.paymentStatus}`}>
                            Payment: {booking.paymentStatus}
                          </span>
                          <span className="account-status">
                            Booking: {booking.bookingStatus}
                          </span>
                          {booking.equipment?.id && (
                            <Link href={`/equipment/${booking.equipment.id}`}>
                              View equipment <span aria-hidden="true">↗</span>
                            </Link>
                          )}
                        </div>
                        {payment?.status === "paid" && (
                          <button
                            className="account-receipt-button"
                            type="button"
                            onClick={() => setReceiptBooking(booking)}
                          >
                            View / print payment receipt
                          </button>
                        )}
                      </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="account-empty-bookings">
                    <span aria-hidden="true">↗</span>
                    <h3>{profile?.role === "customer" ? "No bookings yet" : "Your rentals are managed separately"}</h3>
                    <p>
                      {profile?.role === "customer"
                        ? "Your paid and pending rentals will appear here."
                        : "Open the management dashboard to manage your listings and rentals."}
                    </p>
                    <Link className="button button-dark" href={profile?.role === "customer" ? "/equipment" : "/dashboard"}>
                      {profile?.role === "customer" ? "Find equipment" : "Open dashboard"}
                      <span aria-hidden="true">↗</span>
                    </Link>
                  </div>
                )}
              </section>
              )}

              {view !== "rentals" && view !== "profile" && (
              <section className="account-card account-favorites">
                <div className="account-card-heading account-bookings-heading">
                  <div>
                    <span className="eyebrow">SAVED FOR LATER</span>
                    <h2>Favorite equipment</h2>
                  </div>
                  <span className="account-booking-count">{favorites.length}</span>
                </div>
                {favorites.length ? (
                  <div className="account-booking-list">
                    {favorites.map((favorite) => {
                      const item = favorite.equipment;
                      if (!item) return null;
                      return (
                        <article className="account-booking" key={favorite.favoriteId}>
                          <div className="account-booking-top">
                            <div>
                              <h3>{item.name}</h3>
                              <p>{item.category} · {item.location}</p>
                            </div>
                            <strong>{formatCurrency(item.price)}</strong>
                          </div>
                          <div className="account-booking-bottom">
                            <Link href={`/equipment/${item.id}`}>View details <span aria-hidden="true">↗</span></Link>
                            <button type="button" onClick={() => removeFavorite(item.id)}>
                              Remove favorite
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="account-empty-bookings">
                    <span aria-hidden="true">♡</span>
                    <h3>No favorites yet</h3>
                    <p>Save equipment from its details page to find it here later.</p>
                    <Link className="button button-dark" href="/equipment">Browse equipment <span aria-hidden="true">↗</span></Link>
                  </div>
                )}
              </section>
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
    <div className="receipt-overlay">
      <button className="booking-backdrop" type="button" aria-label="Close receipt" onClick={onClose} />
      <section className="receipt-card" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
        <p className="eyebrow">FIELDKIT / PAYMENT RECEIPT</p>
        <h2 id="receipt-title">Payment receipt</h2>
        <dl>
          <div><dt>Receipt</dt><dd>{payment?.id || booking.id}</dd></div>
          <div><dt>Equipment</dt><dd>{booking.equipmentName}</dd></div>
          <div><dt>Rental dates</dt><dd>{formatRentalDate(booking.rentalStartDate)} – {formatRentalDate(booking.rentalEndDate)}</dd></div>
          <div><dt>Quantity</dt><dd>{booking.quantity}</dd></div>
          <div><dt>Amount paid</dt><dd>{formatCurrency(booking.totalAmount)}</dd></div>
          <div><dt>Payment status</dt><dd>{payment?.status || booking.paymentStatus}</dd></div>
          <div><dt>Paid at</dt><dd>{payment ? new Date(payment.createdAt).toLocaleString() : "Confirmed by Stripe"}</dd></div>
          {payment?.paymentIntentId && typeof payment.paymentIntentId === "string" && (
            <div><dt>Stripe reference</dt><dd>{payment.paymentIntentId}</dd></div>
          )}
        </dl>
        <div className="receipt-actions">
          <button className="account-signout" type="button" onClick={onClose}>Close</button>
          <button className="button button-dark" type="button" onClick={() => window.print()}>Print receipt</button>
        </div>
      </section>
    </div>
  );
}
