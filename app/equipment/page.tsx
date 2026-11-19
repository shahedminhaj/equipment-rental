import type { Metadata } from "next";
import { EquipmentBrowser } from "../components/equipment-browser";
import { SiteFooter, SiteHeader } from "../components/site-shell";

export const metadata: Metadata = {
  title: "Browse Equipment | Fieldkit",
  description:
    "Search live approved equipment listings by name, location, category, rental period, price, and availability.",
};

export default function EquipmentPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <EquipmentBrowser />
      </main>
      <SiteFooter />
    </>
  );
}
