/** Session cookie for MotusDAO Marketing OS SIWE auth. */
export const SESSION_COOKIE_NAME = "mos_session";

/** 7 days */
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** HMAC-signed nonce lifetime (stateless; no shared memory). */
export const NONCE_TTL_MS = 5 * 60 * 1000;

export const SIWE_STATEMENT = "Sign in to MotusDAO Marketing OS";

/**
 * Chain ID embedded in SIWE messages.
 * Matches MotusDAO Hub (Celo mainnet). Signing does not require funds on Celo;
 * WaaP embedded wallets can sign personal_sign on any chain.
 */
export const SIWE_CHAIN_ID = 42220;

export const SIWE_SIGN_TIMEOUT_MS = 90_000;
export const SIWE_SESSION_LOADING_TIMEOUT_MS = 20_000;
