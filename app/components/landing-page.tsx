"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatCurrency, rentalPeriod, type EquipmentListing } from "../lib/api";
import { getCategoryVisual } from "../data/category-visuals";
import type { LandingCategory, LandingData } from "../data/landing-data";
import { siteContent, type StatKey } from "../data/site-content";
import { Reveal, StaggerGroup, StaggerItem } from "./animations";
import { extraIcons, LandingIcon } from "./landing/icons";
import { SiteFooter, SiteHeader } from "./site-shell";

function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
  center = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
  center?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      <p
        className={cn(
          "text-[11px] font-bold tracking-[0.18em] uppercase",
          light ? "text-violet-300" : "text-violet-600"
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.7rem] lg:leading-[1.1]",
          light ? "text-white" : "text-slate-900"
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn("mt-4 text-sm leading-7", light ? "text-slate-300" : "text-slate-600")}>
          {description}
        </p>
      )}
    </div>
  );
}

function GradientButton({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "light" | "dark";
  className?: string;
}) {
  const styles = {
    primary:
      "bg-linear-to-r from-violet-600 via-fuchsia-600 to-rose-500 text-white shadow-lg shadow-fuchsia-500/25 hover:from-violet-500 hover:via-fuchsia-500 hover:to-rose-400",
    light:
      "bg-white/10 text-white ring-1 ring-white/30 backdrop-blur-sm hover:bg-white/20",
    dark: "bg-slate-900 text-white hover:bg-slate-800",
  }[variant];

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ size: "lg" }),
        "h-11 gap-2 rounded-full px-6 text-sm font-semibold transition-all hover:-translate-y-0.5",
        styles,
        className
      )}
    >
      {children}
    </Link>
  );
}

