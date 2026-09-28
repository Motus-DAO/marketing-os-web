import { NextResponse, type NextRequest } from "next/server";
import { getAgentFromRequest, type AgentIdentity } from "./agent";
import { getSessionFromRequest, type SessionPayload } from "./session";
import { isEmailAllowed } from "./allowlist";

export type Caller =
  | { kind: "human"; session: SessionPayload }
  | AgentIdentity;

export async function requireHumanOrAgent(
  request: NextRequest,
): Promise<Caller | NextResponse> {
  const agent = getAgentFromRequest(request);
  if (agent) return agent;

  const session = await getSessionFromRequest(request);
  if (session && isEmailAllowed(session.email)) {
    return { kind: "human", session };
  }

  return NextResponse.json(
    {
      error: "Authentication required",
      hint: "Use WaaP SIWE session cookie, or Authorization: Bearer <agent-token>",
    },
    { status: 401 },
  );
}

export function isCallerResponse(
  value: Caller | NextResponse,
): value is NextResponse {
  return value instanceof NextResponse;
}
