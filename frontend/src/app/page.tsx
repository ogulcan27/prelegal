import { AuthForm } from "@/components/AuthForm";
import { AuthPage } from "@/components/AuthPage";

export default function SignIn() {
  return (
    <AuthPage title="Welcome back" subtitle="Sign in to continue drafting your agreements.">
      <AuthForm mode="signin" />
    </AuthPage>
  );
}
