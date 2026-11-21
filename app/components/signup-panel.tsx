"use client";

import { useRouter } from "next/navigation";
import { postAuthHref } from "../lib/dashboard-routes";
import { AccountAccess } from "./account-access";
import { SiteFooter, SiteHeader } from "./site-shell";

export function SignupPanel({ nextPath }: { nextPath?: string | string[] }) {
  const router = useRouter();
  return (
    <>
      <SiteHeader authPage />
      <main className="account-page signup-page">
        <AccountAccess
          initialMode="register"
          onAuthenticated={(_token, user) => {
            router.replace(postAuthHref(user.role, nextPath));
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
