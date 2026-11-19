"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { AccountAccess } from "./account-access";
import { SiteFooter, SiteHeader } from "./site-shell";
import { apiRequest, formatCurrency, rentalPeriod, type EquipmentListing } from "../lib/api";
import { clearAuth, type AuthUser } from "../lib/auth";

type ManagedEquipment = EquipmentListing & { status: "pending" | "approved" | "rejected" };
type ManagedUser = AuthUser & { disabled?: boolean };
type OwnerBooking = {
  id: string;
  equipmentName: string;
  bookingStatus: string;
  paymentStatus: string;
  rentalStartDate: string;
  rentalEndDate: string;
  totalAmount: number;
  customer?: { name?: string; email?: string } | null;
};

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function ManagementDashboard() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        const storedToken = window.localStorage.getItem("fieldkit_token");
        if (!storedToken) return;
        const { user: currentUser } = await apiRequest<{ user: AuthUser }>("/auth/me", {
          headers: authHeaders(storedToken),
        });
        if (cancelled) return;
        setToken(storedToken);
        setUser(currentUser);
      } catch (sessionError) {
        if (!cancelled) {
          setError(sessionError instanceof Error ? sessionError.message : "Could not verify your account");
        }
      } finally {
        if (!cancelled) setIsChecking(false);
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleAuthenticated(accessToken: string, currentUser: AuthUser) {
    setError("");
    setToken(accessToken);
    setUser(currentUser);
  }

  function signOut() {
    clearAuth();
    setToken("");
    setUser(null);
  }

  return (
    <>
      <SiteHeader />
      <main className="account-page">
        <div className="account-page-heading">
          <div>
            <p className="eyebrow">FIELKIT MANAGEMENT</p>
            <h1>Owner / admin dashboard</h1>
            <p>Create and manage listings, or review marketplace submissions.</p>
          </div>
          {user && <button className="booking-cancel" type="button" onClick={signOut}>Sign out</button>}
        </div>

        {isChecking ? (
          <p role="status">Checking your account...</p>
        ) : !user ? (
          <>
            {error && <p className="booking-field-error" role="alert">{error}</p>}
            <AccountAccess onAuthenticated={handleAuthenticated} />
          </>
        ) : user.role === "owner" ? (
          <OwnerManagement token={token} />
        ) : user.role === "admin" ? (
          <AdminManagement token={token} currentUser={user} />
        ) : (
          <section className="account-empty">
            <h2>Owner access required</h2>
            <p>
              Signed in as {user.email}. An administrator must change this account
              to the owner role before you can publish equipment.
            </p>
            <Link className="button button-dark" href="/account">View renter bookings</Link>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function OwnerManagement({ token }: { token: string }) {
  const [items, setItems] = useState<ManagedEquipment[]>([]);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [editValues, setEditValues] = useState<Record<string, { price: string; quantity: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadOwnerData() {
      setIsLoading(true);
      setError("");
      try {
        const [equipmentResponse, bookingResponse] = await Promise.all([
          apiRequest<{ items: ManagedEquipment[] }>("/equipment/owner/mine", {
            headers: authHeaders(token),
          }),
          apiRequest<{ items: OwnerBooking[] }>("/bookings/owner", {
            headers: authHeaders(token),
          }),
        ]);
        if (!cancelled) {
          setItems(equipmentResponse.items);
          setBookings(bookingResponse.items);
          setEditValues(Object.fromEntries(equipmentResponse.items.map((item) => [
            item.id,
            { price: String(item.price), quantity: String(item.availableQuantity) },
          ])));
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load owner dashboard");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadOwnerData();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, token]);

  async function createListing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      description: String(formData.get("description") || "").trim(),
      category: String(formData.get("category") || "").trim(),
      location: String(formData.get("location") || "").trim(),
      image: String(formData.get("image") || "").trim(),
      price: Number(formData.get("price")),
      rentalType: String(formData.get("rentalType")),
      availableQuantity: Number(formData.get("availableQuantity")),
      condition: String(formData.get("condition") || "").trim(),
      brand: String(formData.get("brand") || "").trim(),
      model: String(formData.get("model") || "").trim(),
    };

    setIsSaving(true);
    setError("");
    try {
      await apiRequest("/equipment", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
      form.reset();
      setRefreshKey((key) => key + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not create listing");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateListing(event: FormEvent<HTMLFormElement>, item: ManagedEquipment) {
    event.preventDefault();
    const values = editValues[item.id];
    setIsSaving(true);
    setError("");
    try {
      await apiRequest(`/equipment/${item.id}`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({
          price: Number(values.price),
          availableQuantity: Number(values.quantity),
        }),
      });
      setRefreshKey((key) => key + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update listing");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteListing(item: ManagedEquipment) {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setIsSaving(true);
    setError("");
    try {
      await apiRequest(`/equipment/${item.id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      setRefreshKey((key) => key + 1);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete listing");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateBookingStatus(bookingId: string, bookingStatus: "confirmed" | "rejected") {
    setError("");
    try {
      await apiRequest(`/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ bookingStatus }),
      });
      setRefreshKey((key) => key + 1);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update booking");
    }
  }

  return (
    <div className="management-content">
      {error && <p className="booking-field-error" role="alert">{error}</p>}
      <section className="management-section">
        <div className="management-section-heading">
          <div><p className="eyebrow">OWNER INVENTORY</p><h2>Your listings</h2></div>
        </div>
        <form className="management-form" onSubmit={createListing}>
          <h3>Create a listing</h3>
          <label>Name<input name="name" required maxLength={200} /></label>
          <label>Description<textarea name="description" rows={3} maxLength={5000} /></label>
          <div className="management-form-grid">
            <label>Category<input name="category" required maxLength={100} /></label>
            <label>Location<input name="location" required maxLength={200} /></label>
            <label>Price per period (৳)<input name="price" type="number" min="1" step="1" required /></label>
            <label>Rental type
              <select name="rentalType" required defaultValue="Daily">
                <option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option>
              </select>
            </label>
            <label>Available quantity<input name="availableQuantity" type="number" min="0" step="1" defaultValue="1" required /></label>
            <label>Condition<input name="condition" maxLength={200} /></label>
            <label>Brand<input name="brand" maxLength={200} /></label>
            <label>Model<input name="model" maxLength={200} /></label>
          </div>
          <label>Image URL<input name="image" type="url" required maxLength={2048} /></label>
          <button className="button button-dark" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Submit for approval"}
          </button>
          <p className="management-help">New listings stay hidden from renters until an administrator approves them.</p>
        </form>

        {isLoading ? <p role="status">Loading your listings...</p> : items.length === 0 ? (
          <p className="management-help">You have not submitted any equipment yet.</p>
        ) : (
          <div className="management-list">
            {items.map((item) => {
              const values = editValues[item.id] || { price: String(item.price), quantity: String(item.availableQuantity) };
              return (
                <article className="management-card" key={item.id}>
                  <div className="management-card-heading">
                    <div><h3>{item.name}</h3><span className={`status-pill status-${item.status}`}>{item.status}</span></div>
                    <span>{item.category} · {item.location}</span>
                  </div>
                  <form className="management-inline-form" onSubmit={(event) => updateListing(event, item)}>
                    <label>Price<input type="number" min="1" step="1" required value={values.price} onChange={(event) => setEditValues((current) => ({ ...current, [item.id]: { ...values, price: event.target.value } }))} /></label>
                    <label>Quantity<input type="number" min="0" step="1" required value={values.quantity} onChange={(event) => setEditValues((current) => ({ ...current, [item.id]: { ...values, quantity: event.target.value } }))} /></label>
                    <button className="button button-light" type="submit" disabled={isSaving}>Save changes</button>
                    <button className="booking-cancel" type="button" disabled={isSaving} onClick={() => deleteListing(item)}>Delete</button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="management-section">
        <div className="management-section-heading">
          <div><p className="eyebrow">RENTAL REQUESTS</p><h2>Paid bookings</h2></div>
        </div>
        {bookings.filter((booking) => booking.paymentStatus === "paid").length === 0 ? (
          <p className="management-help">Paid bookings for your listings will appear here.</p>
        ) : (
          <div className="management-list">
            {bookings.filter((booking) => booking.paymentStatus === "paid").map((booking) => (
              <article className="management-card" key={booking.id}>
                <div className="management-card-heading">
                  <div><h3>{booking.equipmentName}</h3><span className={`status-pill status-${booking.bookingStatus}`}>{booking.bookingStatus}</span></div>
                  <span>{formatCurrency(booking.totalAmount)} · {booking.rentalStartDate} to {booking.rentalEndDate}</span>
                </div>
                <p className="management-help">Renter: {booking.customer?.name || booking.customer?.email || "Customer"}</p>
                {booking.bookingStatus === "pending" && (
                  <div className="management-actions">
                    <button className="button button-dark" type="button" onClick={() => updateBookingStatus(booking.id, "confirmed")}>Confirm</button>
                    <button className="booking-cancel" type="button" onClick={() => updateBookingStatus(booking.id, "rejected")}>Reject</button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminManagement({
  token,
  currentUser,
}: {
  token: string;
  currentUser: AuthUser;
}) {
  const [equipment, setEquipment] = useState<ManagedEquipment[]>([]);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadAdminData() {
      setIsLoading(true);
      setError("");
      try {
        const [equipmentResponse, usersResponse] = await Promise.all([
          apiRequest<{ items: ManagedEquipment[] }>("/admin/equipment?status=pending&limit=100", {
            headers: authHeaders(token),
          }),
          apiRequest<{ items: ManagedUser[] }>("/admin/users?limit=100", {
            headers: authHeaders(token),
          }),
        ]);
        if (!cancelled) {
          setEquipment(equipmentResponse.items);
          setUsers(usersResponse.items);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load admin dashboard");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadAdminData();
    return () => {
      cancelled = true;
    };
  }, [refreshKey, token]);

  async function reviewListing(id: string, status: "approved" | "rejected") {
    setError("");
    try {
      await apiRequest(`/admin/equipment/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ status }),
      });
      setRefreshKey((key) => key + 1);
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Could not review listing");
    }
  }

  async function changeRole(userId: string, role: AuthUser["role"]) {
    setError("");
    try {
      await apiRequest(`/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ role }),
      });
      setRefreshKey((key) => key + 1);
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : "Could not change user role");
    }
  }

  async function changeUserStatus(user: ManagedUser) {
    setError("");
    try {
      await apiRequest(`/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify({ disabled: !user.disabled }),
      });
      setRefreshKey((key) => key + 1);
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Could not update user status");
    }
  }

  return (
    <div className="management-content">
      {error && <p className="booking-field-error" role="alert">{error}</p>}
      {isLoading ? <p role="status">Loading admin data...</p> : (
        <>
          <section className="management-section">
            <div className="management-section-heading">
              <div><p className="eyebrow">LISTING REVIEW</p><h2>Pending equipment ({equipment.length})</h2></div>
            </div>
            {equipment.length === 0 ? <p className="management-help">No listings are waiting for approval.</p> : (
              <div className="management-list">
                {equipment.map((item) => (
                  <article className="management-card" key={item.id}>
                    <div className="management-card-heading">
                      <div><h3>{item.name}</h3><span>{item.category} · {item.location}</span></div>
                      <span>{formatCurrency(item.price)} / {rentalPeriod(item.rentalType)}</span>
                    </div>
                    <p className="management-help">{item.description}</p>
                    <div className="management-actions">
                      <button className="button button-dark" type="button" onClick={() => reviewListing(item.id, "approved")}>Approve</button>
                      <button className="booking-cancel" type="button" onClick={() => reviewListing(item.id, "rejected")}>Reject</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="management-section">
            <div className="management-section-heading">
              <div><p className="eyebrow">ACCOUNT ACCESS</p><h2>Users ({users.length})</h2></div>
            </div>
            <div className="management-list">
              {users.map((user) => (
                <article className="management-card management-user-row" key={user.id}>
                  <div className="management-card-heading">
                    <div><h3>{user.name}</h3><span>{user.email}</span></div>
                    <span className={`status-pill status-${user.disabled ? "disabled" : user.role}`}>{user.disabled ? "disabled" : user.role}</span>
                  </div>
                  <div className="management-actions">
                    <label className="management-role-select">Role
                      <select
                        value={user.role}
                        disabled={user.id === currentUser.id}
                        onChange={(event) => changeRole(user.id, event.target.value as AuthUser["role"])}
                      >
                        <option value="customer">Customer</option><option value="owner">Owner</option><option value="admin">Admin</option>
                      </select>
                    </label>
                    <button
                      className="booking-cancel"
                      type="button"
                      disabled={user.id === currentUser.id}
                      onClick={() => changeUserStatus(user)}
                    >
                      {user.disabled ? "Enable account" : "Disable account"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
