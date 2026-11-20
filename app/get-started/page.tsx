import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SiteFooter, SiteHeader } from "../components/site-shell";

export const metadata: Metadata = {
  title: "Get Started | Fieldkit",
  description: "Choose a Fieldkit user or administrator workspace.",
};

export default function GetStartedPage() {
  return (
    <>
      <SiteHeader />
      <main className="account-page role-choice-page">
        <div className="role-choice-shell">
          <div className="role-choice-heading">
            <p className="eyebrow">GET STARTED</p>
            <h1>Choose your workspace.</h1>
            <p>Continue to your Fieldkit account.</p>
          </div>
          <div className="role-choice-grid">
            <Link className="role-choice-link" href="/account">
              <Card className="role-choice-card">
                <CardHeader className="role-choice-card-header p-0">
                  <span className="role-choice-icon" aria-hidden="true">U</span>
                  <Badge variant="secondary">USER</Badge>
                  <h2>Rent equipment</h2>
                </CardHeader>
                <CardContent className="role-choice-card-content p-0">
                  <p>Sign in to rent equipment, or create an account to get started. To publish listings, an administrator must first grant your account the Owner role.</p>
                  <span className="role-choice-action">Continue as user <span aria-hidden="true">→</span></span>
                </CardContent>
              </Card>
            </Link>
            <Link className="role-choice-link" href="/admin/dashboard">
              <Card className="role-choice-card">
                <CardHeader className="role-choice-card-header p-0">
                  <span className="role-choice-icon role-choice-icon-admin" aria-hidden="true">A</span>
                  <Badge variant="outline">ADMIN</Badge>
                  <h2>Manage Fieldkit</h2>
                </CardHeader>
                <CardContent className="role-choice-card-content p-0">
                  <p>Sign in to review listings, manage users, and see marketplace analytics.</p>
                  <span className="role-choice-action">Continue as admin <span aria-hidden="true">→</span></span>
                </CardContent>
              </Card>
            </Link>
          </div>
          <p className="role-choice-note">
            Owner listings are submitted for approval before they appear in Browse equipment. The admin account is created automatically from the credentials in the backend environment.
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
