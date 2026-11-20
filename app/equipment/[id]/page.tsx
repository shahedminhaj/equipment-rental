import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { EquipmentBooking } from "../../components/equipment-booking";
import { FavoriteButton } from "../../components/favorite-button";
import { SiteFooter, SiteHeader } from "../../components/site-shell";
import { formatCurrency, rentalPeriod, type EquipmentListing } from "../../lib/api";

export const metadata: Metadata = {
  title: "Equipment Details | Fieldkit",
  description: "Review a live equipment listing and book securely with Stripe Checkout.",
};

export default function EquipmentDetailsPage({
  params,
}: PageProps<"/equipment/[id]">) {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<div className="detail-loading" role="status">Loading equipment details...</div>}>
        <EquipmentDetailsContent params={params} />
      </Suspense>
      <SiteFooter />
    </>
  );
}

async function EquipmentDetailsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
  ).replace(/\/+$/, "");
  const response = await fetch(
    `${apiBaseUrl}/equipment/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  if (response.status === 400 || response.status === 404) notFound();
  if (!response.ok) {
    throw new Error(`Could not load equipment (${response.status})`);
  }
  const { item } = (await response.json()) as { item: EquipmentListing };
  const ownerName = item.owner?.name || "Equipment owner";

  return (
    <main className="detail-page">
        <div className="detail-breadcrumb">
          <Link href="/equipment">All equipment</Link>
          <span aria-hidden="true">/</span>
          <span>{item.category}</span>
          <span aria-hidden="true">/</span>
          <span>{item.name}</span>
        </div>

        <section className="detail-layout">
          <div className="detail-main">
            <div className="detail-image">
              <Image
                src={item.image}
                alt={item.name}
                fill
                priority
                unoptimized
                sizes="(max-width: 760px) 100vw, 65vw"
              />
              <span className="detail-image-tag"><span />{item.rentalType} rental</span>
              <span className={`detail-availability${item.availableQuantity ? "" : " is-unavailable"}`}>
                <span />
                {item.availableQuantity
                  ? `${item.availableQuantity} available`
                  : "Currently rented"}
              </span>
            </div>

            <div className="detail-title-row">
              <div>
                <p className="eyebrow">{item.category.toUpperCase()} / APPROVED LISTING</p>
                <h1>{item.name}</h1>
              </div>
            </div>

            <p className="detail-location"><span aria-hidden="true">⌖</span> {item.location}</p>
            <p className="detail-description">{item.description || "Contact the owner for more details about this equipment."}</p>

            <section className="detail-info-section">
              <div className="detail-section-heading">
                <span className="eyebrow">AT A GLANCE</span>
                <h2>Equipment details</h2>
              </div>
              <dl className="detail-spec-grid">
                <div><dt>Category</dt><dd>{item.category}</dd></div>
                <div><dt>Rental rate</dt><dd>{formatCurrency(item.price)} / {rentalPeriod(item.rentalType)}</dd></div>
                <div><dt>Rental type</dt><dd>{item.rentalType}</dd></div>
                <div><dt>Availability</dt><dd>{item.availableQuantity} available</dd></div>
                {item.condition && <div><dt>Condition</dt><dd>{item.condition}</dd></div>}
                {item.brand && <div><dt>Brand &amp; model</dt><dd>{item.brand} {item.model || ""}</dd></div>}
              </dl>
            </section>

            {item.rentalTerms && item.rentalTerms.length > 0 && (
              <section className="detail-info-section">
                <div className="detail-section-heading">
                  <span className="eyebrow">BEFORE YOU BOOK</span>
                  <h2>Rental terms</h2>
                </div>
                <ul className="detail-terms-list">
                  {item.rentalTerms.map((term) => <li key={term}>{term}</li>)}
                </ul>
              </section>
            )}

            <section className="detail-owner-card">
              <div className="owner-avatar">{ownerName.slice(0, 2).toUpperCase()}</div>
              <div className="owner-info">
                <span className="eyebrow">LOCAL EQUIPMENT OWNER</span>
                <h2>{ownerName}</h2>
                <p><span aria-hidden="true">⌖</span> {item.location}</p>
              </div>
            </section>
          </div>

          <aside className="booking-card">
            <span className="eyebrow">RENT THIS EQUIPMENT</span>
            <div className="booking-rate">
              <strong>{formatCurrency(item.price)}</strong>
              <span> / {rentalPeriod(item.rentalType)}</span>
            </div>
            <p className="booking-rate-type">{item.rentalType} rental rate</p>
            <div className="booking-divider" />
            <div className="booking-owner-summary">
              <span className="owner-avatar owner-avatar-small">{ownerName.slice(0, 2).toUpperCase()}</span>
              <span><strong>{ownerName}</strong><br />Local equipment owner</span>
            </div>
            <div className="booking-availability-row">
              <span className={`availability-indicator${item.availableQuantity ? "" : " is-unavailable"}`} />
              <span>{item.availableQuantity ? "Available to book" : "Currently rented"}</span>
              {item.availableQuantity > 0 && <strong>{item.availableQuantity} left</strong>}
            </div>
            <FavoriteButton equipmentId={item.id} />
            <EquipmentBooking item={item} />
            <p className="booking-secure-note">Secure payment is processed by Stripe Checkout.</p>
          </aside>
        </section>

        <div className="detail-back-link">
          <Link className="text-link" href="/equipment">← Back to all equipment</Link>
        </div>
    </main>
  );
}
