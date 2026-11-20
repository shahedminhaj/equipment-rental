"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AUTH_CHANGED_EVENT, clearAuth, type AuthUser } from "../lib/auth";

function BrandMark() {
  return (
    <Link className="brand" href="/#top" aria-label="Fieldkit home">
      <span className="brand-icon" aria-hidden="true">
        <svg viewBox="0 0 36 36" fill="none">
          <path
            d="M7 25.5 18 7l11 18.5H7Z"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <path
            d="M12 25.5 18 15l6 10.5M18 7v5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>fieldkit<span className="brand-period">.</span></span>
    </Link>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const [role, setRole] = useState<AuthUser["role"] | null>(null);

  useEffect(() => {
    function syncRole() {
      const storedRole = window.localStorage.getItem("fieldkit_user_role");
      setRole(
        storedRole === "customer" || storedRole === "owner" || storedRole === "admin"
          ? storedRole
          : null,
      );
    }

    syncRole();
    window.addEventListener(AUTH_CHANGED_EVENT, syncRole);
    window.addEventListener("storage", syncRole);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncRole);
      window.removeEventListener("storage", syncRole);
    };
  }, []);

  function signOut() {
    clearAuth();
    router.push("/");
  }

  const dashboardPath = role === "customer" ? "/account" : "/dashboard";
  const roleLabel = role === "admin" ? "Admin" : role === "owner" ? "Owner" : "User";

  return (
    <>
      <div className="announcement">
        <span className="announcement-dot" />
        The smarter way to get the gear you need.{" "}
        <Link href="/#how-it-works">See how it works <span aria-hidden="true">→</span></Link>
      </div>
      <header className="site-header" id="top">
        <div className="nav-shell">
          <BrandMark />
          <nav className="main-nav" aria-label="Main navigation">
            <Link href="/equipment">Find equipment</Link>
            <Link href="/#categories">Categories</Link>
            <Link href="/#how-it-works">How it works</Link>
            <Link href="/#reviews">Our community</Link>
            {role !== "admin" && <Link href="/account">My bookings</Link>}
            {!role && <Link href="/signup">Sign up</Link>}
          </nav>
          {role ? (
            <div className="nav-session">
              <Badge variant="secondary">{roleLabel}</Badge>
              <Link className="nav-session-link" href={dashboardPath}>
                {role === "admin" ? "Admin dashboard" : role === "owner" ? "My listings" : "My account"}
              </Link>
              <Button type="button" variant="ghost" size="sm" onClick={signOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <Link className="button button-dark nav-cta" href="/get-started">
              Get started <span aria-hidden="true">↗</span>
            </Link>
          )}
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-brand">
          <BrandMark />
          <p>Good gear has more than one life.<br />Let&apos;s make the most of it.</p>
        </div>
        <div className="footer-column">
          <strong>Explore</strong>
          <Link href="/equipment">Find equipment</Link>
          <Link href="/#categories">Categories</Link>
          <Link href="/#how-it-works">How it works</Link>
        </div>
        <div className="footer-column">
          <strong>Fieldkit</strong>
          <Link href="/#why-fieldkit">Our story</Link>
          <Link href="/#reviews">Community</Link>
          <Link href="/account">My bookings</Link>
          <Link href="/signup">Sign up</Link>
          <Link href="/#top">Back to top ↑</Link>
        </div>
        <div className="footer-note">
          <span>MADE FOR THE MAKERS.</span>
          <p>Share what you have.<br /><em>Find what you need.</em></p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Fieldkit. Make good things happen.</span>
        <span>Made for a more resourceful world</span>
      </div>
    </footer>
  );
}
