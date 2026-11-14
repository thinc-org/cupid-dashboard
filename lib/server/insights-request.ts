import "server-only";
import type { NextResponse } from "next/server";
import { authResponse } from "@/lib/server/auth-response";

export function resolveUpstreamUrl(
  apiUrl: string,
  upstreamPath: string,
  query: string,
  logPrefix: string,
  subjectLabel: string,
): { ok: true; url: URL } | { ok: false; response: NextResponse } {
  if (!apiUrl) {
    return {
      ok: false,
      response: configurationError(
        logPrefix,
        subjectLabel,
        "Set CUPID_API_URL on the dashboard server.",
      ),
    };
  }

  try {
    const url = new URL(apiUrl);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error("Invalid API URL");
    }
    const normalizedPath = upstreamPath.startsWith("/")
      ? upstreamPath
      : `/${upstreamPath}`;
    url.pathname = `${url.pathname.replace(/\/+$/, "")}${normalizedPath}`;
    url.search = query;
    return { ok: true, url };
  } catch {
    return {
      ok: false,
      response: configurationError(
        logPrefix,
        subjectLabel,
        "CUPID_API_URL must be an HTTP(S) backend base URL without credentials, query, or fragment.",
      ),
    };
  }
}

export function configurationError(
  logPrefix: string,
  subjectLabel: string,
  detail: string,
): NextResponse {
  console.error(`[${logPrefix}] ${detail}`);
  return authResponse(
    {
      message:
        process.env.NODE_ENV === "production"
          ? `${subjectLabel} are not configured. Contact the dashboard administrator.`
          : detail,
      code: "INSIGHTS_NOT_CONFIGURED",
    },
    503,
  );
}
