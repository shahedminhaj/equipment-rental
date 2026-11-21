"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  PackageSearch,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { appSurfaces, publicTone } from "../data/app-theme";
import { apiRequest, formatCurrency, rentalPeriod, type EquipmentListing } from "../lib/api";

type SortOrder = "recent" | "price-low" | "price-high";

const rentalTypes: EquipmentListing["rentalType"][] = ["Daily", "Weekly", "Monthly"];

const sortOptions: { value: SortOrder; label: string }[] = [
  { value: "recent", label: "Recently added" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
];

type CatalogResponse = {
  items: EquipmentListing[];
  total: number;
  page: number;
  pages: number;
};

type Category = { name: string; count: number };

export function EquipmentBrowser() {
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<EquipmentListing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [category, setCategory] = useState(() => searchParams?.get("category") ?? "");
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
    <div className={cn(appSurfaces.page, "relative isolate overflow-hidden")}>
      <div aria-hidden="true" className={appSurfaces.pageGlow} />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-8 pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-xl bg-linear-to-br text-white shadow-md shadow-violet-500/25",
                  publicTone.gradient
                )}
              >
                <Sparkles className="size-4" />
              </span>
              <p className={appSurfaces.eyebrow}>THE FIELDKIT MARKETPLACE</p>
            </div>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Find your next{" "}
              <span className="bg-linear-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                good thing.
              </span>
            </h1>
            <p className={cn("mt-4 max-w-xl", appSurfaces.body)}>
              Browse approved equipment from local owners, compare rental options,
              and book securely with Stripe Checkout.
            </p>
          </div>

          <div className={cn(appSurfaces.softCard, "flex shrink-0 items-center gap-3 px-4 py-3 shadow-sm")}>
            <Avatar className="size-9 ring-2 ring-white">
              <AvatarFallback
                className={cn("bg-linear-to-br text-[11px] font-bold text-white", publicTone.gradient)}
              >
                FK
              </AvatarFallback>
            </Avatar>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold tracking-tight text-slate-900">
                {String(listings.length).padStart(2, "0")}
              </span>
              <span className="text-[11px] leading-4 text-slate-500">
                results on<br />this page
              </span>
            </div>
          </div>
        </section>

        <section aria-label="Browse equipment" className="pb-16">
          <div
            className={cn(
              appSurfaces.card,
              "mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
            )}
          >
            <div className="relative w-full sm:max-w-md">
              <Label htmlFor="equipment-search" className="sr-only">
                Search by equipment name, location, or category
              </Label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="equipment-search"
                type="search"
                placeholder="Search name, location, or category"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-11 rounded-xl border-slate-200 bg-slate-50/80 pl-9 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:border-violet-300 focus-visible:ring-violet-200/60"
              />
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="equipment-sort" className="whitespace-nowrap text-xs font-semibold text-slate-500">
                Sort by
              </Label>
              <Select
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as SortOrder)}
              >
                <SelectTrigger
                  id="equipment-sort"
                  aria-label="Sort equipment"
                  style={{ height: "2.5rem" }}
                  className="w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-sm sm:w-48"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 bg-white p-1 text-slate-900 shadow-xl">
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside aria-label="Equipment filters" className="lg:sticky lg:top-6 lg:self-start">
              <Card className={cn(appSurfaces.card, "gap-0 overflow-hidden border-0")}>
                <div aria-hidden="true" className={cn("h-0.5 w-full bg-linear-to-r", publicTone.panelAccent)} />
                <CardHeader className="flex flex-row items-center justify-between gap-3 px-5 pt-5 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("grid size-8 place-items-center rounded-xl", publicTone.iconTile)}>
                      <SlidersHorizontal className="size-4" />
                    </span>
                    <div>
                      <p className={appSurfaces.eyebrow}>MAKE IT YOURS</p>
                      <CardTitle className="mt-0.5 text-base font-bold text-slate-900">Filters</CardTitle>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="rounded-full text-xs text-slate-500 hover:text-violet-700"
                  >
                    Clear
                  </Button>
                </CardHeader>

                <CardContent className="space-y-5 px-5 pb-5">
                  <div className="space-y-2">
                    <Label htmlFor="filter-category" className="text-xs font-semibold text-slate-700">
                      Category
                    </Label>
                    <Select
                      value={category || null}
                      onValueChange={(value) => setCategory(value ?? "")}
                    >
                      <SelectTrigger
                        id="filter-category"
                        style={{ height: "2.5rem" }}
                        className="w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-sm"
                      >
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 bg-white p-1 text-slate-900 shadow-xl">
                        {categories.map((option) => (
                          <SelectItem key={option.name} value={option.name}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className={appSurfaces.divider} />

                  <div className="space-y-2">
                    <Label htmlFor="filter-rental-period" className="text-xs font-semibold text-slate-700">
                      Rental period
                    </Label>
                    <Select
                      value={rentalType || null}
                      onValueChange={(value) => setRentalType(value ?? "")}
                    >
                      <SelectTrigger
                        id="filter-rental-period"
                        style={{ height: "2.5rem" }}
                        className="w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-sm"
                      >
                        <SelectValue placeholder="Any rental period" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 bg-white p-1 text-slate-900 shadow-xl">
                        {rentalTypes.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className={appSurfaces.divider} />

                  <fieldset className="space-y-2">
                    <legend className="text-xs font-semibold text-slate-700">
                      Price range (৳ per period)
                    </legend>
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <Label htmlFor="filter-min-price" className="sr-only">Minimum price</Label>
                        <Input
                          id="filter-min-price"
                          type="number"
                          min="0"
                          inputMode="numeric"
                          placeholder="Min"
                          value={minimumPrice}
                          onChange={(event) => setMinimumPrice(event.target.value)}
                          className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                        />
                      </div>
                      <span aria-hidden="true" className="text-xs text-slate-400">—</span>
                      <div className="min-w-0 flex-1">
                        <Label htmlFor="filter-max-price" className="sr-only">Maximum price</Label>
                        <Input
                          id="filter-max-price"
                          type="number"
                          min="0"
                          inputMode="numeric"
                          placeholder="Max"
                          value={maximumPrice}
                          onChange={(event) => setMaximumPrice(event.target.value)}
                          className="h-10 rounded-xl border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm"
                        />
                      </div>
                    </div>
                  </fieldset>

                  <Separator className={appSurfaces.divider} />

                  <div className="space-y-2">
                    <Label htmlFor="filter-availability" className="text-xs font-semibold text-slate-700">
                      Availability
                    </Label>
                    <Select
                      value={availability || null}
                      onValueChange={(value) => setAvailability(value ?? "")}
                    >
                      <SelectTrigger
                        id="filter-availability"
                        style={{ height: "2.5rem" }}
                        className="w-full rounded-xl border-slate-200 bg-white text-sm text-slate-900 shadow-sm"
                      >
                        <SelectValue placeholder="Any availability" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 bg-white p-1 text-slate-900 shadow-xl">
                        <SelectItem value="available">Available now</SelectItem>
                        <SelectItem value="unavailable">Currently rented</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <p className="text-[11px] leading-5 text-slate-600">
                      Only administrator-approved listings can be booked.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </aside>

            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3" aria-live="polite">
                <p className="text-sm text-slate-600">
                  <strong className="font-bold text-slate-900">{total}</strong>{" "}
                  {total === 1 ? "piece" : "pieces"} of equipment found
                </p>
                {hasActiveFilters && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className={cn(
                      "h-8 rounded-full bg-linear-to-r px-3 text-xs font-semibold text-white shadow-sm hover:text-white!",
                      publicTone.gradient
                    )}
                  >
                    Reset all filters
                    <X className="size-3.5" />
                  </Button>
                )}
              </div>

              {isLoading ? (
                <div role="status">
                  <p className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="size-4 animate-spin text-violet-600" />
                    Loading live equipment...
                  </p>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Card key={index} className={cn(appSurfaces.card, "gap-0 overflow-hidden border-0 p-0")}>
                        <Skeleton className="h-48 w-full rounded-none" />
                        <div className="space-y-3 p-5">
                          <Skeleton className="h-3 w-1/3" />
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Separator className="my-4" />
                          <Skeleton className="h-8 w-2/3" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div
                  role="alert"
                  className={cn(appSurfaces.card, "flex flex-col items-center gap-3 px-6 py-14 text-center")}
                >
                  <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                    <TriangleAlert className="size-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">Equipment could not be loaded</h2>
                  <p className={cn("max-w-md", appSurfaces.body)}>{error}</p>
                  <Button
                    type="button"
                    onClick={() => setReloadKey((key) => key + 1)}
                    className="mt-2 rounded-full bg-slate-900! px-5 text-white! hover:bg-violet-700!"
                  >
                    <RotateCcw className="size-4" />
                    Try again
                  </Button>
                </div>
              ) : listings.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {listings.map((item) => (
                    <Card
                      key={item.id}
                      className={cn(
                        appSurfaces.card,
                        "group gap-0 overflow-hidden border-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-500/10"
                      )}
                    >
                      <div className="relative h-56 overflow-hidden">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          unoptimized
                          sizes="(max-width: 620px) 100vw, (max-width: 1000px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-950/35 via-transparent to-transparent" />
                        <Badge
                          className={cn(
                            "absolute top-4 left-4 rounded-full px-2.5 text-[10px] font-bold shadow-sm",
                            publicTone.softBadge
                          )}
                        >
                          {item.rentalType} rental
                        </Badge>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "absolute right-4 bottom-4 gap-1.5 rounded-full bg-white/90 px-2.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm",
                            item.availableQuantity ? "text-emerald-700" : "text-rose-700"
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              item.availableQuantity ? "bg-emerald-500" : "bg-rose-500"
                            )}
                          />
                          {item.availableQuantity
                            ? `${item.availableQuantity} available`
                            : "Currently rented"}
                        </Badge>
                      </div>

                      <CardContent className="flex flex-1 flex-col p-5">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn("text-[10px] font-bold tracking-wider uppercase", publicTone.accentText)}>
                            {item.category}
                          </span>
                          <Badge
                            variant="outline"
                            className="rounded-full border-slate-200 bg-slate-50 px-2 text-[10px] text-slate-600"
                          >
                            {item.rentalType}
                          </Badge>
                        </div>
                        <CardTitle className="mt-2 text-lg font-bold tracking-tight text-slate-900">
                          {item.name}
                        </CardTitle>
                        <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="size-3.5" />
                          {item.location}
                        </p>

                        <Separator className="my-4" />

                        <div className="mt-auto flex items-end justify-between gap-3">
                          <p className="text-xl font-bold tracking-tight text-slate-900">
                            {formatCurrency(item.price)}
                            <span className="text-xs font-medium text-slate-400">
                              {" "}/ {rentalPeriod(item.rentalType)}
                            </span>
                          </p>
                          <Link
                            href={`/equipment/${item.id}`}
                            className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-900 hover:text-white focus-visible:ring-3 focus-visible:ring-violet-300/60"
                          >
                            View details
                            <ArrowUpRight className="size-3.5" />
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div
                  className={cn(appSurfaces.card, "flex flex-col items-center gap-3 px-6 py-16 text-center")}
                >
                  <span className={cn("grid size-12 place-items-center rounded-2xl", publicTone.iconTile)}>
                    <PackageSearch className="size-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    {hasActiveFilters ? "No equipment found" : "No approved listings yet"}
                  </h2>
                  <p className={cn("max-w-lg", appSurfaces.body)}>
                    {hasActiveFilters
                      ? "Try a different search or relax one of your filters."
                      : "No equipment has been approved yet. An equipment owner needs to submit a listing, then an administrator can approve it for the marketplace."}
                  </p>
                  {!hasActiveFilters && (
                    <Link
                      className={cn(
                        "mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-linear-to-r px-5 text-xs font-semibold text-white shadow-lg shadow-fuchsia-500/20 transition-all hover:-translate-y-px focus-visible:ring-3 focus-visible:ring-violet-300/60",
                        publicTone.gradient
                      )}
                      href="/signup"
                    >
                      Create account to list equipment
                      <ArrowRight className="size-4" />
                    </Link>
                  )}
                  {hasActiveFilters && (
                    <Button
                      type="button"
                      onClick={clearFilters}
                      className="mt-2 rounded-full bg-slate-900! px-5 text-white! hover:bg-violet-700!"
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              )}

              {!isLoading && !error && listings.length > 0 && (
                <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Equipment pages">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="rounded-full border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50! hover:text-slate-900!"
                  >
                    <ChevronLeft className="size-4" />
                    Previous
                  </Button>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Page {page}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-full border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50! hover:text-slate-900!"
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </nav>
              )}

              {!isLoading && !error && listings.length > 0 && (
                <p className="mt-6 text-center text-[11px] text-slate-400">
                  Live approved inventory. Prices and availability are rechecked at booking time.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
