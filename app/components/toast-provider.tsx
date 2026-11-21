"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { publicTone } from "../data/app-theme";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind };

type ToastContextValue = {
  notify: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<
  ToastKind,
  { bar: string; tile: string; icon: string; ring: string }
> = {
  success: {
    bar: "from-emerald-500 via-teal-500 to-sky-500",
    tile: "bg-emerald-50 text-emerald-700",
    icon: "text-emerald-600",
    ring: "ring-emerald-100",
  },
  error: {
    bar: "from-rose-500 via-fuchsia-500 to-violet-600",
    tile: "bg-rose-50 text-rose-700",
    icon: "text-rose-600",
    ring: "ring-rose-100",
  },
  info: {
    bar: publicTone.gradient,
    tile: publicTone.iconTile,
    icon: publicTone.accentText,
    ring: "ring-violet-100",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((message: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, kind }].slice(-4));
    window.setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed right-4 bottom-4 z-[200] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3 sm:right-6 sm:bottom-6"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const styles = toastStyles[toast.kind];
          return (
            <div
              className={cn(
                "pointer-events-auto relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 pl-5 pr-3 text-slate-900",
                "shadow-[0_18px_45px_-24px_rgba(15,23,42,0.45)] ring-1 ring-slate-900/5",
                "animate-in fade-in slide-in-from-bottom-2 duration-200",
              )}
              key={toast.id}
            >
              <span
                aria-hidden="true"
                className={cn("absolute inset-y-0 left-0 w-1 bg-linear-to-b", styles.bar)}
              />
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-xl ring-1",
                    styles.tile,
                    styles.ring,
                  )}
                >
                  {toast.kind === "success" ? (
                    <CheckCircle2 size={18} className={styles.icon} />
                  ) : toast.kind === "error" ? (
                    <TriangleAlert size={18} className={styles.icon} />
                  ) : (
                    <Info size={18} className={styles.icon} />
                  )}
                </span>
                <span className="flex-1 text-sm leading-relaxed text-slate-700">
                  {toast.message}
                </span>
                <button
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                  type="button"
                  aria-label="Dismiss notification"
                  onClick={() => dismiss(toast.id)}
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
