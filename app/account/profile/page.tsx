import type { Metadata } from "next";
import { DashboardProfile } from "../../components/dashboard-profile";

export const metadata: Metadata = {
  title: "My Profile | Fieldkit",
  description: "Update your Fieldkit account details.",
};

export default function ProfilePage() {
  return (
    <DashboardProfile />
  );
}
