import { apiRequest, type EquipmentListing } from "../lib/api";
import {
  fallbackCategories,
  fallbackFeatured,
  fallbackReviews,
} from "./landing-fallback";
import type { StatKey } from "./site-content";

export type LandingCategory = { name: string; count: number };

export type LandingData = {
  categories: LandingCategory[];
  featured: EquipmentListing[];
  reviews: LandingReview[];
  stats: Record<StatKey, string>;
  isLive: boolean;
};

export type LandingReview = {
  id: string;
  name: string;
  role?: string;
  quote: string;
  rating: number;
};

type CategoryResponse = { items: LandingCategory[] };
type FeaturedResponse = { items: EquipmentListing[] };
type CatalogResponse = { total: number };
type ReviewsResponse = { items: LandingReview[] };

const FEATURED_COUNT = 6;
const REVIEW_COUNT = 4;
const FALLBACK_CATALOG_TOTAL = 12;

function isUsableListing(item: EquipmentListing | undefined): item is EquipmentListing {
  return Boolean(
    item?.id &&
      item.name &&
      item.category &&
      item.location &&
      item.image &&
      Number.isFinite(item.price) &&
      item.rentalType,
  );
}

function isUsableReview(review: LandingReview | undefined): review is LandingReview {
  return Boolean(
    review?.id &&
      review.name &&
      review.quote &&
      Number.isFinite(review.rating) &&
      review.rating > 0,
  );
}

function padWithFallback<T>(
  liveItems: T[],
  fallbackItems: T[],
  minimum: number,
  key: (item: T) => string,
): T[] {
  const seen = new Set(liveItems.map(key));
  const padded = [...liveItems];

  for (const item of fallbackItems) {
    if (padded.length >= minimum) break;
    const identity = key(item);
    if (seen.has(identity)) continue;
    seen.add(identity);
    padded.push(item);
  }

  return padded;
}

export async function getLandingData(): Promise<LandingData> {
  const [categoryResult, featuredResult, catalogResult, reviewResult] = await Promise.allSettled([
    apiRequest<CategoryResponse>("/equipment/categories"),
    apiRequest<FeaturedResponse>("/equipment/featured"),
    apiRequest<CatalogResponse>("/equipment?limit=1"),
    apiRequest<ReviewsResponse>("/reviews/featured"),
  ]);

  const liveCategories =
    categoryResult.status === "fulfilled" && Array.isArray(categoryResult.value.items)
      ? categoryResult.value.items.filter(
          (category) => category?.name && Number.isFinite(category.count),
        )
      : [];
  const categories = padWithFallback(
    liveCategories,
    fallbackCategories,
    fallbackCategories.length,
    (category) => category.name.toLowerCase(),
  );

  const liveFeatured =
    featuredResult.status === "fulfilled" && Array.isArray(featuredResult.value.items)
      ? featuredResult.value.items.filter(isUsableListing)
      : [];
  const featured = padWithFallback(
    liveFeatured,
    fallbackFeatured,
    FEATURED_COUNT,
    (item) => item.name.toLowerCase(),
  ).slice(0, Math.max(FEATURED_COUNT, liveFeatured.length));

  const liveReviews =
    reviewResult.status === "fulfilled" && Array.isArray(reviewResult.value.items)
      ? reviewResult.value.items.filter(isUsableReview)
      : [];
  const reviews = padWithFallback(
    liveReviews,
    fallbackReviews,
    REVIEW_COUNT,
    (review) => review.id,
  );

  const catalogTotal =
    catalogResult.status === "fulfilled" && Number.isFinite(catalogResult.value.total)
      ? catalogResult.value.total
      : FALLBACK_CATALOG_TOTAL;
  const ratings = reviews.map((review) => Number(review.rating)).filter(Number.isFinite);
  const rating = ratings.length
    ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1)
    : "—";

  return {
    categories,
    featured,
    reviews,
    stats: {
      listings: String(catalogTotal || FALLBACK_CATALOG_TOTAL),
      rating,
      categories: String(categories.length),
      savings: "৳12k",
    },
    isLive:
      categoryResult.status === "fulfilled" &&
      featuredResult.status === "fulfilled" &&
      catalogResult.status === "fulfilled" &&
      reviewResult.status === "fulfilled",
  };
}
