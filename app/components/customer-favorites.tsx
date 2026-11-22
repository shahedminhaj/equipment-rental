"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Heart, MapPin, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { appSurfaces, roleTones } from "../data/app-theme";
import { apiRequest, formatCurrency, type EquipmentListing } from "../lib/api";
import { DashboardShell } from "./dashboard-shell";
import { EmptyState, Panel } from "./dashboard-ui";
import { useToast } from "./toast-provider";
import { useDashboardSession } from "./use-dashboard-session";

type Favorite = { favoriteId: string; equipment: EquipmentListing | null };

export function CustomerFavorites() {
  const { user, token, isLoading, error, signOut, refreshSession } = useDashboardSession("customer");
  const { notify } = useToast();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(true);
  const [favoritesError, setFavoritesError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiRequest<{ items: Favorite[] }>("/favorites", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ items }) => {
        if (active) setFavorites(items);
      })
      .catch((loadError) => {
        if (active) setFavoritesError(loadError instanceof Error ? loadError.message : "Could not load favorites.");
      })
      .finally(() => {
        if (active) setIsLoadingFavorites(false);
      });
    return () => {
      active = false;
    };
  }, [token, reloadKey]);

  async function removeFavorite(equipmentId: string) {
    if (!token || busyId) return;
    setBusyId(equipmentId);
    try {
      await apiRequest(`/favorites/${equipmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites((current) => current.filter((favorite) => favorite.equipment?.id !== equipmentId));
      notify("Removed from favorites.");
    } catch (removeError) {
      notify(removeError instanceof Error ? removeError.message : "Could not remove this favorite.", "error");
    } finally {
      setBusyId("");
    }
  }

  function retryFavorites() {
    setFavoritesError("");
    setIsLoadingFavorites(true);
    setReloadKey((key) => key + 1);
    refreshSession();
  }

  const tone = roleTones.customer;

  return (
    <DashboardShell
      role="customer"
      user={user}
      title="Favorite equipment"
      description="Manage the equipment you saved for your next project."
      isLoading={isLoading || isLoadingFavorites}
      error={error || favoritesError}
      signOut={signOut}
      onRetry={retryFavorites}
    >
      <Panel
        title="Your saved equipment"
        subtitle="Open a listing or remove it from your favorites."
        icon={Heart}
        soft={tone.iconTile}
        accent={tone.panelAccent}
        action={
          <Badge variant="secondary" className={cn("h-auto rounded-full px-3 py-1", tone.softBadge)}>
            {favorites.length} saved
          </Badge>
        }
      >
        {favorites.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nothing saved yet"
            description="There are no saved items to manage yet. Browse equipment and tap the heart to save it; each saved item will appear here with View and Remove actions."
            action={
              <Link
                href="/equipment"
                className="dashboard-empty-cta inline-flex h-10 items-center gap-2 rounded-xl bg-[#315c3c] px-4 text-sm font-semibold shadow-sm transition-colors hover:bg-[#27492f]"
              >
                Explore equipment <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map((favorite) => {
              const item = favorite.equipment;
              if (!item) return null;
              return (
                <Card key={favorite.favoriteId} className={cn(appSurfaces.card, "group overflow-hidden p-0 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/5")}>
                  <div className="relative h-44 overflow-hidden bg-[#edf1e9]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <Badge variant="secondary" className={cn("absolute top-3 left-3 rounded-full border-0 bg-white/95 px-2.5 py-1 text-[10px] shadow-sm", tone.accentText)}>
                      {item.category}
                    </Badge>
                  </div>
                  <CardContent className="grid gap-3 p-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold text-[#17241b]">{item.name}</h3>
                      <p className="mt-1 flex items-center gap-1 truncate text-xs text-[#6d786d]">
                        <MapPin size={12} aria-hidden="true" /> {item.location}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-[#edf1e9] pt-3">
                      <p className={cn("text-sm font-bold", tone.accentText)}>
                        {formatCurrency(item.price)}<span className="ml-1 text-[10px] font-medium text-[#7b867b]">/ {item.rentalType.toLowerCase()}</span>
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Link href={`/equipment/${item.id}`} className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#315c3c] px-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#27492f]">
                          View <ArrowUpRight size={13} aria-hidden="true" />
                        </Link>
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="outline"
                          aria-label={`Remove ${item.name} from favorites`}
                          disabled={busyId === item.id}
                          onClick={() => void removeFavorite(item.id)}
                          className="border-[#f0d6d3] text-[#9a3f37] hover:bg-[#fff7f6] hover:text-[#8f352d]"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </Panel>
    </DashboardShell>
  );
}
