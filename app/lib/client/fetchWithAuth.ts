"use client";

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, { ...options, credentials: "include" });

  if (res.status !== 401) return res;

  // Silent refresh attempt
  const refreshRes = await fetch("/api/refresh", {
    method: "POST",
    credentials: "include",
  });

  if (!refreshRes.ok) {
    window.location.href = "/login";
    return res;
  }

  // Retry original request
  return fetch(url, { ...options, credentials: "include" });
}
