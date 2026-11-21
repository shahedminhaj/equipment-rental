import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageFallback } from "../components/auth-page-fallback";
import { SignupPanel } from "../components/signup-panel";

export const metadata: Metadata = {
  title: "Sign Up | Fieldkit",
  description: "Create a Fieldkit customer account.",
};

type SignupPageProps = Pick<PageProps<"/signup">, "searchParams">;

export default function SignupPage({ searchParams }: SignupPageProps) {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <SignupContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SignupContent({ searchParams }: SignupPageProps) {
  const { next } = await searchParams;
  return <SignupPanel nextPath={next} />;
}
