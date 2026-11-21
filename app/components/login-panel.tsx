"use client";

import { useRouter } from "next/navigation";
import { AccountAccess } from "./account-access";
import { SiteFooter, SiteHeader } from "./site-shell";

export function LoginPanel() {
  const router = useRouter();

  return (
    <>
      <SiteHeader />
      <main className="account-page signup-page">
        <AccountAccess
          initialMode="login"
          onAuthenticated={(_token, user) => {
            const next = new URLSearchParams(window.location.search).get("next");
            if (next?.startsWith("/") && !next.startsWith("//")) {
              router.push(next);
              return;
            }
            if (user.role === "admin") {
              router.push("/admin/dashboard");
              return;
            }
            if (user.role === "owner") {
              router.push("/owner/dashboard");
              return;
            }
            router.push("/account");
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
