"use client";

import { useRouter } from "next/navigation";
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
            const next = new URLSearchParams(window.location.search).get("next");
            const isSafeNext =
              typeof next === "string" &&
              next.startsWith("/") &&
              !next.startsWith("//") &&
              next !== "/" &&
              !next.startsWith("/login") &&
              !next.startsWith("/signup") &&
              !next.startsWith("/get-started");

            if (isSafeNext) {
              router.replace(next);
              return;
            }
            if (user.role === "admin") {
              router.replace("/admin/dashboard");
              return;
            }
            if (user.role === "owner") {
              router.replace("/owner/dashboard");
              return;
            }
            router.replace("/account");
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
