import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Package,
  ShieldCheck,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EquipmentBooking } from "../../components/equipment-booking";
import { EquipmentDetailsView } from "../../components/equipment-details-view";
import { FavoriteButton } from "../../components/favorite-button";
import { PrivateRouteGate } from "../../components/private-route-gate";
import { appSurfaces, publicTone } from "../../data/app-theme";
import { formatCurrency, rentalPeriod, type EquipmentListing } from "../../lib/api";

export const metadata: Metadata = {
  title: "Equipment Details | Fieldkit",
  description: "Review a live equipment listing and book securely with Stripe Checkout.",
};

export default function EquipmentDetailsPage({
  params,
}: PageProps<"/equipment/[id]">) {
  return (
    <EquipmentDetailsView>
      <PrivateRouteGate>
        <Suspense fallback={<DetailsSkeleton />}>
          <EquipmentDetailsContent params={params} />
        </Suspense>
      </PrivateRouteGate>
    </EquipmentDetailsView>
  );
}

function DetailsSkeleton() {
  return (
    <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 size-[28rem] rounded-full bg-[#d9ef94]/20 blur-[120px]" />
      </div>
      <div className="relative">
        <Skeleton className="h-4 w-64 rounded-full" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Skeleton className="aspect-[4/3] w-full rounded-3xl" />
            <Skeleton className="h-10 w-2/3 rounded-xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-[32rem] rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

async function EquipmentDetailsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const apiBaseUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
  ).replace(/\/+$/, "");
  const response = await fetch(
    `${apiBaseUrl}/equipment/${encodeURIComponent(id)}`,
    { cache: "no-store" },
  );
  if (response.status === 400 || response.status === 404) notFound();
  if (!response.ok) {
    throw new Error(`Could not load equipment (${response.status})`);
  }
  const { item } = (await response.json()) as { item: EquipmentListing };
  const ownerName = item.owner?.name || "Equipment owner";
  const ownerInitials = ownerName.slice(0, 2).toUpperCase();
  const isAvailable = item.availableQuantity > 0;

  const specs = [
    { icon: Package, label: "Category", value: item.category },
    {
      icon: Wallet,
      label: "Rental rate",
      value: `${formatCurrency(item.price)} / ${rentalPeriod(item.rentalType)}`,
    },
    { icon: CalendarDays, label: "Rental type", value: item.rentalType },
    {
      icon: CheckCircle2,
      label: "Availability",
      value: `${item.availableQuantity} available`,
    },
    item.condition ? { icon: Wrench, label: "Condition", value: item.condition } : null,
    item.brand
      ? {
          icon: Package,
          label: "Brand & model",
          value: `${item.brand}${item.model ? ` ${item.model}` : ""}`,
        }
      : null,
  ].filter((spec): spec is { icon: LucideIcon; label: string; value: string } => spec !== null);

  return (
    <div className="relative mx-auto max-w-7xl px-4 pt-8 pb-24 sm:px-6 lg:px-8 lg:pb-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 size-[28rem] rounded-full bg-[#d9ef94]/20 blur-[120px]" />
        <div className="absolute -right-32 top-32 size-[24rem] rounded-full bg-[#d9ef94]/15 blur-[110px]" />
      </div>

      <div className="relative">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
          <Link href="/equipment" className="font-semibold text-[#315c3c] hover:text-[#315c3c]">
            All equipment
          </Link>
          <span aria-hidden="true">/</span>
          <span>{item.category}</span>
          <span aria-hidden="true">/</span>
          <span className="text-slate-600">{item.name}</span>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card className={cn(appSurfaces.card, "overflow-hidden")}>
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 sm:aspect-[16/10]">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 760px) 100vw, 65vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-2 p-4">
                  <Badge className="h-auto rounded-full border-white/20 bg-white/90 px-3 py-1.5 text-slate-700 shadow-sm backdrop-blur-sm hover:bg-white/90">
                    {item.rentalType} rental
                  </Badge>
                  <Badge
                    className={cn(
                      "h-auto rounded-full px-3 py-1.5 text-white shadow-sm hover:bg-transparent",
                      isAvailable
                        ? "bg-emerald-600/90"
                        : "bg-slate-900/80",
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {isAvailable ? `${item.availableQuantity} available` : "Currently rented"}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className={cn(appSurfaces.eyebrow, "text-[#4c6d45]")}>
                      {item.category} / Approved listing
                    </p>
                    <h1 className="mt-2 text-3xl leading-tight font-bold tracking-tight text-slate-900 sm:text-4xl">
                      {item.name}
                    </h1>
                  </div>
                  <Badge className={cn("h-auto rounded-full px-3 py-1.5", publicTone.softBadge, "hover:bg-transparent")}>
                    <ShieldCheck aria-hidden="true" />
                    Verified owner
                  </Badge>
                </div>

                <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-slate-500">
                  <MapPin className="size-4 text-[#4c6d45]" aria-hidden="true" />
                  {item.location}
                </p>
                <p className={cn("mt-5 max-w-2xl", appSurfaces.body)}>
                  {item.description || "Contact the owner for more details about this equipment."}
                </p>

                <Separator className="my-7" />

                <section aria-labelledby="details-heading">
                  <p className={appSurfaces.eyebrow}>At a glance</p>
                  <h2 id="details-heading" className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                    Equipment details
                  </h2>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                    {specs.map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4"
                      >
                        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", publicTone.iconTile)}>
                          <Icon className="size-4" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <dt className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                            {label}
                          </dt>
                          <dd className="mt-0.5 truncate text-sm font-semibold text-slate-800">{value}</dd>
                        </div>
                      </div>
                    ))}
                  </dl>
                </section>

                {item.rentalTerms && item.rentalTerms.length > 0 ? (
                  <section className="mt-8" aria-labelledby="terms-heading">
                    <p className={appSurfaces.eyebrow}>Before you book</p>
                    <h2 id="terms-heading" className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                      Rental terms
                    </h2>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {item.rentalTerms.map((term) => (
                        <li
                          key={term}
                          className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 px-3.5 py-3 text-sm text-slate-700"
                        >
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                          {term}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section className="mt-8" aria-labelledby="owner-heading">
                  <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#dfe6d8] bg-linear-to-r from-[#f3f7ee] to-[#edf3e2] p-5">
                    <Avatar className="size-12 rounded-2xl ring-2 ring-white">
                      <AvatarFallback className="rounded-2xl bg-linear-to-br from-[#315c3c] to-[#6f8f4c] text-sm font-bold text-white">
                        {ownerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className={appSurfaces.eyebrow}>Local equipment owner</p>
                      <h2 id="owner-heading" className="mt-0.5 text-base font-bold text-slate-900">
                        {ownerName}
                      </h2>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="size-3" aria-hidden="true" />
                        {item.location}
                      </p>
                    </div>
                  </div>
                </section>
              </CardContent>
            </Card>
          </div>

          <aside className="min-w-0">
            <Card className={cn(appSurfaces.card, "overflow-hidden")}>
              <div className={cn("h-1.5 bg-linear-to-r", publicTone.panelAccent)} />
              <CardContent className="p-6">
                <p className={appSurfaces.eyebrow}>Rent this equipment</p>
                <div className="mt-3 flex flex-wrap items-end gap-1">
                  <strong className="text-3xl font-bold tracking-tight text-slate-900">
                    {formatCurrency(item.price)}
                  </strong>
                  <span className="pb-1 text-sm text-slate-500">
                    / {rentalPeriod(item.rentalType)}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-400">{item.rentalType} rental rate</p>

                <Separator className="my-5" />

                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <Avatar className="size-9 rounded-xl">
                    <AvatarFallback className="rounded-xl bg-[#e8efdc] text-xs font-bold text-[#315c3c]">
                      {ownerInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{ownerName}</p>
                    <p className="text-[11px] text-slate-400">Local equipment owner</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200/70 px-3 py-2.5 text-xs">
                  <span className={cn("size-2 rounded-full", isAvailable ? "bg-emerald-500" : "bg-slate-400")} />
                  <span className="font-medium text-slate-600">
                    {isAvailable ? "Available to book" : "Currently rented"}
                  </span>
                  {isAvailable ? (
                    <strong className="ml-auto text-slate-800">{item.availableQuantity} left</strong>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3">
                  <FavoriteButton equipmentId={item.id} />
                  <EquipmentBooking item={item} />
                </div>

                <p className="mt-4 flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
                  <ShieldCheck className="mt-px size-3.5 shrink-0 text-emerald-500" aria-hidden="true" />
                  Secure payment is processed by Stripe Checkout.
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>

        <EquipmentBooking item={item} placement="mobile-bar" />

        <div className="mt-8">
          <Link
            href="/equipment"
            className={buttonVariants({ variant: "ghost", className: "gap-2 rounded-full text-slate-600" })}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to all equipment
          </Link>
        </div>
      </div>
    </div>
  );
}
