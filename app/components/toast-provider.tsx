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
    bar: "from-[#4f7b4e] to-[#8fb361]",
    tile: "bg-[#edf3e2] text-[#315c3c]",
    icon: "text-[#315c3c]",
    ring: "ring-[#dce7cd]",
  },
  error: {
    bar: "from-[#b45247] to-[#d17a6f]",
    tile: "bg-[#fdeceb] text-[#8f352d]",
    icon: "text-[#8f352d]",
    ring: "ring-[#f3d1cd]",
  },
  info: {
    bar: "from-[#315c3c] to-[#6d9189]",
    tile: "bg-[#e9f2ea] text-[#33614e]",
    icon: "text-[#33614e]",
    ring: "ring-[#d5e5d9]",
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
                "pointer-events-auto relative overflow-hidden rounded-2xl border border-[#e0e6da] bg-white p-4 pr-3 pl-5 text-[#17241b]",
                "shadow-[0_18px_45px_-24px_rgba(23,36,27,0.45)] ring-1 ring-[#17241b]/5",
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
                <span className="flex-1 text-sm leading-relaxed text-[#465448]">
                  {toast.message}
                </span>
                <button
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-[#6d786d] transition-colors hover:bg-[#edf3e2] hover:text-[#315c3c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6d9a62]"
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
