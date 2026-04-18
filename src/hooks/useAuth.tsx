import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Detect a Supabase auth callback in the URL (hash for implicit flow, query for PKCE/magic link)
function hasAuthCallback(): boolean {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash || "";
  const search = window.location.search || "";
  return (
    hash.includes("access_token=") ||
    hash.includes("error=") ||
    hash.includes("type=recovery") ||
    /[?&](code|token_hash|error)=/.test(search)
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  // If the URL has an auth callback, stay in loading until onAuthStateChange resolves it
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const inCallback = hasAuthCallback();

    // Set up listener FIRST so we don't miss the SIGNED_IN event from the hash
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      setSession(s);
      setLoading(false);

      // After the SDK processes the hash, clean it from the URL
      if (event === "SIGNED_IN" && inCallback) {
        const url = new URL(window.location.href);
        url.hash = "";
        url.searchParams.delete("code");
        url.searchParams.delete("token_hash");
        url.searchParams.delete("type");
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    });

    // Then check existing session — but if we're processing a callback, let the
    // listener decide loading state to avoid a momentary unauthenticated render
    // that would bounce the user back to /login.
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (!inCallback || data.session) setLoading(false);
    });

    // Safety net: never get stuck on the loader if no event fires
    const timeout = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 4000);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
