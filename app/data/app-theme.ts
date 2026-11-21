/**
 * Shared visual language for authenticated and transactional pages.
 *
 * The landing page uses vivid gradients in small, deliberate accents while
 * keeping body copy on high-contrast light surfaces. These tokens let every
 * app screen follow the same rule without burying text under color.
 */

export type AppRoleTone = "admin" | "owner" | "customer";

export type AppTone = {
  /** Full-strength gradient for compact decorative areas. */
  gradient: string;
  /** Sidebar surface; dark enough for white text. */
  sidebar: string;
  /** Hero/banner gradient; never used behind long body copy. */
  banner: string;
  /** Soft tinted badge: dark text on a very light background. */
  softBadge: string;
  /** Small icon tile with a readable foreground. */
  iconTile: string;
  /** Accent color for small labels and links on white. */
  accentText: string;
  /** Bar-chart fill. */
  bar: string;
  /** Subtle top border accent for panels. */
  panelAccent: string;
};

export const roleTones: Record<AppRoleTone, AppTone> = {
  admin: {
    gradient: "from-violet-600 via-fuchsia-600 to-rose-500",
    sidebar: "from-[#1e1b4b] via-[#312e81] to-[#0f172a]",
    banner: "from-violet-600 via-purple-600 to-fuchsia-500",
    softBadge: "bg-violet-50 text-violet-700 ring-violet-100",
    iconTile: "bg-violet-100 text-violet-700",
    accentText: "text-violet-700",
    bar: "from-violet-500 to-fuchsia-500",
    panelAccent: "from-violet-500 via-fuchsia-500 to-rose-500",
  },
  owner: {
    gradient: "from-amber-500 via-orange-500 to-rose-500",
    sidebar: "from-[#431407] via-[#7c2d12] to-[#1c1917]",
    banner: "from-amber-500 via-orange-500 to-rose-500",
    softBadge: "bg-amber-50 text-amber-800 ring-amber-100",
    iconTile: "bg-amber-100 text-amber-700",
    accentText: "text-amber-700",
    bar: "from-amber-400 to-orange-500",
    panelAccent: "from-amber-400 via-orange-500 to-rose-500",
  },
  customer: {
    gradient: "from-emerald-500 via-teal-500 to-sky-500",
    sidebar: "from-[#052e2b] via-[#065f46] to-[#0f172a]",
    banner: "from-teal-500 via-emerald-500 to-lime-500",
    softBadge: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    iconTile: "bg-emerald-100 text-emerald-700",
    accentText: "text-emerald-700",
    bar: "from-emerald-400 to-teal-500",
    panelAccent: "from-emerald-400 via-teal-500 to-sky-500",
  },
};

/** Neutral accents for public pages such as catalog, auth and checkout. */
export const publicTone: AppTone = {
  gradient: "from-violet-600 via-fuchsia-600 to-rose-500",
  sidebar: "from-slate-900 via-violet-950 to-slate-950",
  banner: "from-violet-600 via-fuchsia-600 to-rose-500",
  softBadge: "bg-violet-50 text-violet-700 ring-violet-100",
  iconTile: "bg-violet-100 text-violet-700",
  accentText: "text-violet-700",
  bar: "from-violet-500 to-fuchsia-500",
  panelAccent: "from-violet-500 via-fuchsia-500 to-rose-500",
};

/** Reusable surface recipes. Text always remains slate-900 / slate-600. */
export const appSurfaces = {
  page: "min-h-screen bg-[#f8fafc] text-slate-900",
  pageGlow:
    "pointer-events-none absolute -top-40 left-1/4 size-[28rem] rounded-full bg-violet-200/50 blur-[120px]",
  card: "rounded-3xl border border-slate-200/80 bg-white/95 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.5)] backdrop-blur-sm",
  softCard: "rounded-2xl border border-slate-200/70 bg-white/80",
  eyebrow: "text-[10px] font-bold tracking-[0.18em] text-slate-400 uppercase",
  body: "text-sm leading-relaxed text-slate-600",
  link: "font-semibold text-violet-700 transition-colors hover:text-fuchsia-700",
  divider: "border-slate-200/80",
} as const;
