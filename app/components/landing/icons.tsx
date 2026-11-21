import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Camera,
  Car,
  Check,
  Clock,
  Cpu,
  HardHat,
  Heart,
  Layers,
  Leaf,
  MapPin,
  Package,
  PartyPopper,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Truck,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { IconKey } from "../../data/site-content";

const icons: Record<IconKey, LucideIcon> = {
  sparkles: Sparkles,
  package: Package,
  star: Star,
  layers: Layers,
  leaf: Leaf,
  shield: ShieldCheck,
  wallet: Wallet,
  clock: Clock,
  "map-pin": MapPin,
  search: Search,
  calendar: CalendarDays,
  truck: Truck,
  "hard-hat": HardHat,
  camera: Camera,
  car: Car,
  sprout: Sprout,
  cpu: Cpu,
  party: PartyPopper,
  wrench: Wrench,
  "arrow-up-right": ArrowUpRight,
  check: Check,
  heart: Heart,
  quote: Quote,
};

export const extraIcons = { ArrowRight, BadgeCheck };

export function LandingIcon({
  name,
  className,
}: {
  name: IconKey;
  className?: string;
}) {
  const Icon = icons[name] ?? Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}
