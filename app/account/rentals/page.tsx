import type { Metadata } from "next";
import { AccountDashboard } from "../../components/account-dashboard";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "My Rentals | Fieldkit",
  description: "Review all of your equipment rental bookings.",
};

export default function MyRentalsPage() {
  return (
    <>
      <SiteHeader />
      <AccountDashboard initialView="rentals" />
      <SiteFooter />
    </>
  );
}
