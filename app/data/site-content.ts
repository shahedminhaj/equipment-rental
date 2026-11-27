export type IconKey =
  | "sparkles"
  | "package"
  | "star"
  | "layers"
  | "leaf"
  | "shield"
  | "wallet"
  | "clock"
  | "map-pin"
  | "search"
  | "calendar"
  | "truck"
  | "hard-hat"
  | "camera"
  | "car"
  | "sprout"
  | "cpu"
  | "party"
  | "wrench"
  | "arrow-up-right"
  | "check"
  | "heart"
  | "quote";

export type StatKey = "listings" | "rating" | "categories" | "savings";

export type CtaLink = {
  label: string;
  href: string;
};

export const siteContent = {
  announcement: {
    text: "Verified owners, flexible rentals, secure checkout — everything you need to get started.",
    linkLabel: "See how it works",
    href: "/#how-it-works",
  },
  navigation: [
    { label: "Home", href: "/" },
    { label: "All equipment", href: "/equipment" },
    { label: "Categories", href: "/#categories" },
    { label: "How it works", href: "/#how-it-works" },
    { label: "Community", href: "/#reviews" },
    { label: "FAQ", href: "/#faq" },
  ],
  header: {
    backToHome: "Back to home",
    dashboard: "Dashboard",
    dashboardSuffix: "dashboard",
    signOut: "Sign out",
    signIn: "Sign in",
    getStarted: "Get started",
    openMenu: "Open menu",
    mobileDescription: "Find the right gear for your next project.",
    roles: {
      admin: "Admin",
      owner: "Owner",
      customer: "User",
    },
  },
  hero: {
    eyebrow: "GOOD GEAR. BETTER PROJECTS.",
    titleLead: "Rent the right gear.",
    titleAccent: "Build what's next.",
    description:
      "From a weekend shoot to a full-scale build, find quality equipment from verified owners near you and get straight to making.",
    primaryCta: { label: "Explore equipment", href: "/equipment" },
    secondaryCta: { label: "How it works", href: "/#how-it-works" },
    chips: ["No hidden fees", "Verified owners", "Flexible periods"],
    proofTitle: "Made for doers.",
    proofSubtitle: "Trusted by a growing community of makers.",
    avatars: ["R", "M", "A", "S", "+"],
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=90",
    imageAlt: "Construction equipment ready for a new project",
    location: "Dhaka & beyond",
    floatingTitle: "Borrow good things.",
    floatingSubtitle: "Give your next idea a go.",
    captionLabel: "01",
    caption: "The right tool changes everything.",
  },
  stats: [
    {
      key: "listings" as const,
      icon: "package" as IconKey,
      prefix: "",
      suffix: "+",
      label: "ready-to-rent finds",
      tone: "from-[#3a6a45] to-[#7ba356]",
    },
    {
      key: "rating" as const,
      icon: "star" as IconKey,
      prefix: "",
      suffix: "/5",
      label: "average renter rating",
      tone: "from-[#6f8f4c] to-[#a7b765]",
    },
    {
      key: "categories" as const,
      icon: "layers" as IconKey,
      prefix: "",
      suffix: "",
      label: "equipment categories",
      tone: "from-[#4f7b4e] to-[#6d9189]",
    },
    {
      key: "savings" as const,
      icon: "leaf" as IconKey,
      prefix: "",
      suffix: "",
      label: "rental savings tracked",
      tone: "from-[#315c3c] to-[#7ba356]",
    },
  ],
  categories: {
    eyebrow: "A PLACE FOR EVERY PROJECT",
    title: "What are you looking for?",
    description:
      "From a one-day fix to a big-time build, find what you need from people around you.",
    ctaLabel: "Browse all equipment",
  },
  featured: {
    eyebrow: "GOOD FINDS, CLOSE BY",
    title: "A few things worth borrowing.",
    description: "Six approved equipment finds from verified owners, ready for your next project.",
    ctaLabel: "Browse all equipment",
    emptyTitle: "Fresh finds are on the way.",
    emptyDescription: "Approved listings will show up here as soon as they are live.",
  },
  why: {
    eyebrow: "A BETTER WAY TO GET THINGS DONE",
    titleLead: "More doing.",
    titleAccent: "Less owning.",
    description:
      "Great equipment shouldn't sit idle, and good ideas shouldn't wait. We make it easier for neighbors to share the things that help them get things done.",
    image:
      "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1400&q=85",
    imageAlt: "A well-organized collection of tools",
    photoLabel: "FIELD NOTES / 001",
    photoTitle: "Less owning. More doing.",
    stamp: "USE AGAIN",
    benefits: [
      {
        icon: "wallet" as IconKey,
        title: "Keep more in your pocket",
        description: "Rent for a fraction of the cost of buying.",
        tone: "from-[#3a6a45] to-[#7ba356]",
      },
      {
        icon: "shield" as IconKey,
        title: "Good gear, good people",
        description: "Find quality equipment from local owners.",
        tone: "from-[#396b5c] to-[#6d9189]",
      },
      {
        icon: "clock" as IconKey,
        title: "On your own timeline",
        description: "Choose a rental period that fits your plans.",
        tone: "from-[#6f8f4c] to-[#a7b765]",
      },
      {
        icon: "leaf" as IconKey,
        title: "Better things, used more",
        description: "Share what's already here. Waste a little less.",
        tone: "from-[#315c3c] to-[#6d9189]",
      },
    ],
  },
  steps: {
    eyebrow: "NO FUSS. JUST GO.",
    title: "Three steps to getting it done.",
    description: "The right equipment is closer than you think.",
    ctaLabel: "Find your next rental",
    items: [
      {
        number: "01",
        icon: "search" as IconKey,
        title: "Find your thing",
        description: "Search equipment from local owners and compare what works for you.",
        tone: "from-[#315c3c] to-[#6d9189]",
      },
      {
        number: "02",
        icon: "calendar" as IconKey,
        title: "Make a plan",
        description: "Choose your dates, share a few details, and send a booking request.",
        tone: "from-[#4f7b4e] to-[#78a58c]",
      },
      {
        number: "03",
        icon: "truck" as IconKey,
        title: "Get out there",
        description: "Pick up your gear and get on with making something happen.",
        tone: "from-[#61733f] to-[#9aa95e]",
      },
    ],
  },
  reviews: {
    eyebrow: "GOOD WORDS FROM GOOD PEOPLE",
    title: "Projects made possible.",
    description: "A little less buying. A lot more getting things done.",
  },
  faq: {
    eyebrow: "GOOD TO KNOW",
    title: "Questions, answered.",
    description: "Everything you need to know before your first rental.",
    items: [
      {
        question: "How do I rent equipment?",
        answer:
          "Browse the catalog, pick the gear that fits your project, choose your rental period, and send a request. Once the owner confirms, you pay securely through Stripe Checkout.",
      },
      {
        question: "Do I need an account to browse?",
        answer:
          "No — anyone can explore the catalog and listing details. You only need a free account when you are ready to book, save favorites, or list your own equipment.",
      },
      {
        question: "How are owners verified?",
        answer:
          "Every listing is reviewed before it goes live. We check owner details and equipment information so you can rent with confidence.",
      },
      {
        question: "Can I list my own equipment?",
        answer:
          "Absolutely. Create an account, switch to an owner dashboard, add your equipment with photos and pricing, and start earning from gear you already own.",
      },
      {
        question: "What happens if plans change?",
        answer:
          "Rental terms are shown on every listing before you pay. Reach out to the owner through your booking to discuss changes or extensions.",
      },
    ],
  },
  cta: {
    eyebrow: "YOUR NEXT PROJECT STARTS HERE",
    titleLead: "Got a thing to do?",
    titleAccent: "We've got a thing for that.",
    description:
      "Explore trusted local gear, rent only what you need, and get back to making things happen.",
    primaryCta: { label: "Explore equipment", href: "/equipment" },
    secondaryCta: { label: "Create an account", href: "/signup" },
  },
  footer: {
    description: "Good gear has more than one life. Let's make the most of it.",
    columns: [
      {
        title: "Explore",
        links: [
          { label: "Find equipment", href: "/equipment" },
          { label: "Categories", href: "/#categories" },
          { label: "How it works", href: "/#how-it-works" },
          { label: "Community", href: "/#reviews" },
        ],
      },
      {
        title: "Account",
        links: [
          { label: "My bookings", href: "/account/rentals" },
          { label: "Favorites", href: "/account/favorites" },
          { label: "Profile", href: "/account/profile" },
          { label: "Create account", href: "/signup" },
        ],
      },
    ],
    noteLabel: "MADE FOR THE MAKERS.",
    noteLead: "Share what you have.",
    noteAccent: "Find what you need.",
    ctaLabel: "Start exploring",
    copyright: "© 2026 Fieldkit. Make good things happen.",
    signoff: "Made for a more resourceful world",
  },
} as const;
