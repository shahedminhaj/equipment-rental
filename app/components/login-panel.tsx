"use client";

import { useRouter } from "next/navigation";
import { dashboardHref } from "../lib/dashboard-routes";
import { AccountAccess } from "./account-access";
import { SiteFooter, SiteHeader } from "./site-shell";

export function LoginPanel() {
  const router = useRouter();

  return (
    <>
      <SiteHeader authPage />
      <main className="account-page signup-page">
        <AccountAccess
          initialMode="login"
          onAuthenticated={(_token, user) => {
            router.replace(dashboardHref(user.role));
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
