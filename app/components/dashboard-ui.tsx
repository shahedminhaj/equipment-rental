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
        "relative isolate overflow-hidden rounded-3xl px-6 py-8 text-white shadow-xl shadow-[#17241b]/10 sm:px-8 sm:py-10",
        "bg-linear-to-r",
        tone.banner,
      )}
    >
      <span className="pointer-events-none absolute -top-20 -right-10 size-72 rounded-full border-[30px] border-white/10" />
      <span className="pointer-events-none absolute -bottom-28 right-32 size-56 rounded-full bg-[#d9ef94]/10" />
      <span
        className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full opacity-20 blur-3xl"
        style={{ background: gradient }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <Badge
            variant="outline"
            className="h-auto rounded-full border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-white uppercase"
          >
            {eyebrow}
          </Badge>
          <h2 className="mt-3 text-2xl leading-tight font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
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
  icon: LucideIcon | typeof TakaSign;
  gradient: string;
  soft: string;
}) {
  return (
    <Card
      className={cn(
        appSurfaces.card,
        "relative gap-0 overflow-hidden py-0 ring-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5",
      )}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1 rounded-t-2xl"
        style={{ background: gradient }}
        aria-hidden="true"
      />
      <span
        className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full opacity-60"
        style={{ background: soft }}
        aria-hidden="true"
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <span
            className="grid size-11 place-items-center rounded-xl text-white shadow-md"
            style={{ background: gradient }}
          >
            <Icon size={19} aria-hidden={true} />
          </span>
          <Badge
            variant="secondary"
            className="h-auto rounded-full border-transparent bg-[#f1f4ee] px-2 py-1 text-[10px] font-semibold tracking-wide text-[#6d786d]"
          >
            LIVE
          </Badge>
        </div>
        <p className={cn(appSurfaces.eyebrow, "mt-4")}>{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-[#17241b]">{value}</p>
        {hint ? <p className="mt-1 text-xs leading-relaxed text-[#6d786d]">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export function TakaSign({
  size = 19,
  className,
  "aria-hidden": ariaHidden = true,
}: {
  size?: number | string;
  className?: string;
  "aria-hidden"?: boolean;
}) {
  return (
    <span
      className={cn("inline-flex items-center justify-center font-extrabold leading-none", className)}
      style={{ fontSize: size, fontFamily: "Arial, sans-serif" }}
      aria-hidden={ariaHidden}
    >
      {"\u09F3"}
    </span>
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
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-0.5 rounded-t-2xl bg-linear-to-r", tone.panelAccent)}
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2ebdc] bg-linear-to-r from-[#edf5e8] via-[#f4f7ed] to-[#eef5f0] px-5 py-4">
        <div className="flex items-center gap-3">
          {Icon ? (
            <span
              className={cn("grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-[#17241b]/5", tone.iconTile)}
            >
              <Icon size={17} aria-hidden="true" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#17241b]">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs leading-relaxed text-[#6d786d]">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="bg-linear-to-br from-white via-white to-[#f4f8ef] p-5 text-[#5c675c]">{children}</div>
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
            <span className="text-[9px] font-semibold text-[#6d786d] opacity-0 transition-opacity group-hover:opacity-100">
              {value}
            </span>
            <div className="flex h-36 w-full items-end rounded-lg bg-[#f1f4ee]">
              <div
                className={cn(
                  "w-full rounded-lg transition-all duration-500 group-hover:brightness-105",
                  "bg-linear-to-t",
                  tone.bar,
                )}
                style={{ height: `${height}%` }}
                aria-hidden="true"
              />
            </div>
            <span className="text-[10px] font-medium text-[#6d786d]">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function StatusPill({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  let className = "bg-[#f1f4ee] text-[#526052]";

  if (["paid", "approved", "confirmed", "active", "completed", "available"].includes(normalized)) {
    className = "bg-[#edf5e8] text-[#315c3c] ring-1 ring-[#dce7cd]";
  } else if (["pending", "review", "processing", "waiting"].includes(normalized)) {
    className = "bg-[#fff6e6] text-[#8a6323] ring-1 ring-[#f0ddb8]";
  } else if (["rejected", "disabled", "failed", "cancelled", "canceled"].includes(normalized)) {
    className = "bg-[#fdeceb] text-[#9a3f37] ring-1 ring-[#f3d1cd]";
  } else if (["admin", "owner"].includes(normalized)) {
    className = "bg-[#edf3e2] text-[#315c3c] ring-1 ring-[#dce7cd]";
  } else if (normalized === "customer") {
    className = "bg-[#e9f2ea] text-[#33614e] ring-1 ring-[#d5e5d9]";
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
        "flex flex-col items-center justify-center border-dashed bg-[#fbfcf8] px-4 py-10 text-center",
      )}
    >
      <span
        className={cn("grid size-12 place-items-center rounded-2xl shadow-sm ring-1 ring-[#dfe6d8]", tone.iconTile)}
      >
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-[#17241b]">{title}</h3>
      <p className={cn(appSurfaces.body, "mt-1 max-w-sm text-xs")}>{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PanelLoading({ label = "Loading data..." }: { label?: string }) {
  const tone = useAppTone();

  return (
    <div className="flex flex-col gap-3 py-6" role="status">
      <div className="flex items-center gap-3 text-sm text-[#5c675c]">
        <span
          className="size-4 shrink-0 animate-spin rounded-full border-2 border-[#dfe6d8] border-t-[#315c3c]"
          aria-hidden="true"
        />
        <span className={cn("font-medium", tone.accentText)}>{label}</span>
      </div>
      <Skeleton className="h-3 w-2/3 rounded-full bg-[#edf1e9]" />
      <Skeleton className="h-3 w-1/2 rounded-full bg-[#edf1e9]" />
    </div>
  );
}

export function PanelError({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl border border-[#f0d6d3] bg-[#fff7f6] px-4 py-3 text-sm leading-relaxed text-[#9a3f37]"
      role="alert"
    >
      <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
