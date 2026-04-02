"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { initSluggerAuth, buildMockPayloadForUser } from "@/lib/slugger-sdk";
import { createSupabaseClient } from "@/lib/supabase";
import type { SluggerAuthPayload } from "@/lib/slugger-sdk";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  /** Re-run the mock auth flow with a specific user (dev toolbar only). */
  switchDevUser: (payload: SluggerAuthPayload) => void;
  /** Patch the in-memory user (e.g. after onboarding completes). */
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Ref to hold the current cleanup fn from initSluggerAuth
  const cleanupRef = useRef<(() => void) | null>(null);

  function runAuth(mockPayload?: SluggerAuthPayload) {
    // Cancel any in-flight auth
    cleanupRef.current?.();

    setState({ user: null, accessToken: null, isLoading: true, isAuthenticated: false, error: null });

    const cleanup = initSluggerAuth({
      mockPayload,
      onAuth: async (payload) => {
        try {
          const res = await fetch("/api/auth/bootstrap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: payload.bootstrapToken, sluggerUser: payload.user }),
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            setState({
              user: null,
              accessToken: null,
              isLoading: false,
              isAuthenticated: false,
              error: body.error ?? "Authentication failed",
            });
            return;
          }

          const { user, session } = await res.json();

          setState({ user, accessToken: session.access_token, isLoading: false, isAuthenticated: true, error: null });
        } catch (err) {
          setState({
            user: null,
            accessToken: null,
            isLoading: false,
            isAuthenticated: false,
            error: err instanceof Error ? err.message : "Unknown error during authentication",
          });
        }
      },
      onError: (reason) => {
        setState({
          user: null,
          accessToken: null,
          isLoading: false,
          isAuthenticated: false,
          error: reason,
        });
      },
    });

    cleanupRef.current = cleanup;
  }

  useEffect(() => {
    runAuth();
    return () => cleanupRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchDevUser(payload: SluggerAuthPayload) {
    runAuth(payload);
  }

  function updateUser(patch: Partial<User>) {
    setState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...patch } : prev.user,
    }));
  }

  return (
    <AuthContext.Provider value={{ ...state, switchDevUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { buildMockPayloadForUser };
