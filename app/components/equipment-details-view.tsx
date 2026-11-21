"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { appSurfaces } from "../data/app-theme";
import { SiteFooter, SiteHeader } from "./site-shell";

/**
 * Listing details stay on the public shell so the booking and Stripe payment
 * flow is not mixed with dashboard navigation or account controls.
 */
export function EquipmentDetailsView({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader authPage />
      <main className={cn(appSurfaces.page, "relative min-h-dvh overflow-x-clip overflow-y-visible")}>{children}</main>
      <SiteFooter />
    </>
  );
}
