import type { Metadata } from "next";
import { SignupPanel } from "../components/signup-panel";

export const metadata: Metadata = {
  title: "Sign Up | Fieldkit",
  description: "Create a Fieldkit customer account.",
};

export default function SignupPage() {
  return <SignupPanel />;
}
