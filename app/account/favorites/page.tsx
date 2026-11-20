import type { Metadata } from "next";
import { AccountDashboard } from "../../components/account-dashboard";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "Favorites | Fieldkit",
  description: "Equipment you saved for later.",
};

export default function FavoritesPage() {
  return (
    <>
      <SiteHeader />
      <AccountDashboard initialView="favorites" />
      <SiteFooter />
    </>
  );
}
