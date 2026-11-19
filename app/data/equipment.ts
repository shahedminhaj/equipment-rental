export type RentalType = "Daily" | "Weekly" | "Monthly";

export type EquipmentListing = {
  id: string;
  name: string;
  category: string;
  location: string;
  rate: string;
  price: number;
  period: string;
  rentalType: RentalType;
  rating: string;
  image: string;
  tag: string;
  available: boolean;
  availableQuantity: number;
  addedAt: string;
};

export const equipment: EquipmentListing[] = [
  {
    id: "compact-excavator",
    name: "Compact excavator",
    category: "Construction",
    location: "Dhanmondi, Dhaka",
    rate: "৳ 4,800",
    price: 4800,
    period: "day",
    rentalType: "Daily",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1580901368919-7738efb0f87e?auto=format&fit=crop&w=1000&q=85",
    tag: "Popular",
    available: true,
    availableQuantity: 2,
    addedAt: "2026-11-18",
  },
  {
    id: "sony-camera-kit",
    name: "Sony A7 IV camera kit",
    category: "Photography",
    location: "Gulshan, Dhaka",
    rate: "৳ 2,200",
    price: 2200,
    period: "day",
    rentalType: "Daily",
    rating: "5.0",
    image:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85",
    tag: "Top rated",
    available: true,
    availableQuantity: 1,
    addedAt: "2026-11-16",
  },
  {
    id: "utility-pickup",
    name: "Utility pickup truck",
    category: "Vehicles",
    location: "Uttara, Dhaka",
    rate: "৳ 6,500",
    price: 6500,
    period: "day",
    rentalType: "Daily",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=85",
    tag: "Popular choice",
    available: false,
    availableQuantity: 0,
    addedAt: "2026-11-12",
  },
  {
    id: "professional-drone",
    name: "Professional drone",
    category: "Photography",
    location: "Banani, Dhaka",
    rate: "৳ 1,800",
    price: 1800,
    period: "day",
    rentalType: "Daily",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=1000&q=85",
    tag: "Popular",
    available: true,
    availableQuantity: 3,
    addedAt: "2026-11-10",
  },
  {
    id: "heavy-duty-generator",
    name: "Heavy-duty generator",
    category: "Electronics",
    location: "Mirpur, Dhaka",
    rate: "৳ 3,200",
    price: 3200,
    period: "day",
    rentalType: "Daily",
    rating: "4.7",
    image:
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1000&q=85",
    tag: "Verified owner",
    available: true,
    availableQuantity: 1,
    addedAt: "2026-11-08",
  },
  {
    id: "ride-on-lawn-mower",
    name: "Ride-on lawn mower",
    category: "Agriculture",
    location: "Savar, Dhaka",
    rate: "৳ 2,600",
    price: 2600,
    period: "day",
    rentalType: "Daily",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=85",
    tag: "New listing",
    available: true,
    availableQuantity: 2,
    addedAt: "2026-11-19",
  },
  {
    id: "event-lighting-kit",
    name: "Event lighting kit",
    category: "Events",
    location: "Bashundhara, Dhaka",
    rate: "৳ 8,000",
    price: 8000,
    period: "week",
    rentalType: "Weekly",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1000&q=85",
    tag: "Owner favorite",
    available: true,
    availableQuantity: 4,
    addedAt: "2026-11-17",
  },
  {
    id: "field-tractor",
    name: "Field tractor",
    category: "Agriculture",
    location: "Keraniganj, Dhaka",
    rate: "৳ 18,000",
    price: 18000,
    period: "week",
    rentalType: "Weekly",
    rating: "4.8",
    image:
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1000&q=85",
    tag: "Verified owner",
    available: false,
    availableQuantity: 0,
    addedAt: "2026-11-05",
  },
  {
    id: "portable-workstation",
    name: "Portable workstation",
    category: "Electronics",
    location: "Mohammadpur, Dhaka",
    rate: "৳ 12,000",
    price: 12000,
    period: "month",
    rentalType: "Monthly",
    rating: "4.9",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=85",
    tag: "Monthly rate",
    available: true,
    availableQuantity: 2,
    addedAt: "2026-11-14",
  },
];
