import type { Metadata } from "next";
import { CustomerFavorites } from "../../components/customer-favorites";

export const metadata: Metadata = {
  title: "Favorites | Fieldkit",
  description: "Equipment you saved for later.",
};

export default function FavoritesPage() {
  return (
    <CustomerFavorites />
  );
}
