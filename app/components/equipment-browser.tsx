"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { equipment } from "../data/equipment";
import type { RentalType } from "../data/equipment";

type SortOrder = "recent" | "price-low" | "price-high";

const rentalTypes: RentalType[] = ["Daily", "Weekly", "Monthly"];

export function EquipmentBrowser() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [rentalType, setRentalType] = useState("");
  const [availability, setAvailability] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");

  const categories = useMemo(
    () => [...new Set(equipment.map((item) => item.category))].sort(),
    [],
  );

  const filteredEquipment = useMemo(() => {
    const searchTerm = query.trim().toLocaleLowerCase();
    const min = minimumPrice === "" ? null : Number(minimumPrice);
    const max = maximumPrice === "" ? null : Number(maximumPrice);

    return equipment
      .filter((item) => {
        const matchesSearch =
          searchTerm === "" ||
          `${item.name} ${item.location} ${item.category}`
            .toLocaleLowerCase()
            .includes(searchTerm);
        const matchesCategory = category === "" || item.category === category;
        const matchesRentalType =
          rentalType === "" || item.rentalType === rentalType;
        const matchesAvailability =
          availability === "" ||
          (availability === "available" && item.available) ||
          (availability === "unavailable" && !item.available);
        const matchesMinimum = min === null || item.price >= min;
        const matchesMaximum = max === null || item.price <= max;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesRentalType &&
          matchesAvailability &&
          matchesMinimum &&
          matchesMaximum
        );
      })
      .sort((first, second) => {
        if (sortOrder === "price-low") return first.price - second.price;
        if (sortOrder === "price-high") return second.price - first.price;
        return second.addedAt.localeCompare(first.addedAt);
      });
  }, [
    availability,
    category,
    maximumPrice,
    minimumPrice,
    query,
    rentalType,
    sortOrder,
  ]);

  const hasActiveFilters =
    query !== "" ||
    category !== "" ||
    rentalType !== "" ||
    availability !== "" ||
    minimumPrice !== "" ||
    maximumPrice !== "" ||
    sortOrder !== "recent";

  function clearFilters() {
    setQuery("");
    setCategory("");
    setRentalType("");
    setAvailability("");
    setMinimumPrice("");
    setMaximumPrice("");
    setSortOrder("recent");
  }

  return (
    <>
      <section className="catalog-intro">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> THE FIELDKIT MARKETPLACE</p>
          <h1>Find your next <em>good thing.</em></h1>
          <p>
            Browse local equipment, compare rental options, and find the right
            fit for whatever you&apos;re working on.
          </p>
        </div>
        <div className="catalog-intro-note">
          <span className="catalog-intro-number">09</span>
          <span>sample listings<br />to get you started</span>
        </div>
      </section>

      <section className="catalog-section" aria-label="Browse equipment">
        <div className="catalog-toolbar">
          <label className="catalog-search">
            <span aria-hidden="true">⌕</span>
            <span className="visually-hidden">Search by equipment name, location, or category</span>
            <input
              type="search"
              placeholder="Search name, location, or category"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="catalog-sort">
            <span>Sort by</span>
            <select
              aria-label="Sort equipment"
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as SortOrder)
              }
            >
              <option value="recent">Recently added</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>
        </div>

        <div className="catalog-layout">
          <aside className="filter-panel" aria-label="Equipment filters">
            <div className="filter-panel-heading">
              <div><span className="eyebrow">MAKE IT YOURS</span><h2>Filters</h2></div>
              <button type="button" onClick={clearFilters}>Clear</button>
            </div>

            <label className="filter-field">
              <span>Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">All categories</option>
                {categories.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>

            <label className="filter-field">
              <span>Rental period</span>
              <select value={rentalType} onChange={(event) => setRentalType(event.target.value)}>
                <option value="">Any rental period</option>
                {rentalTypes.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>

            <fieldset className="price-filter">
              <legend>Price range (৳ per period)</legend>
              <div>
                <label>
                  <span className="visually-hidden">Minimum price</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="Min"
                    value={minimumPrice}
                    onChange={(event) => setMinimumPrice(event.target.value)}
                  />
                </label>
                <span aria-hidden="true">—</span>
                <label>
                  <span className="visually-hidden">Maximum price</span>
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    placeholder="Max"
                    value={maximumPrice}
                    onChange={(event) => setMaximumPrice(event.target.value)}
                  />
                </label>
              </div>
            </fieldset>

            <label className="filter-field">
              <span>Availability</span>
              <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
                <option value="">Any availability</option>
                <option value="available">Available now</option>
                <option value="unavailable">Currently rented</option>
              </select>
            </label>

            <p className="filter-note">More useful filters are coming as the marketplace grows.</p>
          </aside>

          <div className="catalog-results">
            <div className="results-heading" aria-live="polite">
              <p><strong>{filteredEquipment.length}</strong> {filteredEquipment.length === 1 ? "piece" : "pieces"} of equipment</p>
              {hasActiveFilters && <button type="button" onClick={clearFilters}>Reset all filters <span aria-hidden="true">×</span></button>}
            </div>

            {filteredEquipment.length > 0 ? (
              <div className="equipment-grid catalog-grid">
                {filteredEquipment.map((item) => (
                  <article className="equipment-card" key={item.id}>
                    <div className="equipment-image-wrap">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="(max-width: 620px) 100vw, (max-width: 1000px) 50vw, 33vw"
                      />
                      <span className="equipment-tag"><span />{item.tag}</span>
                      <span className={`availability-badge${item.available ? "" : " is-unavailable"}`}>
                        <span />{item.available ? `${item.availableQuantity} available` : "Currently rented"}
                      </span>
                    </div>
                    <div className="equipment-content">
                      <div className="equipment-category">
                        <span>{item.category}</span><span className="rating">★ {item.rating}</span>
                      </div>
                      <h2>{item.name}</h2>
                      <p className="equipment-location"><span aria-hidden="true">⌖</span> {item.location}</p>
                      <div className="equipment-bottom">
                        <p><strong>{item.rate}</strong> <span>/ {item.period}</span></p>
                        <Link
                          className="details-coming-soon"
                          href={`/equipment/${item.id}`}
                        >
                          View details <span aria-hidden="true">↗</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="catalog-empty">
                <span aria-hidden="true">⌕</span>
                <h2>No equipment found</h2>
                <p>Try a different search or relax one of your filters.</p>
                <button className="button button-dark" type="button" onClick={clearFilters}>Clear filters</button>
              </div>
            )}

            <p className="sample-note">
              Sample marketplace preview — listings, availability, ratings, and
              prices are illustrative, not live inventory.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
