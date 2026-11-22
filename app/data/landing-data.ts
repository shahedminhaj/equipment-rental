import { apiRequest, type EquipmentListing } from "../lib/api";
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

export async function getLandingData(): Promise<LandingData> {
  const [categoryResult, featuredResult, catalogResult, reviewResult] = await Promise.allSettled([
    apiRequest<CategoryResponse>("/equipment/categories"),
    apiRequest<FeaturedResponse>("/equipment/featured"),
    apiRequest<CatalogResponse>("/equipment?limit=1"),
    apiRequest<ReviewsResponse>("/reviews/featured"),
  ]);

  const categories =
    categoryResult.status === "fulfilled"
      ? categoryResult.value.items
      : [];

  const featured =
    featuredResult.status === "fulfilled"
      ? featuredResult.value.items
      : [];

  const reviews = reviewResult.status === "fulfilled" ? reviewResult.value.items : [];

  const catalogTotal =
    catalogResult.status === "fulfilled" && Number.isFinite(catalogResult.value.total)
      ? catalogResult.value.total
      : 0;
  const ratings = reviews.map((review) => Number(review.rating)).filter(Number.isFinite);
  const rating = ratings.length
    ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1)
    : "—";

  return {
    categories,
    featured,
    reviews,
    stats: {
      listings: String(catalogTotal),
      rating,
      categories: String(categories.length),
      savings: "—",
    },
    isLive:
      categoryResult.status === "fulfilled" &&
      featuredResult.status === "fulfilled" &&
      catalogResult.status === "fulfilled" &&
      reviewResult.status === "fulfilled",
  };
}
