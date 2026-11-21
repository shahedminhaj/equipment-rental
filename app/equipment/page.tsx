import type { Metadata } from "next";
import { EquipmentPageView } from "../components/equipment-page-view";

export const metadata: Metadata = {
  title: "Browse Equipment | Fieldkit",
  description:
    "Search live approved equipment listings by name, location, category, rental period, price, and availability.",
};

export default function EquipmentPage() {
  return <EquipmentPageView />;
}
