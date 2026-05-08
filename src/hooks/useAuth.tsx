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

      // After processing a magic-link / OAuth callback, force a full-page
      // navigation so the session persists even in embedded browser panes
      // (e.g. Arc's Little Arc, link-preview webviews).
      if (event === "SIGNED_IN" && inCallback) {
        // The Supabase SDK already wrote the session to localStorage.
        // Do a hard redirect to the canonical origin so the main browser
        // context picks it up cleanly.
        const canonical = "https://studydrop.app";
        const target = window.location.origin === canonical
          ? "/"
          : canonical + "/";
        window.location.replace(target);
        return;
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
