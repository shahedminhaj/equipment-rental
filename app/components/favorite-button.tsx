"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { apiRequest } from "../lib/api";
import { useToast } from "./toast-provider";

type FavoriteItem = { equipment?: { id?: string } };

export function FavoriteButton({ equipmentId }: { equipmentId: string }) {
  const [token, setToken] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    let active = true;
    const savedToken = window.localStorage.getItem("fieldkit_token") || "";
    setToken(savedToken);
    if (!savedToken) return;
    apiRequest<{ items: FavoriteItem[] }>("/favorites", {
      headers: { Authorization: `Bearer ${savedToken}` },
    })
      .then((response) => {
        if (active) {
          setIsFavorite(response.items.some((item) => item.equipment?.id === equipmentId));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [equipmentId]);

  if (!token) {
    return (
      <Link
        className="favorite-button"
        href={`/login?next=${encodeURIComponent(`/equipment/${equipmentId}`)}`}
      >
        <Heart size={17} aria-hidden="true" /> Sign in to save this equipment
      </Link>
    );
  }

  async function toggleFavorite() {
    setIsBusy(true);
    try {
      if (isFavorite) {
        await apiRequest(`/favorites/${equipmentId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorite(false);
        notify("Removed from your favorites.");
      } else {
        await apiRequest(`/favorites/${equipmentId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFavorite(true);
        notify("Saved to your favorites.");
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update favorites", "error");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <button
      className={`favorite-button${isFavorite ? " is-active" : ""}`}
      type="button"
      disabled={isBusy}
      onClick={toggleFavorite}
      aria-pressed={isFavorite}
    >
      <Heart size={17} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
      {isBusy ? "Saving..." : isFavorite ? "Saved to favorites" : "Add to favorites"}
    </button>
  );
}
