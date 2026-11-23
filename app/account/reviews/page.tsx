import type { Metadata } from "next";
import { CustomerReviews } from "../../components/customer-reviews";

export const metadata: Metadata = {
  title: "Reviews | Fieldkit",
  description: "Rate and review equipment from your completed rentals.",
};

export default function ReviewsPage() {
  return <CustomerReviews />;
}
