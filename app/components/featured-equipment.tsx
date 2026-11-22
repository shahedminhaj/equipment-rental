"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, formatCurrency, rentalPeriod, type EquipmentListing } from "../lib/api";
import { StaggerGroup, StaggerItem } from "./animations";

export function FeaturedEquipment() {
  const [items, setItems] = useState<EquipmentListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    setIsSignedIn(Boolean(window.localStorage.getItem("fieldkit_token")));
    apiRequest<{ items: EquipmentListing[] }>("/equipment/featured")
      .then((response) => {
        if (active) setItems(response.items);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (isLoading) {
    return <p className="featured-status" role="status">Loading featured equipment...</p>;
  }

  if (!items.length) {
    return (
      <div className="featured-status">
        <p>Featured equipment will appear here once listings are approved.</p>
        <Link className="button button-dark cta-green-link" href="/equipment">Browse all equipment <span aria-hidden="true">↗</span></Link>
      </div>
    );
  }

  return (
    <StaggerGroup className="equipment-grid">
      {items.map((item) => {
        const detailHref = isSignedIn
          ? `/equipment/${item.id}`
          : `/login?next=${encodeURIComponent(`/equipment/${item.id}`)}`;
        return (
          <StaggerItem key={item.id}>
            <article className="equipment-card">
              <div className="equipment-image-wrap">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  unoptimized
                  sizes="(max-width: 620px) 100vw, (max-width: 1000px) 50vw, 33vw"
                />
                <span className="equipment-tag"><span />{item.rentalType} rental</span>
                <span className="availability-badge">
                  <span />{item.availableQuantity ? `${item.availableQuantity} available` : "Currently rented"}
                </span>
              </div>
              <div className="equipment-content">
                <div className="equipment-category">
                  <span>{item.category}</span>
                  <span className="rating">{item.rentalType}</span>
                </div>
                <h3>{item.name}</h3>
                <p className="equipment-location"><span aria-hidden="true">⌖</span> {item.location}</p>
                <div className="equipment-bottom">
                  <p><strong>{formatCurrency(item.price)}</strong> <span>/ {rentalPeriod(item.rentalType)}</span></p>
                  <Link className="details-coming-soon cta-green-link" href={detailHref}>
                    View details <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </div>
            </article>
          </StaggerItem>
        );
      })}
    </StaggerGroup>
  );
}
