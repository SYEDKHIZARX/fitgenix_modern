"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, SectionLabel } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthProvider";

export default function LoginPage() {
  const { configured, signIn, signUp, continueAsGuest } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      if (mode === "login") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password);
        setInfo(
          "Account created. If email confirmation is required, check your inbox — otherwise you're signed in."
        );
      }
      router.replace("/");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <div className="font-display text-4xl font-black text-white">
          FIT<span className="text-neon">GENIX</span>
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Sign in to sync plans and personal RL across devices
        </p>
      </div>

      <Card className="space-y-4">
        <SectionLabel>{mode === "login" ? "Log in" : "Create account"}</SectionLabel>

        {!configured && (
          <p className="rounded-lg border border-heat/30 bg-heat/10 p-3 text-sm text-heat">
            Supabase is not configured in this environment. Set{" "}
            <code className="text-neon">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="text-neon">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
            <code className="text-neon">web/.env.local</code>, or continue as
            guest (local only).
          </p>
        )}

        <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
          Email
          <input
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)]">
          Password
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="mt-1 w-full rounded-lg border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {err && (
          <p className="rounded-lg border border-heat/30 bg-heat/10 p-3 text-sm text-heat">
            {err}
          </p>
        )}
        {info && (
          <p className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
            {info}
          </p>
        )}

        <Button
          className="w-full"
          disabled={busy || !configured || !email || password.length < 6}
          onClick={submit}
        >
          {busy
            ? "Please wait…"
            : mode === "login"
              ? "Log in"
              : "Create account"}
        </Button>

        <button
          type="button"
          className="w-full text-center text-sm text-[var(--text-secondary)] hover:text-neon"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login"
            ? "Need an account? Sign up"
            : "Already have an account? Log in"}
        </button>

        <div className="border-t border-white/10 pt-4">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              continueAsGuest();
              router.replace("/");
            }}
          >
            Continue as guest (local only)
          </Button>
          <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
            Guest mode keeps data in this browser only.
          </p>
        </div>
      </Card>

      <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
        <Link href="/" className="text-neon hover:underline">
          Back to app
        </Link>
      </p>
    </div>
  );
}
