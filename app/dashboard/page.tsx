import type { Metadata } from "next";
import { DashboardRedirect } from "../components/dashboard-redirect";

export const metadata: Metadata = {
  title: "Dashboard | Fieldkit",
  description: "Redirecting to the dashboard for your account role.",
};

export default function DashboardPage() {
  return <DashboardRedirect />;
}
