import type { Metadata } from "next";
import { OwnerDashboard } from "../../components/owner-dashboard";

export const metadata: Metadata = {
  title: "Owner Dashboard | Fieldkit",
  description: "Manage your equipment listings, bookings, and rental earnings.",
};

export default function OwnerDashboardPage() {
  return <OwnerDashboard />;
}
