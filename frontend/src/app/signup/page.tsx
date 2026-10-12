import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { AuthPage } from "@/components/AuthPage";

export const metadata: Metadata = { title: "Create account | prelegal" };

export default function SignUp() {
  return (
    <AuthPage title="Create your account" subtitle="Start drafting legal agreements with an AI assistant.">
      <AuthForm mode="signup" />
    </AuthPage>
  );
}
