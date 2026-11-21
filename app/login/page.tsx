import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPageFallback } from "../components/auth-page-fallback";
import { LoginPanel } from "../components/login-panel";

export const metadata: Metadata = {
  title: "Login | Fieldkit",
  description: "Sign in to book and manage equipment rentals.",
};

type LoginPageProps = Pick<PageProps<"/login">, "searchParams">;

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  return <LoginPanel nextPath={next} />;
}
