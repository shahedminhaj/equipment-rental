import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
  return (
    <section
      className="relative overflow-hidden rounded-3xl px-6 py-8 text-white shadow-xl sm:px-8 sm:py-10"
      style={{ background: gradient }}
    >
      <span className="pointer-events-none absolute -top-20 -right-10 size-72 rounded-full border-[30px] border-white/10" />
      <span className="pointer-events-none absolute -bottom-28 right-32 size-56 rounded-full bg-white/10" />
      <span className="pointer-events-none absolute -bottom-16 left-1/3 size-40 rounded-full border-[20px] border-white/5" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold tracking-[0.22em] text-white/75 uppercase">{eyebrow}</p>
          <h2 className="mt-2 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">{description}</p>
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
  return (
    <Card className="relative overflow-hidden rounded-2xl border-slate-200/80 bg-white shadow-[0_12px_30px_-22px_rgba(15,23,42,0.5)]">
      <span
        className="pointer-events-none absolute -top-10 -right-10 size-28 rounded-full"
        style={{ background: soft }}
      />
      <CardContent className="relative p-5">
        <div className="flex items-start justify-between">
          <span
            className="grid size-11 place-items-center rounded-xl text-white shadow-md"
            style={{ background: gradient }}
          >
            <Icon size={19} aria-hidden="true" />
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-400">
            LIVE
          </span>
        </div>
        <p className="mt-4 text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
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
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)]",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-3">
          {Icon ? (
            <span
              className="grid size-9 place-items-center rounded-xl"
              style={{ background: soft, color: accent }}
            >
              <Icon size={17} aria-hidden="true" />
            </span>
          ) : null}
          <div>
            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
          </div>
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
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
  const maximum = Math.max(1, ...items.map((item) => item.value));

  if (items.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">No data available yet.</p>;
  }

  return (
    <div className="flex h-52 items-end gap-2 overflow-x-auto pb-1">
      {items.map((item) => {
        const height = item.value > 0 ? Math.max((item.value / maximum) * 100, 5) : 2;
        const value = formatValue ? formatValue(item.value) : new Intl.NumberFormat("en-BD").format(item.value);
        return (
          <div className="group flex min-w-9 flex-1 flex-col items-center gap-2" key={item.label} title={`${item.label}: ${value}`}>
            <span className="text-[9px] font-semibold text-slate-400 opacity-0 transition-opacity group-hover:opacity-100">
              {value}
            </span>
            <div className="flex h-36 w-full items-end rounded-lg bg-slate-50">
              <div
                className="w-full rounded-lg transition-all duration-500 group-hover:brightness-110"
                style={{
                  height: `${height}%`,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}99 100%)`,
                }}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-400">{item.label}</span>
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
    <Badge className={cn("gap-1.5 capitalize", className)} variant="secondary">
      <span className="size-1.5 rounded-full bg-current" />
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
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PanelLoading({ label = "Loading data..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-8 text-sm text-slate-500" role="status">
      <span className="size-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      {label}
    </div>
  );
}

export function PanelError({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
      {message}
    </p>
  );
}
