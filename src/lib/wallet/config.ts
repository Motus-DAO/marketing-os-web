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
