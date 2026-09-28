"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useWaaP } from "@/lib/contexts/WaaPProvider";
import { logoutAppSession } from "@/lib/auth/client";

/**
 * Clears the mos_session cookie only after a confirmed WaaP disconnect.
 * Debounced so brief unauthenticated gaps during personal_sign do not wipe auth.
 */
export function AppSessionProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated } = useWaaP();
  const hadAuthenticated = useRef(false);
  const authenticatedRef = useRef(authenticated);
  authenticatedRef.current = authenticated;

  useEffect(() => {
    if (!ready) return;

    if (authenticated) {
      hadAuthenticated.current = true;
      return;
    }

    if (!hadAuthenticated.current) return;

    const timer = window.setTimeout(() => {
      if (!authenticatedRef.current && hadAuthenticated.current) {
        hadAuthenticated.current = false;
        void logoutAppSession();
      }
    }, 2_000);

    return () => window.clearTimeout(timer);
  }, [ready, authenticated]);

  return <>{children}</>;
}
