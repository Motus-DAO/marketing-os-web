import { NextRequest, NextResponse } from "next/server";
import { consumeSignedNonce } from "@/lib/auth/nonce";
import {
  createSessionToken,
  getRequestDomain,
  getSessionCookieOptions,
  type SessionPayload,
} from "@/lib/auth/session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { AuthError, handleAuthError } from "@/lib/auth/errors";
import { verifySiweLogin } from "@/lib/auth/verify-siwe";
import { isEmailAllowed, normalizeEmail } from "@/lib/auth/allowlist";

type VerifyBody = {
  message?: string;
  signature?: string;
  email?: string;
  authProvider?: "waap" | "external";
  authProviderId?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyBody;

    if (!body.message || !body.signature) {
      return NextResponse.json(
        { error: "message and signature are required" },
        { status: 400 },
      );
    }

    if (!body.email || !body.email.includes("@")) {
      return NextResponse.json(
        {
          error:
            "A verified email is required. Sign in with Google/email via WaaP and share your email.",
        },
        { status: 400 },
      );
    }

    const email = normalizeEmail(body.email);
    if (!isEmailAllowed(email)) {
      throw new AuthError(
        403,
        "Email is not on the Marketing OS allowlist (AUTH_ALLOWED_EMAILS).",
      );
    }

    const domain = getRequestDomain(request);
    const { address, nonce } = await verifySiweLogin({
      message: body.message,
      signature: body.signature,
      domain,
    });

    if (!consumeSignedNonce(address, nonce)) {
      throw new AuthError(401, "Invalid or expired nonce");
    }

    const sessionPayload: SessionPayload = {
      sub: body.authProviderId ?? `waap_${address.slice(2, 10)}`,
      eoa: address.toLowerCase(),
      email,
      authProvider: body.authProvider ?? "waap",
    };

    const token = createSessionToken(sessionPayload);
    const response = NextResponse.json({
      success: true,
      userId: sessionPayload.sub,
      eoaAddress: address,
      email,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    const message =
      error instanceof Error
        ? error.message
        : "Authentication verification failed";
    console.error("[auth/verify] Error:", error);
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
