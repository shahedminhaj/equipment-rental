"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest, formatCurrency, rentalPeriod, type EquipmentListing } from "../lib/api";

type SortOrder = "recent" | "price-low" | "price-high";

const rentalTypes: EquipmentListing["rentalType"][] = ["Daily", "Weekly", "Monthly"];

type CatalogResponse = {
  items: EquipmentListing[];
  total: number;
  page: number;
  pages: number;
};

type Category = { name: string; count: number };

export function EquipmentBrowser() {
  const [listings, setListings] = useState<EquipmentListing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState("");
  const [rentalType, setRentalType] = useState("");
  const [availability, setAvailability] = useState("");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    let active = true;
    apiRequest<{ items: Category[] }>("/equipment/categories")
      .then((response) => {
        if (active) setCategories(response.items);
      })
      .catch(() => {
        if (active) setCategories([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, category, rentalType, availability, minimumPrice, maximumPrice, sortOrder]);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), limit: "9" });
    if (debouncedQuery.trim()) params.set("search", debouncedQuery.trim());
    if (category) params.set("category", category);
    if (rentalType) params.set("rentalType", rentalType);
    if (availability) params.set("available", availability === "available" ? "true" : "false");
    if (minimumPrice) params.set("minPrice", minimumPrice);
    if (maximumPrice) params.set("maxPrice", maximumPrice);
    if (sortOrder !== "recent") params.set("sort", sortOrder);

    async function loadListings() {
      setIsLoading(true);
      setError("");
      try {
        const response = await apiRequest<CatalogResponse>(`/equipment?${params.toString()}`);
        if (!active) return;
        setListings(response.items);
        setTotal(response.total);
        setTotalPages(Math.max(1, response.pages));
        if (response.pages > 0 && page > response.pages) setPage(response.pages);
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load equipment");
          setListings([]);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadListings();
    return () => {
      active = false;
    };
  }, [
    availability,
    category,
    debouncedQuery,
    maximumPrice,
    minimumPrice,
    page,
    reloadKey,
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
    setPage(1);
  }

  return (
    <>
      <section className="catalog-intro">
        <div>
          <p className="eyebrow"><span className="eyebrow-line" /> THE FIELDKIT MARKETPLACE</p>
          <h1>Find your next <em>good thing.</em></h1>
          <p>
            Browse approved equipment from local owners, compare rental options,
            and book securely with Stripe Checkout.
          </p>
        </div>
        <div className="catalog-intro-note">
          <span className="catalog-intro-number">{String(listings.length).padStart(2, "0")}</span>
          <span>results on<br />this page</span>
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
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
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
                {categories.map((option) => (
                  <option key={option.name} value={option.name}>{option.name}</option>
                ))}
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

            <p className="filter-note">Only administrator-approved listings can be booked.</p>
          </aside>

          <div className="catalog-results">
            <div className="results-heading" aria-live="polite">
              <p><strong>{total}</strong> {total === 1 ? "piece" : "pieces"} of equipment found</p>
              {hasActiveFilters && <button type="button" onClick={clearFilters}>Reset all filters <span aria-hidden="true">×</span></button>}
            </div>

            {isLoading ? (
              <div className="catalog-empty" role="status">Loading live equipment...</div>
            ) : error ? (
              <div className="catalog-empty" role="alert">
                <h2>Equipment could not be loaded</h2>
                <p>{error}</p>
                <button className="button button-dark" type="button" onClick={() => setReloadKey((key) => key + 1)}>
                  Try again
                </button>
              </div>
            ) : listings.length > 0 ? (
              <div className="equipment-grid catalog-grid">
                {listings.map((item) => (
                  <article className="equipment-card" key={item.id}>
                    <div className="equipment-image-wrap">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        unoptimized
                        sizes="(max-width: 620px) 100vw, (max-width: 1000px) 50vw, 33vw"
                      />
                      <span className="equipment-tag"><span />{item.rentalType} rental</span>
                      <span className={`availability-badge${item.availableQuantity ? "" : " is-unavailable"}`}>
                        <span />{item.availableQuantity ? `${item.availableQuantity} available` : "Currently rented"}
                      </span>
                    </div>
                    <div className="equipment-content">
                      <div className="equipment-category">
                        <span>{item.category}</span><span className="rating">{item.rentalType}</span>
                      </div>
                      <h2>{item.name}</h2>
                      <p className="equipment-location"><span aria-hidden="true">⌖</span> {item.location}</p>
                      <div className="equipment-bottom">
                        <p><strong>{formatCurrency(item.price)}</strong> <span>/ {rentalPeriod(item.rentalType)}</span></p>
                        <Link className="details-coming-soon" href={`/equipment/${item.id}`}>
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
                <h2>{hasActiveFilters ? "No equipment found" : "No approved listings yet"}</h2>
                <p>
                  {hasActiveFilters
                    ? "Try a different search or relax one of your filters."
                    : "No equipment has been approved yet. An equipment owner needs to submit a listing, then an administrator can approve it for the marketplace."}
                </p>
                {!hasActiveFilters && (
                  <Link className="button button-dark catalog-owner-link" href="/get-started">
                    Learn how to list equipment <span aria-hidden="true">→</span>
                  </Link>
                )}
                {hasActiveFilters && (
                  <button className="button button-dark" type="button" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {!isLoading && !error && listings.length > 0 && (
              <nav className="catalog-pagination" aria-label="Equipment pages">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  ← Previous
                </button>
                <span>Page {page}</span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next →
                </button>
              </nav>
            )}

            {!isLoading && !error && listings.length > 0 && (
              <p className="sample-note">
                Live approved inventory. Prices and availability are rechecked at booking time.
              </p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
