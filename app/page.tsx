import type { Metadata } from "next";
import { LandingPage } from "./components/landing-page";
import { getLandingData } from "./data/landing-data";
import { siteContent } from "./data/site-content";

export const metadata: Metadata = {
  title: "Fieldkit — Good gear. Better projects.",
  description: siteContent.hero.description,
};

export default async function Home() {
  const data = await getLandingData();
  return <LandingPage data={data} />;
}
