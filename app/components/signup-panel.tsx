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
