import { equipment as fallbackListings } from "./equipment";
import { apiRequest, type EquipmentListing } from "../lib/api";
import { siteContent, type StatKey } from "./site-content";

export type LandingCategory = { name: string; count: number };

export type LandingData = {
  categories: LandingCategory[];
  featured: EquipmentListing[];
  stats: Record<StatKey, string>;
  isLive: boolean;
};

type CategoryResponse = { items: LandingCategory[] };
type FeaturedResponse = { items: EquipmentListing[] };
type CatalogResponse = { total: number };

function fallbackCategories(): LandingCategory[] {
  const counts = new Map<string, number>();
  for (const item of fallbackListings) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  return Array.from(counts, ([name, count]) => ({ name, count }));
}

function fallbackFeatured(): EquipmentListing[] {
  return [...fallbackListings]
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      location: item.location,
      price: item.price,
      rentalType: item.rentalType,
      availableQuantity: item.availableQuantity,
      image: item.image,
    }));
}

function averageRating() {
  const ratings = siteContent.reviews.items.map((review) => Number(review.rating));
  const valid = ratings.filter((value) => Number.isFinite(value));
  if (!valid.length) return "5.0";
  const average = valid.reduce((total, value) => total + value, 0) / valid.length;
  return average.toFixed(1);
}

export async function getLandingData(): Promise<LandingData> {
  const [categoryResult, featuredResult, catalogResult] = await Promise.allSettled([
    apiRequest<CategoryResponse>("/equipment/categories"),
    apiRequest<FeaturedResponse>("/equipment/featured"),
    apiRequest<CatalogResponse>("/equipment?limit=1"),
  ]);

  const categories =
    categoryResult.status === "fulfilled" && categoryResult.value.items?.length
      ? categoryResult.value.items
      : fallbackCategories();

  const featured =
    featuredResult.status === "fulfilled" && featuredResult.value.items?.length
      ? featuredResult.value.items
      : fallbackFeatured();

  const catalogTotal =
    catalogResult.status === "fulfilled" && Number.isFinite(catalogResult.value.total)
      ? catalogResult.value.total
      : fallbackListings.length;

  const savings = siteContent.stats.find((stat) => stat.key === "savings");

  return {
    categories,
    featured,
    stats: {
      listings: String(catalogTotal),
      rating: averageRating(),
      categories: String(categories.length),
      savings: savings && "value" in savings ? savings.value : "64",
    },
    isLive:
      categoryResult.status === "fulfilled" &&
      featuredResult.status === "fulfilled" &&
      catalogResult.status === "fulfilled",
  };
}
