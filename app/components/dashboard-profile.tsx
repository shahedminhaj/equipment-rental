"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Mail, MapPin, Phone, Save, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { appSurfaces, roleTones } from "../data/app-theme";
import { apiRequest } from "../lib/api";
import type { AuthUser } from "../lib/auth";
import { DashboardShell } from "./dashboard-shell";
import { useToast } from "./toast-provider";
import { useDashboardSession } from "./use-dashboard-session";

type ProfileData = AuthUser & { phone?: string; address?: string };

export function DashboardProfile() {
  const { user, token, isLoading, error, signOut, refreshSession } = useDashboardSession();
  const { notify } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiRequest<{ user: ProfileData }>("/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ user: currentProfile }) => {
        if (active) setProfile(currentProfile);
      })
      .catch((loadError) => {
        if (active) setProfileError(loadError instanceof Error ? loadError.message : "Could not load your profile.");
      })
      .finally(() => {
        if (active) setIsLoadingProfile(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !profile) return;
    setIsSaving(true);
    setProfileError("");
    try {
      const response = await apiRequest<{ user: ProfileData }>("/profile", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profile.name.trim(),
          photo: profile.photo?.trim() || "",
          phone: profile.phone?.trim() || "",
          address: profile.address?.trim() || "",
        }),
      });
      setProfile(response.user);
      refreshSession();
      notify("Profile updated.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Could not save your profile.";
      setProfileError(message);
      notify(message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  const role = user?.role || "customer";
  const tone = roleTones[role];

  return (
    <DashboardShell
      role={role}
      user={user}
      title="Profile"
      description="Update the account details used across your Fieldkit workspace."
      isLoading={isLoading || isLoadingProfile}
      error={error || profileError}
      signOut={signOut}
      onRetry={refreshSession}
    >
      {profile ? (
        <div className="mx-auto w-full max-w-3xl">
          <Card className={cn(appSurfaces.card, "overflow-hidden border-0 shadow-lg shadow-slate-900/5")}>
            <div className={cn("h-1.5 bg-linear-to-r", tone.panelAccent)} />
            <CardHeader className="gap-4 p-6 pb-0 sm:flex-row sm:items-center sm:p-8 sm:pb-0">
              <Avatar className={cn("size-16 rounded-2xl ring-4 ring-white shadow-md", tone.iconTile)}>
                {profile.photo ? <AvatarImage src={profile.photo} alt={profile.name} /> : null}
                <AvatarFallback className={cn("rounded-2xl text-lg font-bold", tone.softBadge)}>
                  {profile.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "FK"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className={cn(appSurfaces.eyebrow, tone.accentText)}>{role} account</p>
                <CardTitle className="mt-1 text-2xl font-bold tracking-tight text-[#17241b]">Your profile</CardTitle>
                <CardDescription className="mt-1 text-sm text-[#6d786d]">Keep your contact details current for rentals and support.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-6 sm:p-8 sm:pt-7">
              <form onSubmit={saveProfile} className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="dashboard-profile-name" className="flex items-center gap-2 text-xs font-semibold text-[#465448]">
                    <UserRound size={14} aria-hidden="true" /> Full name
                  </Label>
                  <Input
                    id="dashboard-profile-name"
                    autoComplete="name"
                    minLength={2}
                    maxLength={100}
                    required
                    value={profile.name}
                    onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                    className="h-11 rounded-xl border-[#dfe6d8] bg-[#fbfcf8] text-sm text-[#17241b] focus-visible:ring-[#cfe0bf]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dashboard-profile-email" className="flex items-center gap-2 text-xs font-semibold text-[#465448]">
                    <Mail size={14} aria-hidden="true" /> Email address
                  </Label>
                  <Input
                    id="dashboard-profile-email"
                    type="email"
                    value={profile.email}
                    readOnly
                    className="h-11 rounded-xl border-[#dfe6d8] bg-slate-100 text-sm text-slate-500"
                  />
                  <p className="text-[11px] text-[#7b867b]">Email is managed by your sign-in provider.</p>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="dashboard-profile-phone" className="flex items-center gap-2 text-xs font-semibold text-[#465448]">
                      <Phone size={14} aria-hidden="true" /> Phone number
                    </Label>
                    <Input
                      id="dashboard-profile-phone"
                      type="tel"
                      autoComplete="tel"
                      maxLength={30}
                      value={profile.phone || ""}
                      onChange={(event) => setProfile({ ...profile, phone: event.target.value })}
                      className="h-11 rounded-xl border-[#dfe6d8] bg-[#fbfcf8] text-sm text-[#17241b] focus-visible:ring-[#cfe0bf]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dashboard-profile-photo" className="flex items-center gap-2 text-xs font-semibold text-[#465448]">
                      <UserRound size={14} aria-hidden="true" /> Profile image URL
                    </Label>
                    <Input
                      id="dashboard-profile-photo"
                      type="url"
                      maxLength={2048}
                      placeholder="https://..."
                      value={profile.photo || ""}
                      onChange={(event) => setProfile({ ...profile, photo: event.target.value })}
                      className="h-11 rounded-xl border-[#dfe6d8] bg-[#fbfcf8] text-sm text-[#17241b] focus-visible:ring-[#cfe0bf]"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dashboard-profile-address" className="flex items-center gap-2 text-xs font-semibold text-[#465448]">
                    <MapPin size={14} aria-hidden="true" /> Address
                  </Label>
                  <textarea
                    id="dashboard-profile-address"
                    autoComplete="street-address"
                    maxLength={300}
                    rows={3}
                    value={profile.address || ""}
                    onChange={(event) => setProfile({ ...profile, address: event.target.value })}
                    className="w-full resize-y rounded-xl border border-[#dfe6d8] bg-[#fbfcf8] px-3.5 py-3 text-sm text-[#17241b] outline-none focus-visible:ring-2 focus-visible:ring-[#cfe0bf]"
                  />
                </div>
                <div className="flex justify-end border-t border-[#edf1e9] pt-4">
                  <Button type="submit" disabled={isSaving} className={cn("h-10 rounded-xl text-white shadow-md", tone.gradient)}>
                    <Save size={15} aria-hidden="true" /> {isSaving ? "Saving..." : "Save profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </DashboardShell>
  );
}
