"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { setApiAuthToken } from "@/lib/api";
import { getSupabase, supabaseConfigured, type Session } from "@/lib/supabase";

type AuthCtx = {
  ready: boolean;
  configured: boolean;
  session: Session | null;
  userEmail: string | null;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  isGuest: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = supabaseConfigured();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setIsGuest(true);
      setReady(true);
      return;
    }

    let mounted = true;
    sb.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setApiAuthToken(data.session?.access_token ?? null);
      if (!data.session) {
        // restore guest flag
        const g =
          typeof window !== "undefined" &&
          localStorage.getItem("fg_guest") === "1";
        setIsGuest(g);
      } else {
        setIsGuest(false);
        localStorage.removeItem("fg_guest");
      }
      setReady(true);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setApiAuthToken(s?.access_token ?? null);
      if (s) {
        setIsGuest(false);
        localStorage.removeItem("fg_guest");
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase is not configured");
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setIsGuest(false);
    localStorage.removeItem("fg_guest");
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const sb = getSupabase();
    if (!sb) throw new Error("Supabase is not configured");
    const { error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
    setIsGuest(false);
    localStorage.removeItem("fg_guest");
  }, []);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    setSession(null);
    setApiAuthToken(null);
    setIsGuest(false);
    localStorage.removeItem("fg_guest");
  }, []);

  const continueAsGuest = useCallback(() => {
    setIsGuest(true);
    localStorage.setItem("fg_guest", "1");
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      ready,
      configured,
      session,
      userEmail: session?.user?.email ?? null,
      accessToken: session?.access_token ?? null,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
      isGuest,
    }),
    [
      ready,
      configured,
      session,
      signIn,
      signUp,
      signOut,
      continueAsGuest,
      isGuest,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
