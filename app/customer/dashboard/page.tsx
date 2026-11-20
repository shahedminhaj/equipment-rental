import type { Metadata } from "next";
import { AccountDashboard } from "../../components/account-dashboard";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "My Dashboard | Fieldkit",
  description: "Manage your rentals, saved equipment, and account profile.",
};

export default function CustomerDashboardPage() {
  return (
    <>
      <SiteHeader />
      <AccountDashboard />
      <SiteFooter />
    </>
  );
}
