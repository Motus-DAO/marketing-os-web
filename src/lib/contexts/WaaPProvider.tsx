"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Address } from "viem";
import {
  getWalletConnectProjectId,
  isEmbeddedWaapLoginMethod,
  releaseHiddenWaapOverlayInput,
  releaseWaapOverlayInput,
} from "@/lib/wallet/config";
import { SIWE_CHAIN_ID } from "@/lib/auth/constants";

export interface WaaPUser {
  id: string;
  email?: { address: string };
  wallet?: { address: string };
}

export interface WaaPWallet {
  address: Address;
  walletClientType: "waap" | "external";
  chainId: string;
  connected: boolean;
}

interface WaaPContextType {
  ready: boolean;
  authenticated: boolean;
  user: WaaPUser | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  requestSharedEmail: () => Promise<string | null>;
  wallets: WaaPWallet[];
  waapProvider: unknown | null;
  isWaaPReady: boolean;
}

const WaaPContext = createContext<WaaPContextType>({
  ready: false,
  authenticated: false,
  user: null,
  login: async () => {},
  logout: async () => {},
  requestSharedEmail: async () => null,
  wallets: [],
  waapProvider: null,
  isWaaPReady: false,
});

const LOCAL_USER_KEY = "mos_waap_user";

export function WaaPProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState<WaaPUser | null>(null);
  const [wallets, setWallets] = useState<WaaPWallet[]>([]);
  const [waapProvider, setWaaPProvider] = useState<unknown | null>(null);
  const [isWaaPReady, setIsWaaPReady] = useState(false);
  const loginInFlightRef = useRef(false);
  const emailRequestInFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let providerInstance: { destroy?: () => void; preload?: () => Promise<void> } | null =
      null;
    let cancelPreload: (() => void) | undefined;
    let unsubscribeLifecycle: (() => void) | undefined;

    const initializeWaaP = async () => {
      try {
        const waapSdk = await import("@human.tech/waap-sdk/evm").catch(() => null);

        if (!waapSdk) {
          console.warn("[WAAP] SDK not found (@human.tech/waap-sdk)");
          if (!cancelled) {
            setReady(true);
            setIsWaaPReady(false);
          }
          return;
        }

        const walletConnectProjectId = getWalletConnectProjectId();
        const authenticationMethods: Array<"email" | "phone" | "social" | "wallet"> =
          walletConnectProjectId
            ? ["email", "phone", "social", "wallet"]
            : ["email", "phone", "social"];

        if (!walletConnectProjectId) {
          console.warn(
            "[WAAP] WalletConnect project ID unset — external wallets disabled. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.",
          );
        }

        const origin =
          typeof window !== "undefined" ? window.location.origin : undefined;

        const provider = waapSdk.initWaaP({
          environment: "production",
          config: {
            authenticationMethods,
            allowedSocials: ["google", "twitter"],
            styles: { darkMode: true },
          },
          project: {
            name: "MotusDAO Marketing OS",
            ...(origin ? { logo: `${origin}/favicon.ico` } : {}),
            entryTitle: "MotusDAO Marketing OS",
          },
          walletConnectProjectId,
        });

        if (cancelled) {
          provider.destroy?.();
          return;
        }

        providerInstance = provider;
        setWaaPProvider(provider);
        setIsWaaPReady(true);
        setReady(true);

        unsubscribeLifecycle = waapSdk.subscribeWaaPIframeLifecycle((event) => {
          if (
            event.phase === "modal_hidden" ||
            event.phase === "modal_cancelled"
          ) {
            window.setTimeout(() => {
              releaseHiddenWaapOverlayInput();
              releaseWaapOverlayInput();
            }, 200);
          }
        });

        if (typeof waapSdk.preloadWaaPOnIdle === "function") {
          cancelPreload = waapSdk.preloadWaaPOnIdle(provider, {
            onError: () => {},
          });
        } else {
          void provider.preload?.().catch(() => {});
        }

        await checkExistingSession(provider);
      } catch (error) {
        console.error("[WAAP] Init error:", error);
        if (!cancelled) setReady(true);
      }
    };

    void initializeWaaP();

    return () => {
      cancelled = true;
      unsubscribeLifecycle?.();
      cancelPreload?.();
      try {
        providerInstance?.destroy?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const checkExistingSession = async (provider: unknown) => {
    try {
      const waap = provider as {
        request: (args: {
          method: string;
          params?: unknown[];
          timeoutMs?: number;
        }) => Promise<unknown>;
        getLoginMethod: () => string | null;
      };

      const loginMethod = waap.getLoginMethod?.();
      if (!loginMethod) return;

      const accounts = (await waap.request({
        method: "eth_accounts",
        timeoutMs: 8_000,
      })) as string[];

      const address = accounts?.[0] as Address | undefined;
      if (!address) {
        setAuthenticated(false);
        setUser(null);
        setWallets([]);
        localStorage.removeItem(LOCAL_USER_KEY);
        return;
      }

      const walletType = isEmbeddedWaapLoginMethod(loginMethod)
        ? "waap"
        : "external";

      setAuthenticated(true);
      setWallets([
        {
          address,
          walletClientType: walletType,
          chainId: SIWE_CHAIN_ID.toString(),
          connected: true,
        },
      ]);

      const storedUser = localStorage.getItem(LOCAL_USER_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser) as WaaPUser);
      } else {
        setUser({
          id: `waap_${address.slice(2, 10)}`,
          wallet: { address },
        });
      }
    } catch (error) {
      console.warn("[WAAP] Auto-connect failed:", error);
      setAuthenticated(false);
      setUser(null);
      setWallets([]);
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  };

  const login = useCallback(async () => {
    if (!isWaaPReady || !waapProvider) {
      throw new Error("WaaP not initialized. Install @human.tech/waap-sdk");
    }

    if (loginInFlightRef.current) return;
    loginInFlightRef.current = true;

    try {
      const waap = waapProvider as {
        login: () => Promise<string | null>;
        request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        requestEmail?: () => Promise<string>;
        getCanonicalAccountStatus?: () => Promise<{
          accounts?: { evm?: string };
        }>;
      };

      const loginType = await waap.login();
      if (loginType === null) return;

      let accounts = (await waap.request({ method: "eth_accounts" })) as string[];
      if (!accounts?.length) {
        const status = await waap.getCanonicalAccountStatus?.();
        accounts = status?.accounts?.evm ? [status.accounts.evm] : [];
      }
      if (!accounts?.length) {
        throw new Error(
          "Human Tech authenticated but returned no active EVM account",
        );
      }

      const address = accounts[0] as Address;
      const walletType = isEmbeddedWaapLoginMethod(loginType)
        ? "waap"
        : "external";

      let restoredEmail: string | undefined;
      try {
        const storedUser = localStorage.getItem(LOCAL_USER_KEY);
        if (storedUser) {
          restoredEmail = (JSON.parse(storedUser) as WaaPUser).email?.address;
        }
      } catch {
        // ignore
      }

      const waapUser: WaaPUser = {
        id: `waap_${address.slice(2, 10)}`,
        email: restoredEmail ? { address: restoredEmail } : undefined,
        wallet: { address },
      };

      setAuthenticated(true);
      setWallets([
        {
          address,
          walletClientType: walletType,
          chainId: SIWE_CHAIN_ID.toString(),
          connected: true,
        },
      ]);
      setUser(waapUser);
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(waapUser));

      // Email is required for Marketing OS allowlist. Request once for embedded login.
      if (
        !restoredEmail &&
        isEmbeddedWaapLoginMethod(loginType) &&
        waap.requestEmail &&
        !emailRequestInFlightRef.current
      ) {
        emailRequestInFlightRef.current = true;
        try {
          const sharedEmail = await waap.requestEmail();
          if (sharedEmail?.includes("@")) {
            const userWithEmail: WaaPUser = {
              ...waapUser,
              email: { address: sharedEmail },
            };
            setUser(userWithEmail);
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userWithEmail));
          }
        } catch (error) {
          console.log("[WAAP] Email sharing declined or failed:", error);
        } finally {
          emailRequestInFlightRef.current = false;
        }
      }
    } catch (error) {
      console.error("[WAAP] Login error:", error);
      throw error;
    } finally {
      loginInFlightRef.current = false;
    }
  }, [waapProvider, isWaaPReady]);

  const requestSharedEmail = useCallback(async (): Promise<string | null> => {
    if (!waapProvider) return null;
    if (emailRequestInFlightRef.current) return null;

    const waap = waapProvider as {
      requestEmail?: () => Promise<string>;
      getLoginMethod?: () => string | null;
    };

    const method = waap.getLoginMethod?.();
    if (!isEmbeddedWaapLoginMethod(method)) {
      return user?.email?.address ?? null;
    }

    emailRequestInFlightRef.current = true;
    try {
      const email = await waap.requestEmail?.();
      if (!email) return null;
      setUser((prev) => {
        const next: WaaPUser = prev
          ? { ...prev, email: { address: email } }
          : { id: `waap_${Date.now()}`, email: { address: email } };
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(next));
        return next;
      });
      return email;
    } catch (error) {
      console.log("[WAAP] requestEmail declined or failed:", error);
      return null;
    } finally {
      emailRequestInFlightRef.current = false;
    }
  }, [waapProvider, user?.email?.address]);

  const logout = useCallback(async () => {
    try {
      if (waapProvider) {
        const waap = waapProvider as { logout: () => Promise<void> };
        await waap.logout();
      }
    } catch (error) {
      console.log("[WAAP] Logout error (continuing):", error);
    }

    setAuthenticated(false);
    setUser(null);
    setWallets([]);
    localStorage.removeItem(LOCAL_USER_KEY);
  }, [waapProvider]);

  useEffect(() => {
    if (!waapProvider) return;

    const waap = waapProvider as {
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
      getLoginMethod: () => string | null;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };

    let emptyAccountsTimer: ReturnType<typeof setTimeout> | null = null;

    const clearLocalAuth = () => {
      setAuthenticated(false);
      setUser(null);
      setWallets([]);
    };

    const handleAccountsChanged = (accounts: unknown) => {
      const accountsArray = accounts as string[];
      if (emptyAccountsTimer) {
        clearTimeout(emptyAccountsTimer);
        emptyAccountsTimer = null;
      }

      if (accountsArray.length === 0) {
        emptyAccountsTimer = setTimeout(() => {
          void (async () => {
            try {
              const still = (await waap.request({
                method: "eth_accounts",
              })) as string[];
              if (still?.length) return;
            } catch {
              // fall through
            }
            clearLocalAuth();
          })();
        }, 1_500);
        return;
      }

      const loginMethod = waap.getLoginMethod?.();
      const walletType = isEmbeddedWaapLoginMethod(loginMethod)
        ? "waap"
        : "external";

      setAuthenticated(true);
      setWallets([
        {
          address: accountsArray[0] as Address,
          walletClientType: walletType,
          chainId: SIWE_CHAIN_ID.toString(),
          connected: true,
        },
      ]);
      setUser((prev) =>
        prev ? { ...prev, wallet: { address: accountsArray[0] } } : null,
      );
    };

    const handleDisconnect = () => {
      if (emptyAccountsTimer) clearTimeout(emptyAccountsTimer);
      emptyAccountsTimer = setTimeout(() => {
        void (async () => {
          try {
            const still = (await waap.request({
              method: "eth_accounts",
            })) as string[];
            if (still?.length) return;
          } catch {
            // fall through
          }
          clearLocalAuth();
        })();
      }, 1_500);
    };

    waap.on("accountsChanged", handleAccountsChanged);
    waap.on("disconnect", handleDisconnect);

    return () => {
      if (emptyAccountsTimer) clearTimeout(emptyAccountsTimer);
      waap.removeListener("accountsChanged", handleAccountsChanged);
      waap.removeListener("disconnect", handleDisconnect);
    };
  }, [waapProvider]);

  return (
    <WaaPContext.Provider
      value={{
        ready,
        authenticated,
        user,
        login,
        logout,
        requestSharedEmail,
        wallets,
        waapProvider,
        isWaaPReady,
      }}
    >
      {children}
    </WaaPContext.Provider>
  );
}

export function useWaaP() {
  return useContext(WaaPContext);
}

export function useWaaPWallets() {
  const { wallets } = useContext(WaaPContext);
  return { wallets };
}

export function useWaaPProvider() {
  const { waapProvider, isWaaPReady } = useContext(WaaPContext);
  return { provider: waapProvider, isReady: isWaaPReady };
}
