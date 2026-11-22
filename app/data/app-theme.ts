/**
 * Shared visual language for authenticated and transactional pages.
 *
 * Fieldkit uses one calm palette everywhere: deep ink surfaces, warm paper
 * backgrounds, and olive/lime accents. Role tones only shift the accent hue
 * slightly — they never introduce a competing gradient or sidebar color.
 */

export type AppRoleTone = "admin" | "owner" | "customer";

export type AppTone = {
  /** Full-strength accent gradient for compact decorative areas. */
  gradient: string;
  /** Sidebar surface; dark enough for white text. */
  sidebar: string;
  /** Hero/banner surface; never used behind long body copy. */
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

const baseTone = {
  sidebar: "from-[#1b3224] via-[#17241b] to-[#101b15]",
  panelAccent: "from-[#4c6d45] via-[#7ba356] to-[#d9ef94]",
} satisfies Pick<AppTone, "sidebar" | "panelAccent">;

export const roleTones: Record<AppRoleTone, AppTone> = {
  admin: {
    ...baseTone,
    gradient: "from-[#315c3c] to-[#6f8f4c]",
    banner: "from-[#1b3224] via-[#2b4b34] to-[#3f6b4a]",
    softBadge: "bg-[#edf3e2] text-[#315c3c] ring-[#dce7cd]",
    iconTile: "bg-[#edf3e2] text-[#315c3c]",
    accentText: "text-[#315c3c]",
    bar: "from-[#4f7b4e] to-[#7ba356]",
  },
  owner: {
    ...baseTone,
    gradient: "from-[#4b6337] to-[#9aa95e]",
    banner: "from-[#1b3224] via-[#354a2c] to-[#61733f]",
    softBadge: "bg-[#f1f4e3] text-[#55612f] ring-[#e2e8ce]",
    iconTile: "bg-[#f1f4e3] text-[#55612f]",
    accentText: "text-[#55612f]",
    bar: "from-[#61733f] to-[#a7b765]",
  },
  customer: {
    ...baseTone,
    gradient: "from-[#315c3c] to-[#6d9189]",
    banner: "from-[#1b3224] via-[#294a39] to-[#396b5c]",
    softBadge: "bg-[#e9f2ea] text-[#33614e] ring-[#d5e5d9]",
    iconTile: "bg-[#e9f2ea] text-[#33614e]",
    accentText: "text-[#33614e]",
    bar: "from-[#3f7b62] to-[#78a58c]",
  },
};

/** Neutral accents for public pages such as catalog, auth and checkout. */
export const publicTone: AppTone = roleTones.admin;

/** Reusable surface recipes. Text always stays high contrast on light paper. */
export const appSurfaces = {
  page: "min-h-screen bg-[#edf3e9] text-[#17241b]",
  pageGlow:
    "pointer-events-none absolute -top-40 left-1/4 size-[28rem] rounded-full bg-[#b8d997]/30 blur-[120px]",
  card: "rounded-2xl border border-[#dce6d7] bg-[#fffefa] shadow-[0_18px_45px_-36px_rgba(23,36,27,0.55)]",
  softCard: "rounded-xl border border-[#dce6d7] bg-[#f5f8ef]",
  eyebrow: "text-[10px] font-bold tracking-[0.16em] text-[#4c6d45] uppercase",
  body: "text-sm leading-relaxed text-[#5c675c]",
  link: "font-semibold text-[#315c3c] transition-colors hover:text-[#4c6d45]",
  divider: "border-[#e0e6da]",
} as const;
