import type { Metadata } from "next";
import { AccountDashboard } from "../components/account-dashboard";
import { SiteFooter, SiteHeader } from "../components/site-shell";

export const metadata: Metadata = {
  title: "My Account | Fieldkit",
  description: "Manage your Fieldkit profile and view your equipment bookings.",
};

export default function AccountPage() {
  return (
    <>
      <SiteHeader />
      <AccountDashboard key="overview" />
      <SiteFooter />
    </>
  );
}
