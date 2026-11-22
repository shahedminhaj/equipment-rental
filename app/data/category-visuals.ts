import type { IconKey } from "./site-content";

export type CategoryVisual = {
  image: string;
  icon: IconKey;
  gradient: string;
  soft: string;
};

const fallbackVisual: CategoryVisual = {
  image:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=85",
  icon: "wrench",
  gradient: "from-slate-800 to-slate-600",
  soft: "from-slate-500 to-slate-400",
};

const visualRules: { match: string[]; visual: CategoryVisual }[] = [
  {
    match: ["construction", "build", "tool"],
    visual: {
      image:
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=85",
      icon: "hard-hat",
      gradient: "from-orange-500 to-amber-400",
      soft: "from-orange-500 to-amber-400",
    },
  },
  {
    match: ["photo", "camera", "video", "drone"],
    visual: {
      image:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=85",
      icon: "camera",
      gradient: "from-[#5b8249] to-[#315c3c]",
      soft: "from-[#7ba356] to-[#4c6d45]",
    },
  },
  {
    match: ["vehicle", "transport", "car", "truck"],
    visual: {
      image:
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85",
      icon: "car",
      gradient: "from-sky-500 to-blue-600",
      soft: "from-sky-500 to-cyan-500",
    },
  },
  {
    match: ["agri", "farm", "garden", "lawn", "tractor"],
    visual: {
      image:
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=85",
      icon: "sprout",
      gradient: "from-emerald-500 to-green-600",
      soft: "from-emerald-500 to-lime-500",
    },
  },
  {
    match: ["electronic", "tech", "computer", "generator", "audio"],
    visual: {
      image:
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=85",
      icon: "cpu",
      gradient: "from-indigo-500 to-sky-500",
      soft: "from-indigo-500 to-blue-500",
    },
  },
  {
    match: ["event", "party", "light", "sound"],
    visual: {
      image:
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=85",
      icon: "party",
      gradient: "from-rose-500 to-pink-500",
      soft: "from-[#b45247] to-[#7ba356]",
    },
  },
];

export function getCategoryVisual(name: string, index: number): CategoryVisual {
  const normalized = name.toLowerCase();

  for (const rule of visualRules) {
    if (rule.match.some((keyword) => normalized.includes(keyword))) {
      return rule.visual;
    }
  }

  // Cycle through known visuals for unknown categories so the grid stays colorful.
  return visualRules[index % visualRules.length]?.visual ?? fallbackVisual;
}
