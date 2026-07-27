"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { useFit } from "@/context/FitgenixProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { ready, onboarded, profile } = useFit();
  const router = useRouter();

  useEffect(() => {
    if (ready && !onboarded) router.replace("/onboarding");
  }, [ready, onboarded, router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-[var(--text-muted)]">
        Loading…
      </div>
    );
  }

  return (
    <AppShell injuryPart={profile.injury_part}>
      {children}
    </AppShell>
  );
}
