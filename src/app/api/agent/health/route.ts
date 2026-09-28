import { NextRequest, NextResponse } from "next/server";
import {
  getAgentFromRequest,
  isAgentAuthConfigured,
} from "@/lib/auth/agent";

export const dynamic = "force-dynamic";

/** Agent ping — confirms Bearer token works. */
export async function GET(request: NextRequest) {
  if (!isAgentAuthConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Agent auth not configured",
        hint: "Set AUTH_AGENT_TOKEN or AUTH_AGENT_TOKENS on the server",
      },
      { status: 503 },
    );
  }

  const agent = getAgentFromRequest(request);
  if (!agent) {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid or missing agent token",
        hint: "Authorization: Bearer <token>",
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    agentId: agent.agentId,
    service: "motusdao-marketing-os",
    endpoints: [
      "GET /api/agent/health",
      "GET /api/agent/analytics/overview?site=all&range=7d",
    ],
  });
}
