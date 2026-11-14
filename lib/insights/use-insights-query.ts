"use client";

import { useEffect, useRef, useState } from "react";

type InsightsQueryLabels = {
  subject: string;
  fallbackError?: string;
};

/**
 * Fetches and validates an aggregate insights JSON endpoint with a 15-second
 * abort timeout and cancellation on unmount or URL change.
 */
export function useInsightsQuery<T>(
  url: string | null,
  parse: (body: unknown) => T | null,
  labels: InsightsQueryLabels,
  onLoadingChange?: (loading: boolean) => void,
): { data: T | null; error: string; loading: boolean } {
  const { subject, fallbackError } = labels;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const onLoadingChangeRef = useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;

  useEffect(() => {
    if (!url) {
      setLoading(false);
      onLoadingChangeRef.current?.(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    setLoading(true);
    onLoadingChangeRef.current?.(true);
    setError("");

    void (async () => {
      try {
        const response = await fetch(url, {
          credentials: "same-origin",
          signal: controller.signal,
        });
        let body: unknown = null;
        try {
          body = await response.json();
        } catch (err) {
          if (controller.signal.aborted) throw err;
        }
        if (!active) return;

        if (!response.ok) {
          const message =
            body &&
            typeof body === "object" &&
            "message" in body &&
            typeof body.message === "string"
              ? body.message
              : (fallbackError ?? `${subject} could not be loaded.`);
          setData(null);
          setError(message);
          return;
        }

        const parsed = parse(body);
        if (!parsed) {
          setData(null);
          setError(`${subject} returned an unexpected response.`);
          return;
        }
        setData(parsed);
      } catch {
        if (active) {
          setData(null);
          setError(
            controller.signal.aborted
              ? `${subject} took too long to load. Please try again.`
              : `${subject} could not be reached.`,
          );
        }
      } finally {
        clearTimeout(timeout);
        if (active) {
          setLoading(false);
          onLoadingChangeRef.current?.(false);
        }
      }
    })();

    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
      onLoadingChangeRef.current?.(false);
    };
  }, [url, parse, subject, fallbackError]);

  return { data, error, loading };
}
