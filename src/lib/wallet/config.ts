/**
 * WalletConnect Cloud project id for external wallet login in WaaP.
 * Accepts both env name spellings used across Motus repos.
 */
export function getWalletConnectProjectId(): string | undefined {
  const projectId = (
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
  )?.trim();
  return projectId || undefined;
}

export function isEmbeddedWaapLoginMethod(
  method: string | null | undefined,
): boolean {
  return method === "waap" || method === "human";
}

const OVERLAY_SELECTORS = [
  "#waap-wallet-iframe-container",
  "#silk-wallet-iframe-container",
  "[id*='waap-wallet-iframe']",
  "[id*='silk-wallet-iframe']",
];

export function releaseHiddenWaapOverlayInput(): boolean {
  if (typeof window === "undefined") return false;
  let released = false;
  for (const selector of OVERLAY_SELECTORS) {
    document.querySelectorAll(selector).forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const style = window.getComputedStyle(node);
      const opacity = Number.parseFloat(style.opacity);
      const isHidden =
        style.display === "none" ||
        style.visibility === "hidden" ||
        (!Number.isNaN(opacity) && opacity === 0);
      if (isHidden && style.pointerEvents !== "none") {
        node.style.pointerEvents = "none";
        released = true;
      }
    });
  }
  return released;
}

export function releaseWaapOverlayInput(): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return false;
  }
  let released = false;
  for (const selector of OVERLAY_SELECTORS) {
    document.querySelectorAll(selector).forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      if (window.getComputedStyle(node).pointerEvents !== "none") {
        node.style.pointerEvents = "none";
        released = true;
      }
    });
  }
  if (released) {
    console.warn("[WAAP] Released wallet overlay pointer capture");
  }
  return released;
}
