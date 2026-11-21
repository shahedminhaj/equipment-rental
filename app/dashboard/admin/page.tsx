import type { Metadata } from "next";
import { DashboardRedirect } from "../../components/dashboard-redirect";

export const metadata: Metadata = {
  title: "Admin Dashboard | Fieldkit",
  description: "Review listings, manage users, and track Fieldkit marketplace activity.",
};

export default function DashboardAdminPage() {
  return <DashboardRedirect role="admin" />;
}
