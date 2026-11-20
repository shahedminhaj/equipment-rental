import type { Metadata } from "next";
import { LoginPanel } from "../components/login-panel";

export const metadata: Metadata = {
  title: "Login | Fieldkit",
  description: "Sign in to book and manage equipment rentals.",
};

export default function LoginPage() {
  return <LoginPanel />;
}
