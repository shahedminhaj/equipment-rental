"use client";

import { useRouter } from "next/navigation";
import { AccountAccess } from "./account-access";
import { SiteFooter, SiteHeader } from "./site-shell";

export function SignupPanel() {
  const router = useRouter();
  return (
    <>
      <SiteHeader />
      <main className="account-page signup-page">
        <AccountAccess
          initialMode="register"
          onAuthenticated={(_token, user) => {
            router.push(user.role === "customer" ? "/account" : "/dashboard");
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
