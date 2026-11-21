import type { Metadata } from "next";
import { CustomerDashboard } from "../../components/customer-dashboard";

export const metadata: Metadata = {
  title: "My Dashboard | Fieldkit",
  description: "Manage your rentals, saved equipment, and account profile.",
};

export default function CustomerDashboardPage() {
  return <CustomerDashboard />;
}
