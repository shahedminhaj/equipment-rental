import type { Metadata } from "next";
import { AccountDashboard } from "../../components/account-dashboard";
import { SiteFooter, SiteHeader } from "../../components/site-shell";

export const metadata: Metadata = {
  title: "My Profile | Fieldkit",
  description: "Update your Fieldkit account details.",
};

export default function ProfilePage() {
  return (
    <>
      <SiteHeader />
      <AccountDashboard initialView="profile" />
      <SiteFooter />
    </>
  );
}
