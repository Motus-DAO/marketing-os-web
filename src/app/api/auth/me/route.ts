import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, handleAuthError } from "@/lib/auth/session";
import { isEmailAllowed } from "@/lib/auth/allowlist";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Re-check allowlist so revoking an email invalidates access without waiting for JWT expiry.
    if (!isEmailAllowed(session.email)) {
      return NextResponse.json(
        { authenticated: false, error: "Email no longer allowlisted" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      authenticated: true,
      userId: session.userId,
      eoaAddress: session.eoaAddress,
      email: session.email,
      authProvider: session.authProvider,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;

    console.error("[auth/me] Error:", error);
    return NextResponse.json(
      { error: "Failed to read session" },
      { status: 500 },
    );
  }
}
