"use client";

import { useEffect, useMemo, useState } from "react";
import type { EquipmentListing } from "../data/equipment";

type BookingEquipment = Pick<
  EquipmentListing,
  | "id"
  | "name"
  | "price"
  | "rate"
  | "period"
  | "rentalType"
  | "available"
  | "availableQuantity"
>;

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

function formatCurrency(amount: number) {
  return `৳ ${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

export function EquipmentBooking({ item }: { item: BookingEquipment }) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [previewReady, setPreviewReady] = useState(false);
  const [today, setToday] = useState("");
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
  const canPreview =
    item.available &&
    Boolean(startDate && endDate && units) &&
    !quantityInvalid &&
    phone.trim().length >= 7 &&
    address.trim().length >= 5;

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function closeModal() {
    setIsOpen(false);
    setPreviewReady(false);
  }

  function openModal() {
    setToday(localDateValue(new Date()));
    setPreviewReady(false);
    setIsOpen(true);
  }

  function updateField(update: () => void) {
    update();
    setPreviewReady(false);
  }

  function previewBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canPreview) setPreviewReady(true);
  }

  return (
    <>
      <button
        className="button button-dark booking-open-button"
        type="button"
        disabled={!item.available}
        onClick={openModal}
      >
        {item.available ? "Check booking estimate" : "Currently unavailable"}
        {item.available && <span aria-hidden="true">↗</span>}
      </button>
      <p className="booking-card-note">
        Preview dates and an estimated rental total. No booking or payment is
        submitted yet.
      </p>

      {isOpen && (
        <div className="booking-overlay">
          <button
            className="booking-backdrop"
            type="button"
            aria-label="Close booking preview"
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
                <p className="eyebrow">BOOKING PREVIEW</p>
                <h2 id="booking-title">Plan your rental.</h2>
                <p>{item.name} · {item.rate} / {item.period}</p>
              </div>
              <button
                className="booking-close"
                type="button"
                aria-label="Close booking preview"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form className="booking-form" onSubmit={previewBooking}>
              <div className="booking-date-fields">
                <label>
                  Rental start date
                  <input
                    type="date"
                    min={today}
                    required
                    value={startDate}
                    onChange={(event) =>
                      updateField(() => setStartDate(event.target.value))
                    }
                  />
                </label>
                <label>
                  Rental end date
                  <input
                    type="date"
                    min={startDate || today}
                    required
                    value={endDate}
                    onChange={(event) =>
                      updateField(() => setEndDate(event.target.value))
                    }
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
                  onChange={(event) =>
                    updateField(() => setQuantity(event.target.value))
                  }
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
                  maxLength={20}
                  placeholder="Your phone number"
                  required
                  value={phone}
                  onChange={(event) =>
                    updateField(() => setPhone(event.target.value))
                  }
                />
              </label>

              <label>
                Delivery or pickup address
                <input
                  type="text"
                  autoComplete="street-address"
                  minLength={5}
                  maxLength={160}
                  placeholder="Where do you need the equipment?"
                  required
                  value={address}
                  onChange={(event) =>
                    updateField(() => setAddress(event.target.value))
                  }
                />
              </label>

              <label>
                Additional notes <span className="optional-label">Optional</span>
                <textarea
                  rows={3}
                  maxLength={500}
                  placeholder="Anything the owner should know?"
                  value={notes}
                  onChange={(event) =>
                    updateField(() => setNotes(event.target.value))
                  }
                />
              </label>

              <div className="booking-estimate">
                <div>
                  <span>Estimated total</span>
                  <small>
                    {units
                      ? `${units} ${item.rentalType.toLowerCase()} ${units === 1 ? "period" : "periods"} × ${quantityValue || 0}`
                      : `Rate: ${item.rate} per ${item.period}`}
                  </small>
                </div>
                <strong>{formatCurrency(total)}</strong>
              </div>

              {previewReady && (
                <p className="booking-demo-notice" role="status">
                  Estimate ready. This is a preview only—no booking or payment
                  was submitted.
                </p>
              )}

              <div className="booking-form-actions">
                <button className="booking-cancel" type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  className="button button-dark"
                  type="submit"
                  disabled={!canPreview}
                >
                  Preview booking <span aria-hidden="true">↗</span>
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
