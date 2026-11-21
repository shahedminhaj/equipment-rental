import type { Metadata } from "next";
import { DashboardRedirect } from "../../components/dashboard-redirect";

export const metadata: Metadata = {
  title: "Owner Dashboard | Fieldkit",
  description: "Manage your equipment listings, bookings, and rental earnings.",
};

export default function DashboardOwnerPage() {
  return <DashboardRedirect role="owner" />;
}
