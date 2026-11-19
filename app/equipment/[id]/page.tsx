import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { EquipmentBooking } from "../../components/equipment-booking";
import { SiteFooter, SiteHeader } from "../../components/site-shell";
import { equipmentDetails } from "../../data/equipment-details";
import { equipment } from "../../data/equipment";

export const metadata: Metadata = {
  title: "Equipment Details | Fieldkit",
  description:
    "Explore equipment information, owner details, rental terms, and a sample booking estimate.",
};

export function generateStaticParams() {
  return equipment.map((item) => ({ id: item.id }));
}

export default function EquipmentDetailsPage({
  params,
}: PageProps<"/equipment/[id]">) {
  return (
    <>
      <SiteHeader />
      <Suspense
        fallback={
          <div className="detail-loading" role="status">
            Loading equipment details...
          </div>
        }
      >
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
  const item = equipment.find((listing) => listing.id === id);
  const details = equipmentDetails[id];

  if (!item || !details) notFound();

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
              <span className="detail-image-tag"><span />{item.tag}</span>
              <span className={`detail-availability${item.available ? "" : " is-unavailable"}`}>
                <span />
                {item.available
                  ? `${item.availableQuantity} available`
                  : "Currently rented"}
              </span>
            </div>

            <div className="detail-title-row">
              <div>
                <p className="eyebrow">{item.category.toUpperCase()} / FIELDKIT PREVIEW</p>
                <h1>{item.name}</h1>
              </div>
              <div className="detail-rating"><span>★</span> {item.rating} <small>sample rating</small></div>
            </div>

            <p className="detail-location"><span aria-hidden="true">⌖</span> {item.location}</p>
            <p className="detail-description">{details.description}</p>

            <section className="detail-info-section">
              <div className="detail-section-heading">
                <span className="eyebrow">AT A GLANCE</span>
                <h2>Equipment details</h2>
              </div>
              <dl className="detail-spec-grid">
                <div><dt>Category</dt><dd>{item.category}</dd></div>
                <div><dt>Rental rate</dt><dd>{item.rate} / {item.period}</dd></div>
                <div><dt>Rental type</dt><dd>{item.rentalType}</dd></div>
                <div><dt>Availability</dt><dd>{item.available ? `${item.availableQuantity} available` : "Currently rented"}</dd></div>
                <div><dt>Condition</dt><dd>{details.condition}</dd></div>
                <div><dt>Brand &amp; model</dt><dd>{details.brand} {details.model}</dd></div>
              </dl>
            </section>

            <section className="detail-info-section detail-included-section">
              <div className="detail-section-heading">
                <span className="eyebrow">IN THE RENTAL</span>
                <h2>What&apos;s included</h2>
              </div>
              <ul className="detail-included-list">
                {details.included.map((feature) => (
                  <li key={feature}><span aria-hidden="true">✓</span>{feature}</li>
                ))}
              </ul>
            </section>

            <section className="detail-info-section">
              <div className="detail-section-heading">
                <span className="eyebrow">BEFORE YOU BOOK</span>
                <h2>Rental terms</h2>
              </div>
              <ul className="detail-terms-list">
                {details.rentalTerms.map((term) => <li key={term}>{term}</li>)}
              </ul>
            </section>

            <section className="detail-owner-card">
              <div className="owner-avatar">{details.owner.initials}</div>
              <div className="owner-info">
                <span className="eyebrow">LOCAL EQUIPMENT OWNER</span>
                <h2>{details.owner.name}</h2>
                <p><span aria-hidden="true">⌖</span> {details.owner.location}</p>
              </div>
              <div className="owner-stats">
                <strong>★ {details.owner.rating}</strong>
                <span>{details.owner.rentals} sample rentals</span>
              </div>
            </section>

            <p className="detail-sample-notice">
              This is a frontend preview. Equipment, owner, rating, price, and
              availability data are illustrative and are not live listings.
            </p>
          </div>

          <aside className="booking-card">
            <span className="eyebrow">RENT THIS EQUIPMENT</span>
            <div className="booking-rate">
              <strong>{item.rate}</strong><span> / {item.period}</span>
            </div>
            <p className="booking-rate-type">{item.rentalType} rental rate</p>
            <div className="booking-divider" />
            <div className="booking-owner-summary">
              <span className="owner-avatar owner-avatar-small">{details.owner.initials}</span>
              <span><strong>{details.owner.name}</strong><br />Local equipment owner</span>
              <span className="booking-owner-rating">★ {details.owner.rating}</span>
            </div>
            <div className="booking-availability-row">
              <span className={`availability-indicator${item.available ? "" : " is-unavailable"}`} />
              <span>{item.available ? "Available to request" : "Currently rented"}</span>
              {item.available && <strong>{item.availableQuantity} left</strong>}
            </div>
            <EquipmentBooking item={item} />
            <p className="booking-secure-note">Payment and booking confirmation will be added with the backend.</p>
          </aside>
        </section>

        <div className="detail-back-link">
          <Link className="text-link" href="/equipment">← Back to all equipment</Link>
        </div>
        </main>
  );
}
