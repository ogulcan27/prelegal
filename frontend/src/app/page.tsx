import { LoginForm } from "@/components/LoginForm";

export default function Login() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6 rounded-lg bg-white p-8 shadow-sm ring-1 ring-zinc-200">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#032147]">prelegal</h1>
          <p className="text-sm text-[#888888]">Sign in to draft your legal agreements</p>
        </header>
        <LoginForm />
      </div>
    </main>
  );
}
