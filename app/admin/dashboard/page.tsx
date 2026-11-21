import type { Metadata } from "next";
import { AdminDashboard } from "../../components/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard | Fieldkit",
  description: "Review listings, manage users, and track Fieldkit marketplace activity.",
};

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
