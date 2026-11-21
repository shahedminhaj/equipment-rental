"use client";

import { createContext, useContext, type ReactNode } from "react";
import { TriangleAlert, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { appSurfaces, roleTones, type AppTone } from "../data/app-theme";

/**
 * Dashboard pages pass their role to DashboardShell, which shares the matching
 * token set with these presentation components through context. The default
 * keeps isolated renders (stories/tests) on a coherent tone.
 */
const AppToneContext = createContext<AppTone>(roleTones.admin);

export function AppToneProvider({ tone, children }: { tone: AppTone; children: ReactNode }) {
  return <AppToneContext.Provider value={tone}>{children}</AppToneContext.Provider>;
}

function useAppTone() {
  return useContext(AppToneContext);
}

export function HeroBanner({
  eyebrow,
  title,
  description,
  action,
  gradient,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  gradient: string;
}) {
  const tone = useAppTone();

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-3xl px-6 py-8 text-white shadow-xl shadow-slate-900/10 sm:px-8 sm:py-10",
        "bg-linear-to-r",
        tone.banner,
      )}
    >
      <span className="pointer-events-none absolute -top-20 -right-10 size-72 rounded-full border-[30px] border-white/10" />
      <span className="pointer-events-none absolute -bottom-28 right-32 size-56 rounded-full bg-white/10" />
      <span
        className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full opacity-25 blur-3xl"
        style={{ background: gradient }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <Badge
            variant="outline"
            className="h-auto rounded-full border-white/25 bg-white/15 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-white uppercase"
          >
            {eyebrow}
          </Badge>
          <h2 className="mt-3 text-2xl leading-tight font-bold tracking-tight [text-shadow:0_1px_2px_rgba(15,23,42,0.25)] sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/90 [text-shadow:0_1px_2px_rgba(15,23,42,0.2)]">
            {description}
          </p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  gradient,
  soft,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon: LucideIcon;
  gradient: string;
  soft: string;
}) {
  const tone = useAppTone();

  return (
    <Card
      className={cn(
        appSurfaces.card,
        "relative gap-0 py-0 ring-0 transition-transform duration-200 hover:-translate-y-0.5",
      )}
    >
      <span
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r", tone.panelAccent)}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-70"
        style={{ background: soft }}
        aria-hidden="true"
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <span
            className="grid size-11 place-items-center rounded-xl text-white shadow-md"
            style={{ background: gradient }}
          >
            <Icon size={19} aria-hidden="true" />
          </span>
          <Badge
            variant="secondary"
            className="h-auto rounded-full border-transparent bg-slate-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-400"
          >
            LIVE
          </Badge>
        </div>
        <p className={cn(appSurfaces.eyebrow, "mt-4")}>{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {hint ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function Panel({
  id,
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className,
  soft,
  accent,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  soft: string;
  accent: string;
}) {
  const tone = useAppTone();

  return (
    <section id={id} className={cn(appSurfaces.card, "relative scroll-mt-24", className)}>
      <span
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-t-3xl bg-linear-to-r", tone.panelAccent)}
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          {Icon ? (
            <span
              className={cn("grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-slate-900/5", tone.iconTile)}
            >
              <Icon size={17} aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5 text-slate-600">{children}</div>
    </section>
  );
}

export function MiniBars({
  items,
  color,
  formatValue,
}: {
  items: { label: string; value: number }[];
  color: string;
  formatValue?: (value: number) => string;
}) {
  const tone = useAppTone();
  const maximum = Math.max(1, ...items.map((item) => item.value));

  if (items.length === 0) {
    return <p className={cn(appSurfaces.body, "py-10 text-center")}>No data available yet.</p>;
  }

  return (
    <div className="flex h-52 items-end gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const height = item.value > 0 ? Math.max((item.value / maximum) * 100, 5) : 2;
        const value = formatValue ? formatValue(item.value) : new Intl.NumberFormat("en-BD").format(item.value);
        return (
          <div
            className="group flex min-w-9 flex-1 flex-col items-center gap-2"
            key={item.label}
            title={`${item.label}: ${value}`}
          >
            <span className="text-[9px] font-semibold text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
              {value}
            </span>
            <div className="flex h-36 w-full items-end rounded-lg bg-slate-50">
              <div
                className={cn(
                  "w-full rounded-lg transition-all duration-500 group-hover:brightness-110",
                  "bg-linear-to-b",
                  tone.bar,
                )}
                style={{ height: `${height}%` }}
                aria-hidden="true"
              />
            </div>
            <span className="text-[10px] font-medium text-slate-500">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  let className = "bg-slate-100 text-slate-600";

  if (["paid", "approved", "confirmed", "active", "completed", "available"].includes(normalized)) {
    className = "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  } else if (["pending", "review", "processing", "waiting"].includes(normalized)) {
    className = "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  } else if (["rejected", "disabled", "failed", "cancelled", "canceled"].includes(normalized)) {
    className = "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  } else if (["admin", "owner"].includes(normalized)) {
    className = "bg-violet-50 text-violet-700 ring-1 ring-violet-200";
  } else if (normalized === "customer") {
    className = "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  }

  return (
    <Badge variant="secondary" className={cn("h-auto gap-1.5 border-transparent capitalize", className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {value}
    </Badge>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const tone = useAppTone();

  return (
    <div
      className={cn(
        appSurfaces.softCard,
        "flex flex-col items-center justify-center border-dashed bg-slate-50/60 px-4 py-10 text-center",
      )}
    >
      <span
        className={cn("grid size-12 place-items-center rounded-2xl shadow-sm ring-1 ring-slate-200", tone.iconTile)}
      >
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
      <p className={cn(appSurfaces.body, "mt-1 max-w-sm text-xs")}>{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PanelLoading({ label = "Loading data..." }: { label?: string }) {
  const tone = useAppTone();

  return (
    <div className="flex flex-col gap-3 py-6" role="status">
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700"
          aria-hidden="true"
        />
        <span className={cn("font-medium", tone.accentText)}>{label}</span>
      </div>
      <Skeleton className="h-3 w-2/3 rounded-full bg-slate-100" />
      <Skeleton className="h-3 w-1/2 rounded-full bg-slate-100" />
    </div>
  );
}

export function PanelError({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50/80 px-4 py-3 text-sm leading-relaxed text-rose-700"
      role="alert"
    >
      <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
