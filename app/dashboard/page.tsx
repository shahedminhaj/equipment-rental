import type { Metadata } from "next";
import { DashboardRedirect } from "../components/dashboard-redirect";

export const metadata: Metadata = {
  title: "Dashboard | Fieldkit",
  description: "Explore the responsive Fieldkit dashboard layout for customers, owners, and admins.",
};

export default function DashboardPage() {
  return <DashboardRedirect />;
}
