"use client";

import type { AuthMode } from "@/types";

export function getAuthMode(): AuthMode {
  const env = (process.env.NEXT_PUBLIC_AUTH_MODE ?? "local").toLowerCase();
  const url = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("auth")?.toLowerCase()
    : null;
  const valid: AuthMode[] = ["local", "sso", "both"];
  if (url && valid.includes(url as AuthMode)) return url as AuthMode;
  return valid.includes(env as AuthMode) ? (env as AuthMode) : "local";
}

export async function localLogin(engineer: string, password: string): Promise<string> {
  if (!engineer.trim()) throw new Error("Please enter your name.");
  if (!password) throw new Error("Please enter the password.");

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Sign-in failed.");

  return engineer.trim();
}

export async function msalLogin(engineer: string): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_AAD_CLIENT_ID;
  const tenantId = process.env.NEXT_PUBLIC_AAD_TENANT_ID;
  if (!clientId || !tenantId) {
    throw new Error("SSO not configured. Set NEXT_PUBLIC_AAD_CLIENT_ID and NEXT_PUBLIC_AAD_TENANT_ID.");
  }

  const { PublicClientApplication } = await import("@azure/msal-browser");
  const pca = new PublicClientApplication({
    auth: {
      clientId,
      authority: `https://login.microsoftonline.com/${tenantId}`,
      redirectUri: window.location.origin,
    },
    cache: { cacheLocation: "localStorage" as const },
  });

  await pca.initialize();
  await pca.handleRedirectPromise().catch(() => null);

  let account = pca.getActiveAccount() ?? pca.getAllAccounts()?.[0] ?? null;
  if (account) pca.setActiveAccount(account);

  if (!account) {
    try {
      const res = await pca.loginPopup({ scopes: ["User.Read"] });
      account = res.account;
      if (account) pca.setActiveAccount(account);
    } catch (err: unknown) {
      const msg = ((err as { message?: string })?.message ?? "").toLowerCase();
      if (msg.includes("popup")) {
        await pca.loginRedirect({ scopes: ["User.Read"] });
        return engineer || "Unknown";
      }
      throw err;
    }
  }

  return account?.name ?? account?.username ?? engineer ?? "Unknown";
}
