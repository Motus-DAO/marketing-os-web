"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  dismissWaapWalletOverlay,
  isWaapOverlayBlockingPage,
  isWaapOverlayStuckBlank,
  syncWaapOverlayInput,
} from "@/lib/wallet/waap-modal-recovery";

const POLL_MS = 2_000;
const ESCAPE_Z_INDEX = 2147483647;

/**
 * Escape hatch ONLY for blank Human Tech shells (no usable UI).
 */
export function WaapStuckModalGuard() {
  const [showEscape, setShowEscape] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let getDiagnostics: (() => {
      modalPhase?: "idle" | "pending" | "visible" | "hidden";
      visualReadyAt?: number | null;
      modalRequestedAt?: number | null;
      usedVisualFallback?: boolean;
    }) | null = null;

    const load = async () => {
      try {
        const mod = await import("@human.tech/waap-sdk");
        if (cancelled) return;
        getDiagnostics = () => mod.getWaaPIframeDiagnostics();
      } catch {
        getDiagnostics = null;
      }
    };

    void load();

    const poll = window.setInterval(() => {
      if (!getDiagnostics) {
        setShowEscape(false);
        return;
      }
      try {
        const diagnostics = getDiagnostics();
        const showRecovery =
          isWaapOverlayStuckBlank(diagnostics) && isWaapOverlayBlockingPage();
        syncWaapOverlayInput(diagnostics);
        setShowEscape(showRecovery);
      } catch {
        setShowEscape(false);
      }
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    dismissWaapWalletOverlay();
    setShowEscape(false);
  }, []);

  if (!mounted || !showEscape || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed bottom-4 left-1/2 flex w-[min(92vw,24rem)] -translate-x-1/2 flex-col gap-2 rounded-xl border border-amber-400/40 bg-[#1a1224]/95 p-3 shadow-2xl"
      style={{ zIndex: ESCAPE_Z_INDEX }}
    >
      <p className="text-sm text-amber-50">
        El modal de wallet no cargó. Ciérralo e intenta de nuevo.
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500/90 px-3 py-2 text-sm font-medium text-black hover:bg-amber-400"
      >
        Cerrar modal de wallet
      </button>
    </div>,
    document.body,
  );
}
