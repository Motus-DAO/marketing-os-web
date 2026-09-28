"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  useWaaP,
  useWaaPProvider,
  useWaaPWallets,
} from "@/lib/contexts/WaaPProvider";
import {
  establishSiweSession,
  fetchAppSession,
  isUserRejectedSignError,
  logoutAppSession,
} from "@/lib/auth/client";
import { releaseWaapOverlayInput } from "@/lib/wallet/config";

type AccessState =
  | "loading"
  | "unauthenticated"
  | "needs_email"
  | "needs_signature"
  | "forbidden"
  | "authorized";

export function AuthGate({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout, user, requestSharedEmail } =
    useWaaP();
  const { provider } = useWaaPProvider();
  const { wallets } = useWaaPWallets();
  const eoaAddress = wallets[0]?.address ?? null;

  const [access, setAccess] = useState<AccessState>("loading");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAccess = useCallback(async () => {
    if (!ready) return;

    if (!authenticated) {
      setAccess("unauthenticated");
      setSessionEmail(null);
      return;
    }

    setError(null);

    const session = await fetchAppSession();
    if (
      session.authenticated &&
      session.email &&
      (!eoaAddress ||
        session.eoaAddress?.toLowerCase() === eoaAddress.toLowerCase())
    ) {
      setSessionEmail(session.email);
      setAccess("authorized");
      return;
    }

    if (!user?.email?.address) {
      setAccess("needs_email");
      return;
    }

    setAccess("needs_signature");
  }, [ready, authenticated, eoaAddress, user?.email?.address]);

  useEffect(() => {
    void checkAccess();
  }, [checkAccess]);

  // Human Tech often leaves an invisible iframe that steals clicks after login.
  useEffect(() => {
    if (
      access === "needs_signature" ||
      access === "needs_email" ||
      access === "forbidden" ||
      access === "unauthenticated"
    ) {
      releaseWaapOverlayInput();
      const t = window.setTimeout(() => releaseWaapOverlayInput(), 300);
      return () => window.clearTimeout(t);
    }
  }, [access]);

  const handleLogin = async () => {
    setBusy(true);
    setError(null);
    try {
      await login();
      await checkAccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo iniciar sesión con WaaP.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRequestEmail = async () => {
    setBusy(true);
    setError(null);
    try {
      const email = await requestSharedEmail();
      if (!email) {
        setError(
          "Necesitamos tu email (Google o email en Human Tech) para verificar el acceso.",
        );
        setAccess("needs_email");
        return;
      }
      await checkAccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo obtener el email.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = async () => {
    releaseWaapOverlayInput();
    if (!provider) {
      setError("Wallet no disponible. Recarga la página e intenta de nuevo.");
      return;
    }

    const email = user?.email?.address;
    if (!email) {
      setAccess("needs_email");
      return;
    }

    setSigning(true);
    setError(null);

    try {
      await establishSiweSession({
        waapProvider: provider,
        email,
        authProvider: "waap",
        authProviderId: user?.id,
      });
      await checkAccess();
    } catch (err) {
      console.error("[AuthGate] SIWE failed:", err);
      if (err instanceof Error && err.name === "SignMessageError") {
        setError(err.message);
      } else if (isUserRejectedSignError(err)) {
        setError(
          "Rechazaste la firma. Intenta de nuevo y acepta la solicitud en tu wallet.",
        );
      } else {
        const message =
          err instanceof Error ? err.message : "No se pudo firmar el mensaje.";
        setError(message);
        const denied =
          message.toLowerCase().includes("allowlist") ||
          message.toLowerCase().includes("not authorized") ||
          message.toLowerCase().includes("not allowed");
        setAccess(denied ? "forbidden" : "needs_signature");
        return;
      }
      setAccess("needs_signature");
    } finally {
      setSigning(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    try {
      await logoutAppSession();
      await logout();
      setAccess("unauthenticated");
      setSessionEmail(null);
    } finally {
      setBusy(false);
    }
  };

  if (!ready || access === "loading") {
    return (
      <AuthScreen>
        <p className="muted">Verificando acceso…</p>
      </AuthScreen>
    );
  }

  if (access === "unauthenticated") {
    return (
      <AuthScreen>
        <p className="eyebrow">MotusDAO</p>
        <h1 className="auth-title">MotusDAO Marketing OS</h1>
        <p className="muted auth-copy">
          Inicia sesión con Human Tech (email o Google) para continuar.
        </p>
        {error && <p className="auth-error">{error}</p>}
        <button
          type="button"
          className="auth-primary-btn"
          disabled={busy}
          onClick={() => void handleLogin()}
        >
          {busy ? "Abriendo Human Tech…" : "Iniciar sesión con WaaP"}
        </button>
      </AuthScreen>
    );
  }

  if (access === "needs_email") {
    return (
      <AuthScreen>
        <p className="eyebrow">MotusDAO</p>
        <h1 className="auth-title">MotusDAO Marketing OS</h1>
        <p className="muted auth-copy">
          Tu wallet está conectada, pero necesitamos un email verificado
          (preferiblemente Google) para comprobar la allowlist.
        </p>
        {eoaAddress && (
          <p className="auth-mono muted">{eoaAddress}</p>
        )}
        {error && <p className="auth-error">{error}</p>}
        <button
          type="button"
          className="auth-primary-btn"
          disabled={busy}
          onClick={() => void handleRequestEmail()}
        >
          {busy ? "Solicitando email…" : "Compartir email con Human Tech"}
        </button>
        <button
          type="button"
          className="auth-secondary-btn"
          disabled={busy}
          onClick={() => void handleLogout()}
        >
          Cerrar sesión / usar otra cuenta
        </button>
      </AuthScreen>
    );
  }

  if (access === "needs_signature") {
    return (
      <AuthScreen>
        <p className="eyebrow">MotusDAO</p>
        <h1 className="auth-title">Firma de acceso</h1>
        <p className="muted auth-copy">
          Firma un mensaje para verificar tu wallet. No cuesta gas.
        </p>
        {user?.email?.address && (
          <p className="auth-mono muted">{user.email.address}</p>
        )}
        {error && <p className="auth-error">{error}</p>}
        <button
          type="button"
          className="auth-primary-btn"
          disabled={signing}
          onClick={() => void handleSignIn()}
        >
          {signing ? "Esperando firma…" : "Firmar mensaje de acceso"}
        </button>
        <button
          type="button"
          className="auth-secondary-btn"
          disabled={signing || busy}
          onClick={() => void handleLogout()}
        >
          Cancelar
        </button>
      </AuthScreen>
    );
  }

  if (access === "forbidden") {
    return (
      <AuthScreen>
        <p className="eyebrow">MotusDAO</p>
        <h1 className="auth-title">Acceso denegado</h1>
        <p className="muted auth-copy">
          Este email no está en la allowlist de Marketing OS. Contacta al
          administrador si necesitas acceso.
        </p>
        {(user?.email?.address || sessionEmail) && (
          <p className="auth-mono muted">
            {user?.email?.address || sessionEmail}
          </p>
        )}
        {error && <p className="auth-error">{error}</p>}
        <button
          type="button"
          className="auth-primary-btn"
          disabled={busy}
          onClick={() => void handleLogout()}
        >
          Usar otra cuenta
        </button>
      </AuthScreen>
    );
  }

  return <>{children}</>;
}

function AuthScreen({ children }: { children: ReactNode }) {
  return (
    <div className="auth-gate">
      <div className="auth-card panel">{children}</div>
    </div>
  );
}

/** Header slot: email + logout when session is ready. */
export function AuthHeaderStatus() {
  const { authenticated, user, logout } = useWaaP();
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authenticated) {
      setEmail(null);
      return;
    }
    void fetchAppSession().then((session) => {
      setEmail(session.email || user?.email?.address || null);
    });
  }, [authenticated, user?.email?.address]);

  if (!email) return null;

  return (
    <div className="auth-header-status">
      <span className="auth-header-email" title={email}>
        {email}
      </span>
      <button
        type="button"
        className="auth-logout-btn"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void (async () => {
            try {
              await logoutAppSession();
              await logout();
            } finally {
              setBusy(false);
            }
          })();
        }}
      >
        Logout
      </button>
    </div>
  );
}
