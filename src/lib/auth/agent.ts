import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export type AgentIdentity = {
  kind: "agent";
  agentId: string;
};

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Parse AUTH_AGENT_TOKENS as comma-separated `id:token` pairs.
 * Example: `hermes:abc123,openclaw:xyz789`
 * Also accepts a single bare token via AUTH_AGENT_TOKEN → id `default`.
 */
export function parseAgentTokenEntries(): Array<{ id: string; token: string }> {
  const entries: Array<{ id: string; token: string }> = [];
  const multi = process.env.AUTH_AGENT_TOKENS?.trim();
  if (multi) {
    for (const part of multi.split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const colon = trimmed.indexOf(":");
      if (colon <= 0) continue;
      const id = trimmed.slice(0, colon).trim();
      const token = trimmed.slice(colon + 1).trim();
      if (id && token) entries.push({ id, token });
    }
  }

  const single = process.env.AUTH_AGENT_TOKEN?.trim();
  if (single) {
    entries.push({ id: "default", token: single });
  }

  return entries;
}

export function getAgentFromRequest(
  request: NextRequest,
): AgentIdentity | null {
  const header = request.headers.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;

  const presented = match[1].trim();
  if (!presented) return null;

  for (const entry of parseAgentTokenEntries()) {
    if (safeEqual(presented, entry.token)) {
      return { kind: "agent", agentId: entry.id };
    }
  }
  return null;
}

export function isAgentAuthConfigured(): boolean {
  return parseAgentTokenEntries().length > 0;
}
