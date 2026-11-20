"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiRequest, formatCurrency, rentalPeriod, type EquipmentListing } from "../lib/api";
import { GoogleSignInButton } from "./google-sign-in";
import { clearAuth, saveAuth, type AuthUser } from "../lib/auth";
import { useToast } from "./toast-provider";

type AuthResponse = {
  token: string;
  user: AuthUser;
};

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function rentalUnits(start: string, end: string, rentalType: string) {
  if (!start || !end) return 0;

  const startTime = Date.parse(`${start}T00:00:00Z`);
  const endTime = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
    return 0;
  }

  const days = Math.max(1, Math.ceil((endTime - startTime) / 86_400_000));
  if (rentalType === "Weekly") return Math.ceil(days / 7);
  if (rentalType === "Monthly") return Math.ceil(days / 30);
  return days;
}

export function EquipmentBooking({ item }: { item: EquipmentListing }) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [today, setToday] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [signedInEmail, setSignedInEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { notify } = useToast();
  const quantityValue = Number(quantity);

  const units = useMemo(
    () => rentalUnits(startDate, endDate, item.rentalType),
    [endDate, item.rentalType, startDate],
  );
  const total = units * quantityValue * item.price;
  const dateRangeInvalid = Boolean(startDate && endDate && !units);
  const quantityInvalid =
    !Number.isInteger(quantityValue) ||
    quantityValue < 1 ||
    quantityValue > item.availableQuantity;
  const canBook =
    item.availableQuantity > 0 &&
    Boolean(startDate && endDate && units) &&
    !quantityInvalid &&
    phone.trim().length >= 7 &&
    address.trim().length >= 5;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting]);

  function closeModal() {
    if (isSubmitting) return;
    setIsOpen(false);
    setError("");
  }

  function openModal() {
    setToday(localDateValue(new Date()));
    setError("");
    setToken(window.localStorage.getItem("fieldkit_token") || "");
    setSignedInEmail(window.localStorage.getItem("fieldkit_user_email") || "");
    setIsOpen(true);
  }

  function updateField(update: () => void) {
    update();
    setError("");
  }

  function signOut() {
    clearAuth();
    setToken("");
    setSignedInEmail("");
    notify("You have been signed out.", "info");
  }

  async function startCheckout(accessToken: string) {
    const result = await apiRequest<{ checkoutUrl: string }>("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        equipmentId: item.id,
        rentalStartDate: startDate,
        rentalEndDate: endDate,
        quantity: quantityValue,
        contactNumber: phone.trim(),
        deliveryAddress: address.trim(),
        notes: notes.trim(),
      }),
    });
    const checkoutUrl = new URL(result.checkoutUrl);
    if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com") {
      throw new Error("The server returned an invalid Stripe Checkout URL");
    }
    window.location.assign(checkoutUrl.toString());
  }

  async function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canBook || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      let accessToken = token;
      if (!accessToken) {
        const authResponse = await apiRequest<AuthResponse>(
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
        accessToken = authResponse.token;
        saveAuth(accessToken, authResponse.user);
        setToken(accessToken);
        setSignedInEmail(authResponse.user.email);
        notify(
          authMode === "register"
            ? "Account created. Redirecting to Stripe..."
            : "Signed in. Redirecting to Stripe...",
        );
      }
      await startCheckout(accessToken);
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Could not start checkout. Please try again.";
      notify(message, "error");
      setError(message);
      setIsSubmitting(false);
    }
  }

  async function handleGoogleCredential(credential: string) {
    setIsSubmitting(true);
    setError("");
    try {
      const authResponse = await apiRequest<AuthResponse>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential }),
      });
      saveAuth(authResponse.token, authResponse.user);
      setToken(authResponse.token);
      setSignedInEmail(authResponse.user.email);
      notify("Google account connected. Redirecting to Stripe...");
      await startCheckout(authResponse.token);
    } catch (checkoutError) {
      const message =
        checkoutError instanceof Error
          ? checkoutError.message
          : "Google sign-in or checkout failed";
      notify(message, "error");
      setError(message);
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        className="button button-dark booking-open-button"
        type="button"
        disabled={!item.availableQuantity}
        onClick={openModal}
      >
        {item.availableQuantity ? "Book and pay securely" : "Currently unavailable"}
        {item.availableQuantity > 0 && <span aria-hidden="true">↗</span>}
      </button>
      <p className="booking-card-note">
        Sign in or create an account to reserve this equipment and continue to
        Stripe Checkout.
      </p>

      {isOpen && (
        <div className="booking-overlay">
          <button
            className="booking-backdrop"
            type="button"
            aria-label="Close booking form"
            disabled={isSubmitting}
            onClick={closeModal}
          />
          <section
            className="booking-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
          >
            <div className="booking-dialog-heading">
              <div>
                <p className="eyebrow">SECURE RENTAL CHECKOUT</p>
                <h2 id="booking-title">Plan your rental.</h2>
                <p>{item.name} · {formatCurrency(item.price)} / {rentalPeriod(item.rentalType)}</p>
              </div>
              <button
                className="booking-close"
                type="button"
                aria-label="Close booking form"
                disabled={isSubmitting}
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form className="booking-form" onSubmit={handleCheckout}>
              <div className="booking-date-fields">
                <label>
                  Rental start date
                  <input
                    type="date"
                    min={today}
                    required
                    value={startDate}
                    onChange={(event) => updateField(() => setStartDate(event.target.value))}
                  />
                </label>
                <label>
                  Rental end date
                  <input
                    type="date"
                    min={startDate || today}
                    required
                    value={endDate}
                    onChange={(event) => updateField(() => setEndDate(event.target.value))}
                  />
                </label>
              </div>
              {dateRangeInvalid && (
                <p className="booking-field-error" role="alert">
                  End date must be the same as or later than the start date.
                </p>
              )}

              <label>
                Required quantity
                <input
                  type="number"
                  min="1"
                  max={item.availableQuantity}
                  step="1"
                  required
                  value={quantity}
                  onChange={(event) => updateField(() => setQuantity(event.target.value))}
                />
              </label>
              {quantityInvalid && (
                <p className="booking-field-error" role="alert">
                  Enter a whole number from 1 to {item.availableQuantity}.
                </p>
              )}

              <label>
                Contact number
                <input
                  type="tel"
                  autoComplete="tel"
                  minLength={7}
                  maxLength={30}
                  placeholder="Your phone number"
                  required
                  value={phone}
                  onChange={(event) => updateField(() => setPhone(event.target.value))}
                />
              </label>

              <label>
                Delivery or pickup address
                <input
                  type="text"
                  autoComplete="street-address"
                  minLength={5}
                  maxLength={300}
                  placeholder="Where do you need the equipment?"
                  required
                  value={address}
                  onChange={(event) => updateField(() => setAddress(event.target.value))}
                />
              </label>

              <label>
                Additional notes <span className="optional-label">Optional</span>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Anything the owner should know?"
                  value={notes}
                  onChange={(event) => updateField(() => setNotes(event.target.value))}
                />
              </label>

              <div className="booking-estimate">
                <div>
                  <span>Estimated total</span>
                  <small>
                    {units
                      ? `${units} ${item.rentalType.toLowerCase()} ${units === 1 ? "period" : "periods"} × ${quantityValue || 0}`
                      : `Rate: ${formatCurrency(item.price)} per ${rentalPeriod(item.rentalType)}`}
                  </small>
                </div>
                <strong>{formatCurrency(total)}</strong>
              </div>

              <div className="booking-account-box">
                {token ? (
                  <div className="booking-account-status">
                    <span>Signed in as <strong>{signedInEmail || "your account"}</strong></span>
                    <button className="booking-account-switch" type="button" onClick={signOut}>
                      Sign out
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="booking-account-heading">
                      <strong>{authMode === "login" ? "Sign in to book" : "Create a renter account"}</strong>
                      <button
                        className="booking-account-switch"
                        type="button"
                        onClick={() => {
                          setAuthMode(authMode === "login" ? "register" : "login");
                          setError("");
                        }}
                      >
                        {authMode === "login" ? "Create account" : "I already have an account"}
                      </button>
                    </div>
                    {authMode === "register" && (
                      <label>
                        Name
                        <input
                          type="text"
                          autoComplete="name"
                          minLength={2}
                          maxLength={100}
                          required
                          value={name}
                          onChange={(event) => updateField(() => setName(event.target.value))}
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
                        onChange={(event) => updateField(() => setEmail(event.target.value))}
                      />
                    </label>
                    <label>
                      Password
                      <input
                        type="password"
                        autoComplete={authMode === "login" ? "current-password" : "new-password"}
                        minLength={6}
                        required
                        value={password}
                        onChange={(event) => updateField(() => setPassword(event.target.value))}
                      />
                    </label>
                    <GoogleSignInButton
                      onCredential={handleGoogleCredential}
                      onError={(message) => {
                        notify(message, "error");
                        setError(message);
                      }}
                    />
                  </>
                )}
              </div>

              {error && <p className="booking-field-error" role="alert">{error}</p>}

              <div className="booking-form-actions">
                <button className="booking-cancel" type="button" disabled={isSubmitting} onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="button button-dark"
                  type="submit"
                  disabled={!canBook || isSubmitting}
                >
                  {isSubmitting ? "Preparing checkout..." : "Continue to Stripe"}
                  {!isSubmitting && <span aria-hidden="true">↗</span>}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
