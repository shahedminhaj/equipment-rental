import type { Metadata } from "next";
import { CustomerRentals } from "../../components/customer-rentals";

export const metadata: Metadata = {
  title: "My Rentals | Fieldkit",
  description: "Review all of your equipment rental bookings.",
};

export default function MyRentalsPage() {
  return <CustomerRentals />;
}
