"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
        className={buttonVariants({
          variant: "outline",
          className: "w-full gap-2 rounded-full border-[#dfe6d8] bg-[#f3f7ee]/80 text-[#315c3c] hover:bg-[#e8efdc] hover:text-[#27492f]",
        })}
        href={`/login?next=${encodeURIComponent(`/equipment/${equipmentId}`)}`}
      >
        <Heart className="size-4" aria-hidden="true" />
        Sign in to save this equipment
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
    <Button
      type="button"
      disabled={isBusy}
      onClick={toggleFavorite}
      aria-pressed={isFavorite}
      variant={isFavorite ? "default" : "outline"}
      className={cn(
        "w-full gap-2 rounded-full",
        isFavorite
          ? "bg-linear-to-r from-[#315c3c] to-[#6f8f4c] text-white hover:from-[#3a6a45] hover:to-[#7ba356]"
          : "border-[#dfe6d8] bg-white text-[#315c3c] hover:bg-[#edf3e2] hover:text-[#27492f]",
      )}
    >
      <Heart className="size-4" fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
      {isBusy ? "Saving..." : isFavorite ? "Saved to favorites" : "Add to favorites"}
    </Button>
  );
}
