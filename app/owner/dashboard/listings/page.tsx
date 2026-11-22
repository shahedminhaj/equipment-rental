import { OwnerDashboard } from "../../../components/owner-dashboard";

export const metadata = { title: "My Equipment Listings | Fieldkit" };

export default function OwnerListingsPage() {
  return <OwnerDashboard section="listings" />;
}
