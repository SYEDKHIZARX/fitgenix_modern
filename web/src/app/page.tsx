"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthProvider";
import { useFit } from "@/context/FitgenixProvider";

export default function IndexPage() {
  const router = useRouter();
  const { ready: authReady, configured, session, isGuest } = useAuth();
  const { ready, onboarded } = useFit();

  useEffect(() => {
    if (!authReady || !ready) return;
    // Require login when Supabase is configured (unless guest)
    if (configured && !session && !isGuest) {
      router.replace("/login");
      return;
    }
    router.replace(onboarded ? "/home" : "/onboarding");
  }, [authReady, ready, configured, session, isGuest, onboarded, router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="font-display text-3xl font-black text-white">
        FIT<span className="text-neon">GENIX</span>
      </div>
    </div>
  );
}
