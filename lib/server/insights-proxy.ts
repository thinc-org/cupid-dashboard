import "server-only";
import type { NextRequest } from "next/server";
import {
  authenticateStaffRequest,
  authResponse,
} from "@/lib/server/auth-response";
import { resolveUpstreamUrl } from "@/lib/server/insights-request";
import {
  fetchUpstream,
  handleUpstreamResponse,
} from "@/lib/server/upstream-client";

type QueryParser = (
  params: URLSearchParams,
) => { ok: true; query: string } | { ok: false; message: string };

type ProxyInsightsOptions = {
  request: NextRequest;
  upstreamPath: string;
  logPrefix: string;
  subjectLabel: string;
  parseQuery: QueryParser;
  parseResponse: (body: unknown, query?: string) => object | null;
  mockHandler?: (request: NextRequest, query: string) => object | null;
};

export async function proxyInsightsRequest({
  request,
  upstreamPath,
  logPrefix,
  subjectLabel,
  parseQuery,
  parseResponse,
  mockHandler,
}: ProxyInsightsOptions) {
  const auth = await authenticateStaffRequest(request);
  if (!auth.ok) return auth.response;

  const parsed = parseQuery(request.nextUrl.searchParams);
  if (!parsed.ok) return authResponse({ message: parsed.message }, 400);

  if (mockHandler) {
    const mockData = mockHandler(request, parsed.query);
    if (mockData !== null) {
      const sanitized = parseResponse(mockData, parsed.query);
      if (!sanitized) {
        return authResponse(
          { message: `${subjectLabel} returned an unexpected response.` },
          502,
        );
      }
      return authResponse(sanitized);
    }
  }

  const target = resolveUpstreamUrl(
    process.env.CUPID_API_URL?.trim() ?? "",
    upstreamPath,
    parsed.query,
    logPrefix,
    subjectLabel,
  );
  if (!target.ok) return target.response;

  const fetched = await fetchUpstream(target.url, auth.token, subjectLabel);
  if (!fetched.ok) return fetched.response;

  return handleUpstreamResponse({
    upstream: fetched.upstream,
    signal: fetched.signal,
    query: parsed.query,
    token: auth.token,
    config: auth.config,
    logPrefix,
    subjectLabel,
    parseResponse,
  });
}
