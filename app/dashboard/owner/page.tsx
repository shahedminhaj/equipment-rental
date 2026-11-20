import type { Metadata } from "next";
import { ManagementDashboard } from "../../components/management-dashboard";

export const metadata: Metadata = {
  title: "Owner Dashboard | Fieldkit",
  description: "Manage your equipment listings, bookings, and rental earnings.",
};

export default function DashboardOwnerPage() {
  return <ManagementDashboard expectedRole="owner" />;
}
