import "server-only";
import { config } from "./config";

// ----------------------------------------------------------------------------
// Server-side client for the TNG Identity *verifier* (OpenID4VP / SIOP).
// Docs: https://docs.teranode.group/tng-identity-documentation
//
// Flow: create a presentation request for a definition -> show authRequestURI as
// a QR to the holder's wallet -> poll status until "valid" -> read credentials.
// The x-api-key never leaves the server.
//
// NOTE: verified against a live TNG env (v2.2.0): the verifiable-presentation
// endpoints are under `/api/v1/verifiable-presentations` (no `/private`).
// ----------------------------------------------------------------------------

const VP_PATH = "/api/v1/verifiable-presentations";

export interface TngCreateResponse {
  correlationId: string;
  definitionId: string;
  authRequestURI: string;
  authStatusURI?: string;
}

export interface TngClaim {
  id?: string;
  dataType?: string;
  claimName: string;
  claimValue: string | number | boolean;
}

export interface TngCredential {
  id?: string;
  types?: string[];
  claims: TngClaim[];
}

export type TngStatus = "created" | "scanned" | "failed" | "valid" | "error";

export interface TngStatusResponse {
  correlationId: string;
  definitionId: string;
  status: TngStatus;
  credentials?: TngCredential[];
}

async function tng<T>(path: string, init: RequestInit): Promise<T> {
  const url = `${config.tngIdentity.verifierBaseUrl}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.tngIdentity.apiKey,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TNG ${path} → ${res.status} ${res.statusText}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

export const tngIdentity = {
  // List the verifier's presentation templates (each includes a definitionId).
  listTemplates<T = unknown>(): Promise<T> {
    return tng<T>("/api/v1/private/webapp/templates", { method: "GET" });
  },

  // Create a verification request for a presentation definition.
  createPresentationRequest(definitionId: string) {
    return tng<TngCreateResponse>(`${VP_PATH}/definition/${encodeURIComponent(definitionId)}`, {
      method: "POST",
    });
  },

  // Poll the status (and, once valid, the verified credentials) of a request.
  getStatus(correlationId: string) {
    return tng<TngStatusResponse>(`${VP_PATH}/${encodeURIComponent(correlationId)}`, {
      method: "GET",
    });
  },
};