function HeroSection({ data }: { data: LandingData }) {
  const hero = siteContent.hero;
  const primaryStat = data.stats.listings;

  return (
    <section className="relative isolate overflow-hidden bg-[#0b1020] text-white">
      <div className="pointer-events-none absolute -top-40 -left-32 size-[30rem] rounded-full bg-violet-600/30 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 top-10 size-[26rem] rounded-full bg-fuchsia-500/25 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-[-12rem] left-1/3 size-[28rem] rounded-full bg-sky-500/20 blur-[120px]" />
      <div className="landing-grid absolute inset-0 opacity-[0.07]" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:py-28">
        <Reveal>
          <Badge
            variant="outline"
            className="h-auto gap-2 rounded-full border-white/20 bg-white/5 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-violet-200 uppercase"
          >
            <LandingIcon name="sparkles" className="size-3.5" />
            {hero.eyebrow}
          </Badge>

          <h1 className="mt-7 text-[clamp(2.9rem,6vw,5rem)] leading-[0.98] font-bold tracking-[-0.055em]">
            {hero.titleLead}
            <br />
            <span className="gradient-text bg-linear-to-r from-sky-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
              {hero.titleAccent}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300">{hero.description}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <GradientButton href={hero.primaryCta.href}>
              {hero.primaryCta.label}
              <LandingIcon name="arrow-up-right" className="size-4" />
            </GradientButton>
            <GradientButton href={hero.secondaryCta.href} variant="light">
              {hero.secondaryCta.label}
              <extraIcons.ArrowRight className="size-4" />
            </GradientButton>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {hero.chips.map((chip) => (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-slate-300"
              >
                <LandingIcon name="check" className="size-3 text-emerald-400" />
                {chip}
              </span>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-4 border-t border-white/10 pt-7">
            <div className="flex -space-x-2.5">
              {hero.avatars.map((avatar, index) => (
                <Avatar
                  key={`${avatar}-${index}`}
                  className="size-9 ring-2 ring-[#0b1020]"
                  style={{
                    background: [
                      "linear-gradient(135deg,#a78bfa,#ec4899)",
                      "linear-gradient(135deg,#38bdf8,#6366f1)",
                      "linear-gradient(135deg,#fbbf24,#f97316)",
                      "linear-gradient(135deg,#34d399,#14b8a6)",
                      "linear-gradient(135deg,#334155,#0f172a)",
                    ][index]
                  }}
                >
                  <AvatarFallback className="bg-transparent text-[11px] font-bold text-white">
                    {avatar}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="text-xs leading-5">
              <p className="font-semibold text-white">{hero.proofTitle}</p>
              <p className="text-slate-400">
                {hero.proofSubtitle} <span className="text-violet-300">({primaryStat}+ listings)</span>
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal className="relative">
          <div className="absolute -inset-4 rounded-[2.5rem] bg-linear-to-br from-violet-500/30 via-fuchsia-500/20 to-sky-500/30 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 p-2 shadow-2xl shadow-black/40 backdrop-blur-sm">
            <div className="relative aspect-[4/4.4] overflow-hidden rounded-[1.5rem]">
              <Image
                src={hero.image}
                alt={hero.imageAlt}
                fill
                priority
                unoptimized
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-transparent to-transparent" />

              <div className="absolute top-5 right-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/50 px-3 py-2 text-xs font-medium backdrop-blur-md">
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                {hero.location}
              </div>

              <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between gap-3">
                <div className="rounded-2xl border border-white/20 bg-white/90 px-4 py-3 text-slate-900 shadow-xl">
                  <p className="text-sm font-bold">{hero.floatingTitle}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{hero.floatingSubtitle}</p>
                </div>
                <Badge className="h-auto rounded-xl bg-linear-to-br from-violet-600 to-fuchsia-600 px-3 py-2 text-lg font-bold shadow-lg">
                  {data.stats.rating}
                </Badge>
              </div>

              <div className="absolute top-1/2 left-5 -translate-y-1/2 rounded-xl border border-white/20 bg-slate-950/50 px-3 py-2 text-[11px] backdrop-blur-md">
                <span className="font-bold text-violet-300">{hero.captionLabel}</span>
                <span className="ml-2 text-slate-200">{hero.caption}</span>
              </div>
            </div>
          </div>

          <div className="float-slow absolute -top-6 -left-5 hidden items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-semibold text-white shadow-xl backdrop-blur-xl sm:flex">
            <span className="grid size-8 place-items-center rounded-xl bg-emerald-400/20 text-emerald-300">
              <LandingIcon name="shield" className="size-4" />
            </span>
            Verified owners
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function StatsStrip({ stats }: { stats: LandingData["stats"] }) {
  return (
    <section className="relative z-10 mx-auto -mt-8 w-full max-w-7xl px-6">
      <StaggerGroup className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {siteContent.stats.map((stat) => {
          const value = stats[stat.key as StatKey];
          return (
            <StaggerItem key={stat.key}>
              <Card className="group gap-0 rounded-2xl border-0 bg-white/95 p-1 shadow-xl shadow-slate-900/5 backdrop-blur-sm transition-transform hover:-translate-y-1">
                <CardContent className="flex items-center gap-3 p-4">
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br text-white shadow-md",
                      stat.tone
                    )}
                  >
                    <LandingIcon name={stat.icon} className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      {stat.prefix}
                      {value}
                      <span className="text-violet-600">{stat.suffix}</span>
                    </p>
                    <p className="truncate text-[11px] text-slate-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </section>
  );
}

function CategoriesSection({ categories }: { categories: LandingCategory[] }) {
  const content = siteContent.categories;

  return (
    <section id="categories" className="mx-auto w-full max-w-7xl scroll-mt-24 px-6 py-24">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            description={content.description}
          />
          <GradientButton href="/equipment" variant="dark" className="shrink-0">
            {content.ctaLabel}
            <LandingIcon name="arrow-up-right" className="size-4" />
          </GradientButton>
        </div>
      </Reveal>

      <StaggerGroup className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => {
          const visual = getCategoryVisual(category.name, index);
          return (
            <StaggerItem key={category.name}>
              <Link
                href={`/equipment?category=${encodeURIComponent(category.name)}`}
                className="group relative block h-64 overflow-hidden rounded-3xl bg-slate-900 shadow-lg shadow-slate-900/10 transition-transform duration-300 hover:-translate-y-1.5"
              >
                <Image
                  src={visual.image}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div
                  className={cn(
                    "absolute inset-0 bg-linear-to-br opacity-25 mix-blend-overlay transition-opacity group-hover:opacity-40",
                    visual.gradient
                  )}
                />

                <div className="absolute top-4 left-4 grid size-10 place-items-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur-md">
                  <LandingIcon name={visual.icon} className="size-5" />
                </div>
                <span className="absolute top-5 right-5 text-xs font-bold text-white/50">
                  0{index + 1}
                </span>

                <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">{category.name}</h3>
                    <p className="mt-1 text-xs text-slate-300">
                      {category.count} {category.count === 1 ? "listing" : "listings"}
                    </p>
                  </div>
                  <span className="grid size-9 place-items-center rounded-full bg-white text-slate-900 transition-transform group-hover:rotate-45">
                    <LandingIcon name="arrow-up-right" className="size-4" />
                  </span>
                </div>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </section>
  );
}

function FeaturedSection({ items }: { items: EquipmentListing[] }) {
  const content = siteContent.featured;
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    setIsSignedIn(Boolean(window.localStorage.getItem("fieldkit_token")));
  }, []);

  return (
    <section
      id="featured"
      className="scroll-mt-24 bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_50%,#f8fafc_100%)] py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow={content.eyebrow}
              title={content.title}
              description={content.description}
            />
            <GradientButton href="/equipment" variant="dark" className="shrink-0">
              {content.ctaLabel}
              <LandingIcon name="arrow-up-right" className="size-4" />
            </GradientButton>
          </div>
        </Reveal>

        {items.length === 0 ? (
          <Card className="mt-12 border-dashed bg-white/70 py-12 text-center">
            <CardHeader>
              <CardTitle>{content.emptyTitle}</CardTitle>
              <CardDescription>{content.emptyDescription}</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <StaggerGroup className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <StaggerItem key={item.id}>
                <Card className="group h-full gap-0 overflow-hidden rounded-3xl border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-violet-500/10">
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-slate-950/45 to-transparent" />
                    <Badge className="absolute top-4 left-4 rounded-full bg-white/90 text-[10px] font-bold text-violet-700 shadow-sm backdrop-blur-sm">
                      {item.category}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "absolute right-4 bottom-4 gap-1.5 rounded-full bg-white/90 text-[10px] font-semibold shadow-sm backdrop-blur-sm",
                        item.availableQuantity ? "text-emerald-700" : "text-rose-700"
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          item.availableQuantity ? "bg-emerald-500" : "bg-rose-500"
                        )}
                      />
                      {item.availableQuantity
                        ? `${item.availableQuantity} available`
                        : "Currently rented"}
                    </Badge>
                  </div>

                  <CardContent className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold tracking-wider text-violet-600 uppercase">
                        {item.rentalType} rental
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                        <LandingIcon name="star" className="size-3 fill-amber-400 text-amber-400" />
                        Listing
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-bold tracking-tight text-slate-900">
                      {item.name}
                    </h3>
                    <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500">
                      <LandingIcon name="map-pin" className="size-3.5" />
                      {item.location}
                    </p>

                    <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                      <div>
                        <p className="text-xl font-bold tracking-tight text-slate-900">
                          {formatCurrency(item.price)}
                          <span className="text-xs font-medium text-slate-400">
                            {" "}
                            / {rentalPeriod(item.rentalType)}
                          </span>
                        </p>
                      </div>
                      <Link
                        href={
                          isSignedIn
                            ? `/equipment/${item.id}`
                            : `/login?next=${encodeURIComponent(`/equipment/${item.id}`)}`
                        }
                        className={buttonVariants({
                          size: "sm",
                          className: "rounded-full bg-slate-900 px-4 text-xs text-white hover:bg-violet-700",
                        })}
                      >
                        View details
                        <LandingIcon name="arrow-up-right" className="size-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </section>
  );
}

function WhySection() {
  const content = siteContent.why;

  return (
    <section id="why-fieldkit" className="scroll-mt-24 bg-[#0b1020] py-24 text-white">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-14 px-6 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="absolute -inset-3 rounded-[2.5rem] bg-linear-to-br from-emerald-400/25 via-sky-500/20 to-violet-600/25 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10">
            <Image
              src={content.image}
              alt={content.imageAlt}
              fill
              unoptimized
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="!absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-transparent to-slate-950/20" />
            <div className="absolute bottom-6 left-6">
              <p className="text-[10px] font-bold tracking-[0.2em] text-violet-300">
                {content.photoLabel}
              </p>
              <p className="mt-1 text-xl font-bold">{content.photoTitle}</p>
            </div>
            <div className="absolute top-6 right-6 grid size-20 rotate-12 place-items-center rounded-2xl bg-linear-to-br from-emerald-400 to-teal-500 text-center text-[10px] font-black leading-tight text-slate-900 shadow-xl">
              {content.stamp.split(" ").map((word) => (
                <span key={word} className="block">
                  {word}
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <p className="text-[11px] font-bold tracking-[0.18em] text-violet-300 uppercase">
            {content.eyebrow}
          </p>
          <h2 className="mt-4 text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl">
            {content.titleLead}
            <br />
            <span className="gradient-text bg-linear-to-r from-emerald-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              {content.titleAccent}
            </span>
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300">{content.description}</p>

          <div className="mt-9 space-y-3">
            {content.benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/20 hover:bg-white/10"
              >
                <span
                  className={cn(
                    "grid size-11 shrink-0 place-items-center rounded-xl bg-linear-to-br text-white shadow-lg",
                    benefit.tone
                  )}
                >
                  <LandingIcon name={benefit.icon} className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold">{benefit.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-400">{benefit.description}</p>
                </div>
                <LandingIcon
                  name="arrow-up-right"
                  className="ml-auto mt-1 size-4 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function HowSection() {
  const content = siteContent.steps;

  return (
    <section id="how-it-works" className="scroll-mt-24 bg-white py-24">
      <div className="mx-auto w-full max-w-7xl px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow={content.eyebrow}
              title={content.title}
              description={content.description}
            />
            <GradientButton href="/equipment" variant="primary" className="shrink-0">
              {content.ctaLabel}
              <LandingIcon name="arrow-up-right" className="size-4" />
            </GradientButton>
          </div>
        </Reveal>

        <StaggerGroup className="relative mt-14 grid gap-5 md:grid-cols-3">
          <div className="absolute top-12 right-[16%] left-[16%] hidden h-px bg-linear-to-r from-violet-300 via-fuchsia-300 to-orange-300 md:block" />
          {content.items.map((step) => (
            <StaggerItem key={step.number}>
              <Card className="relative h-full gap-0 overflow-hidden rounded-3xl border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl">
                <div
                  className={cn(
                    "absolute -top-16 -right-12 size-40 rounded-full bg-linear-to-br opacity-15 blur-2xl",
                    step.tone
                  )}
                />
                <div className="relative flex items-start justify-between">
                  <span
                    className={cn(
                      "grid size-14 place-items-center rounded-2xl bg-linear-to-br text-white shadow-lg",
                      step.tone
                    )}
                  >
                    <LandingIcon name={step.icon} className="size-6" />
                  </span>
                  <span className="text-sm font-black tracking-tight text-slate-200">
                    {step.number} / 0{content.items.length}
                  </span>
                </div>
                <h3 className="relative mt-7 text-xl font-bold tracking-tight text-slate-900">
                  {step.title}
                </h3>
                <p className="relative mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                <div className="relative mt-6 h-1 w-12 rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500" />
              </Card>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}

function ReviewsSection() {
  const content = siteContent.reviews;

  return (
    <section id="reviews" className="scroll-mt-24 bg-[#f8fafc] py-24">
      <div className="mx-auto w-full max-w-7xl px-6">
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            description={content.description}
            center
          />
        </Reveal>

        <StaggerGroup className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((review) => (
            <StaggerItem key={review.name}>
              <Card className="relative h-full gap-0 overflow-hidden rounded-3xl border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-xl">
                <LandingIcon
                  name="quote"
                  className="absolute top-5 right-5 size-8 text-violet-100"
                />
                <div className="flex gap-0.5 text-amber-400" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <LandingIcon
                      key={index}
                      name="star"
                      className="size-3.5 fill-current"
                    />
                  ))}
                  <span className="ml-1.5 text-[11px] font-bold text-slate-500">
                    {review.rating}
                  </span>
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-7 text-slate-700">
                  “{review.quote}”
                </blockquote>
                <Separator className="my-5" />
                <div className="flex items-center gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback
                      className={cn(
                        "bg-linear-to-br text-[11px] font-bold text-white",
                        review.tone
                      )}
                    >
                      {review.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{review.name}</p>
                    <p className="truncate text-[11px] text-slate-500">{review.role}</p>
                  </div>
                  <extraIcons.BadgeCheck className="ml-auto size-4 shrink-0 text-violet-600" />
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerGroup>
        <p className="mt-8 text-center text-[11px] text-slate-400">{content.note}</p>
      </div>
    </section>
  );
}

function FaqSection() {
  const content = siteContent.faq;

  return (
    <section id="faq" className="scroll-mt-24 bg-white py-24">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <SectionHeading
            eyebrow={content.eyebrow}
            title={content.title}
            description={content.description}
          />
          <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
            <span className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-600">
              <LandingIcon name="sparkles" className="size-5" />
            </span>
            Still curious? Browse the catalog and see what&apos;s available near you.
          </div>
        </Reveal>

        <Reveal>
          <Accordion defaultValue={[content.items[0].question]} className="space-y-3">
            {content.items.map((item) => (
              <AccordionItem
                key={item.question}
                value={item.question}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 px-5 not-last:border-b-0 data-open:bg-white data-open:shadow-md"
              >
                <AccordionTrigger className="py-5 text-sm font-bold text-slate-900 hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-7 text-slate-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

function CtaSection() {
  const content = siteContent.cta;

  return (
    <section className="bg-white px-6 pb-24">
      <Reveal>
        <div className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-16 text-center sm:px-12">
          <div className="pointer-events-none absolute -top-24 left-1/4 size-80 rounded-full bg-violet-600/50 blur-[100px]" />
          <div className="pointer-events-none absolute -right-16 -bottom-24 size-80 rounded-full bg-fuchsia-500/40 blur-[100px]" />
          <div className="pointer-events-none absolute -bottom-24 left-1/4 size-72 rounded-full bg-sky-500/30 blur-[100px]" />
          <div className="landing-grid absolute inset-0 opacity-[0.08]" />

          <div className="relative">
            <p className="text-[11px] font-bold tracking-[0.2em] text-violet-300 uppercase">
              {content.eyebrow}
            </p>
            <h2 className="mt-5 text-4xl leading-[1.08] font-bold tracking-tight text-white sm:text-5xl">
              {content.titleLead}
              <br />
              <span className="gradient-text bg-linear-to-r from-sky-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                {content.titleAccent}
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-300">
              {content.description}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <GradientButton href={content.primaryCta.href}>
                {content.primaryCta.label}
                <LandingIcon name="arrow-up-right" className="size-4" />
              </GradientButton>
              <GradientButton href={content.secondaryCta.href} variant="light">
                {content.secondaryCta.label}
                <extraIcons.ArrowRight className="size-4" />
              </GradientButton>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function LandingPage({ data }: { data: LandingData }) {
  return (
    <div className="landing-page flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection data={data} />
        <StatsStrip stats={data.stats} />
        <CategoriesSection categories={data.categories} />
        <FeaturedSection items={data.featured} />
        <WhySection />
        <HowSection />
        <ReviewsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
