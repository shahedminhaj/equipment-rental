import type { EquipmentListing } from "../lib/api";
import type { LandingCategory, LandingReview } from "./landing-data";

/**
 * Curated showcase content keeps the landing page useful when the API is not
 * running. IDs use a `demo-` prefix so cards can link to a filtered catalog
 * instead of a listing detail page that does not exist.
 */
export const DEMO_LISTING_PREFIX = "demo-";

export const fallbackFeatured: EquipmentListing[] = [
  {
    id: `${DEMO_LISTING_PREFIX}mini-excavator`,
    name: "CAT 305 Mini Excavator",
    description:
      "Compact excavator for tight urban sites, trenching, and landscaping. Delivered with a trained operator on request.",
    category: "Construction Equipment",
    location: "Dhaka",
    price: 12500,
    rentalType: "Daily",
    availableQuantity: 3,
    condition: "Excellent",
    brand: "Caterpillar",
    model: "305E2 CR",
    image:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=85",
    rentalTerms: ["Minimum one-day rental", "Fuel charged separately"],
  },
  {
    id: `${DEMO_LISTING_PREFIX}cinema-camera`,
    name: "Sony FX3 Cinema Camera Kit",
    description:
      "Full-frame cinema camera with two lenses, tripod, and onboard monitoring. Perfect for weddings and commercial shoots.",
    category: "Photography Equipment",
    location: "Dhaka",
    price: 4800,
    rentalType: "Daily",
    availableQuantity: 2,
    condition: "Excellent",
    brand: "Sony",
    model: "FX3",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=85",
    rentalTerms: ["Refundable deposit required", "Return with charged batteries"],
  },
  {
    id: `${DEMO_LISTING_PREFIX}hiace-van`,
    name: "Toyota HiAce Van",
    description:
      "Spacious 12-seater van for airport transfers, family trips, and equipment transport. Chauffeur optional.",
    category: "Vehicles & Transportation",
    location: "Chattogram",
    price: 6500,
    rentalType: "Daily",
    availableQuantity: 2,
    condition: "Good",
    brand: "Toyota",
    model: "HiAce",
    image:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85",
    rentalTerms: ["Valid driving licence required", "Toll and fuel excluded"],
  },
  {
    id: `${DEMO_LISTING_PREFIX}tractor`,
    name: "Kubota L3901 Tractor",
    description:
      "40HP compact tractor with front loader and rotary tiller. Ready for small farms and land preparation.",
    category: "Agriculture Equipment",
    location: "Sylhet",
    price: 9800,
    rentalType: "Daily",
    availableQuantity: 1,
    condition: "Good",
    brand: "Kubota",
    model: "L3901",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85",
    rentalTerms: ["Operator included", "Transport within 20 km included"],
  },
  {
    id: `${DEMO_LISTING_PREFIX}studio-setup`,
    name: 'MacBook Pro 16" Studio Setup',
    description:
      "M4 Pro MacBook with 27-inch monitor, keyboard, and mouse for editing, development, and design sprints.",
    category: "Electronics",
    location: "Dhaka",
    price: 3500,
    rentalType: "Weekly",
    availableQuantity: 4,
    condition: "Excellent",
    brand: "Apple",
    model: "MacBook Pro M4 Pro",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85",
    rentalTerms: ["Software must be licensed by renter", "Data wiped after return"],
  },
  {
    id: `${DEMO_LISTING_PREFIX}event-package`,
    name: "LED Stage & Sound Package",
    description:
      "Complete event package with LED wall, speakers, mixer, microphones, and lighting rig. Setup support included.",
    category: "Event Equipment",
    location: "Dhaka",
    price: 28000,
    rentalType: "Daily",
    availableQuantity: 2,
    condition: "Excellent",
    brand: "dB Technologies",
    model: "Event Pro 5000",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=85",
    rentalTerms: ["Technician required for setup", "Venue access must be confirmed"],
  },
];

export const fallbackCategories: LandingCategory[] = [
  { name: "Construction Equipment", count: 3 },
  { name: "Photography Equipment", count: 2 },
  { name: "Vehicles & Transportation", count: 2 },
  { name: "Agriculture Equipment", count: 2 },
  { name: "Electronics", count: 1 },
  { name: "Event Equipment", count: 2 },
];

export const fallbackReviews: LandingReview[] = [
  {
    id: "demo-review-1",
    name: "Rahim Ahmed",
    role: "Verified renter",
    quote:
      "The excavator arrived on schedule and made a tight backyard project possible. Booking and pickup were straightforward.",
    rating: 5,
  },
  {
    id: "demo-review-2",
    name: "Maya Chowdhury",
    role: "Wedding photographer",
    quote:
      "Rented the FX3 kit for a three-day shoot. The lenses and batteries were exactly as described and saved me a fortune.",
    rating: 5,
  },
  {
    id: "demo-review-3",
    name: "Arif Khan",
    role: "Small business owner",
    quote:
      "The HiAce was clean, reliable, and perfect for moving gear between events. I will definitely rent again.",
    rating: 4,
  },
  {
    id: "demo-review-4",
    name: "Sultana Rupa",
    role: "Event organizer",
    quote:
      "The stage and sound package turned a community workshop into something special. Setup support was excellent.",
    rating: 5,
  },
  {
    id: "demo-review-5",
    name: "Tanvir Hossain",
    role: "Farm manager",
    quote:
      "A well-maintained tractor with a helpful operator. Clear pricing and no surprises made the whole experience easy.",
    rating: 4,
  },
];
