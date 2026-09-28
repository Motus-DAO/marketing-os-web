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
];

export function releaseHiddenWaapOverlayInput(): boolean {
  if (typeof window === "undefined") return false;
  let released = false;
  for (const selector of OVERLAY_SELECTORS) {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) continue;
    const style = window.getComputedStyle(element);
    const opacity = Number.parseFloat(style.opacity);
    const isHidden =
      style.display === "none" ||
      style.visibility === "hidden" ||
      (!Number.isNaN(opacity) && opacity === 0);
    if (isHidden && style.pointerEvents !== "none") {
      element.style.pointerEvents = "none";
      released = true;
    }
  }
  return released;
}

export function releaseWaapOverlayInput(): boolean {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return false;
  }
  let released = false;
  for (const selector of OVERLAY_SELECTORS) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element && window.getComputedStyle(element).pointerEvents !== "none") {
      element.style.pointerEvents = "none";
      released = true;
    }
  }
  return released;
}
