export type EquipmentDetails = {
  description: string;
  condition: string;
  brand: string;
  model: string;
  included: string[];
  rentalTerms: string[];
  owner: {
    name: string;
    initials: string;
    rating: string;
    rentals: number;
    location: string;
  };
};

export const equipmentDetails: Record<string, EquipmentDetails> = {
  "compact-excavator": {
    description:
      "A compact, easy-to-maneuver excavator for landscaping, foundation work, and smaller construction projects where a full-size machine is too large.",
    condition: "Well maintained",
    brand: "Kubota",
    model: "U17-3",
    included: ["Operator manual", "Standard digging bucket", "Safety check before pickup"],
    rentalTerms: [
      "Renter arranges transportation to and from the job site.",
      "Return the machine clean and with the same fuel level.",
      "A valid photo ID is required at pickup.",
    ],
    owner: {
      name: "Rahim Equipment Co.",
      initials: "RE",
      rating: "4.9",
      rentals: 38,
      location: "Dhanmondi, Dhaka",
    },
  },
  "sony-camera-kit": {
    description:
      "A full-frame mirrorless camera kit for events, portraits, and video projects. A versatile choice for independent creators and small production teams.",
    condition: "Excellent",
    brand: "Sony",
    model: "A7 IV",
    included: ["Camera body", "24–70mm lens", "Two batteries", "Camera bag"],
    rentalTerms: [
      "Handle the camera and lens with care and keep them dry.",
      "Return all listed accessories with the kit.",
      "A valid photo ID is required at pickup.",
    ],
    owner: {
      name: "Maliha Studio",
      initials: "MS",
      rating: "5.0",
      rentals: 24,
      location: "Gulshan, Dhaka",
    },
  },
  "utility-pickup": {
    description:
      "A practical pickup with an open cargo bed for moving supplies, tools, and equipment around town. Contact the owner to check the next available dates.",
    condition: "Good",
    brand: "Toyota",
    model: "Hilux",
    included: ["Cargo bed cover", "Spare tire", "Basic roadside kit"],
    rentalTerms: [
      "A valid driving license is required.",
      "Fuel and parking costs are the renter's responsibility.",
      "Return the vehicle in the condition received.",
    ],
    owner: {
      name: "Uttara Utility Rentals",
      initials: "UU",
      rating: "4.8",
      rentals: 31,
      location: "Uttara, Dhaka",
    },
  },
  "professional-drone": {
    description:
      "A stable camera drone for travel footage, property videos, and aerial photography. Suitable for experienced pilots planning a small production.",
    condition: "Excellent",
    brand: "DJI",
    model: "Mavic 3",
    included: ["Drone", "Remote controller", "Three batteries", "Carry case"],
    rentalTerms: [
      "Renter is responsible for safe and lawful operation.",
      "Keep the drone within line of sight and away from restricted areas.",
      "Return the complete kit in its carry case.",
    ],
    owner: {
      name: "Aerial Dhaka",
      initials: "AD",
      rating: "4.9",
      rentals: 46,
      location: "Banani, Dhaka",
    },
  },
  "heavy-duty-generator": {
    description:
      "A portable generator for temporary power at a work site or outdoor event. Check your equipment's power requirements with the owner before booking.",
    condition: "Good",
    brand: "Honda",
    model: "EU70is",
    included: ["Generator", "Power cable", "Quick-start guide"],
    rentalTerms: [
      "Operate outdoors in a well-ventilated area only.",
      "Renter supplies fuel and follows the operating instructions.",
      "A valid photo ID is required at pickup.",
    ],
    owner: {
      name: "Mirpur Power Tools",
      initials: "MP",
      rating: "4.7",
      rentals: 19,
      location: "Mirpur, Dhaka",
    },
  },
  "ride-on-lawn-mower": {
    description:
      "A ride-on mower for keeping larger lawns and open grounds in shape. Its comfortable seat and wide cutting deck help make bigger jobs more manageable.",
    condition: "Well maintained",
    brand: "John Deere",
    model: "S100",
    included: ["Ride-on mower", "Grass catcher", "Safety instructions"],
    rentalTerms: [
      "Clear the lawn of stones and debris before use.",
      "Renter supplies fuel and returns the mower clean.",
      "A valid photo ID is required at pickup.",
    ],
    owner: {
      name: "Savar Garden Machines",
      initials: "SG",
      rating: "4.9",
      rentals: 22,
      location: "Savar, Dhaka",
    },
  },
  "event-lighting-kit": {
    description:
      "A flexible lighting set for small events, community programs, and indoor productions. The weekly rate suits multi-day setups and rehearsals.",
    condition: "Excellent",
    brand: "Chauvet",
    model: "DJ LED Lighting Set",
    included: ["LED fixtures", "Power cables", "Lighting stands", "Carry cases"],
    rentalTerms: [
      "Renter checks power and venue requirements before setup.",
      "Return all fixtures, cables, and stands in their cases.",
      "A valid photo ID is required at pickup.",
    ],
    owner: {
      name: "Bashundhara Event Supply",
      initials: "BE",
      rating: "4.8",
      rentals: 35,
      location: "Bashundhara, Dhaka",
    },
  },
  "field-tractor": {
    description:
      "A versatile field tractor for routine farm work and property maintenance. Contact the owner to discuss transport and future availability.",
    condition: "Good",
    brand: "Mahindra",
    model: "575 DI",
    included: ["Tractor", "Standard hitch", "Operator guide"],
    rentalTerms: [
      "Renter confirms the tractor suits the planned attachment and work.",
      "Transportation and fuel are arranged by the renter.",
      "A valid photo ID is required at pickup.",
    ],
    owner: {
      name: "Keraniganj Farm Equipment",
      initials: "KF",
      rating: "4.8",
      rentals: 17,
      location: "Keraniganj, Dhaka",
    },
  },
  "portable-workstation": {
    description:
      "A portable workstation for design, editing, and other demanding work. The monthly rental period is a practical option for temporary projects.",
    condition: "Excellent",
    brand: "Apple",
    model: "MacBook Pro",
    included: ["Workstation", "Power adapter", "Protective sleeve"],
    rentalTerms: [
      "Return the device with its charger and protective sleeve.",
      "Back up personal files and sign out of personal accounts before return.",
      "A valid photo ID is required at pickup.",
    ],
    owner: {
      name: "Mohammadpur Tech Hire",
      initials: "MT",
      rating: "4.9",
      rentals: 28,
      location: "Mohammadpur, Dhaka",
    },
  },
};
