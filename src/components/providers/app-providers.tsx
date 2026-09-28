"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { WaaPProvider } from "@/lib/contexts/WaaPProvider";
import { AppSessionProvider } from "@/components/auth/AppSessionProvider";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
}

const client = new ConvexReactClient(convexUrl);

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={client}>
      <WaaPProvider>
        <AppSessionProvider>{children}</AppSessionProvider>
      </WaaPProvider>
    </ConvexProvider>
  );
}
