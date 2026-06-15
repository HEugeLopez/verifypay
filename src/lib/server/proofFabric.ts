import "server-only";
import { config } from "./config";

// ----------------------------------------------------------------------------
// Server-side client for the Proof Fabric Protocol (PFP).
// Docs: https://fea-crypto.emergent.host/api/docs
// The X-API-Key never leaves the server.
// ----------------------------------------------------------------------------

export interface FEAGenerateInput {
  idempotencyKey: string;
  transactionId: string;
  timestamp: string; // ISO 8601 UTC
  amount: number; // integer, minor units (e.g. cents)
  currency: string; // 3-letter ISO
  payerId: string;
  payeeId: string;
}

export interface FEAArtifact {
  fea_id: string;
  fea_payload: unknown;
  signature: string;
  signature_version: string;
  public_key_id: string;
  created_at: string;
}

export interface FEAVerifyResult {
  valid: boolean;
  reason?: string;
  signature_version?: string;
  verified_at?: string;
}

async function pfp<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${config.proof.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": config.proof.apiKey,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Proof Fabric ${path} → ${res.status} ${res.statusText}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

export const proofFabric = {
  generate(input: FEAGenerateInput): Promise<FEAArtifact> {
    return pfp<FEAArtifact>("/api/fea/generate", {
      method: "POST",
      body: JSON.stringify({
        idempotency_key: input.idempotencyKey,
        transaction_id: input.transactionId,
        timestamp: input.timestamp,
        amount: input.amount,
        currency: input.currency,
        payer_id: input.payerId,
        payee_id: input.payeeId,
      }),
    });
  },

  verify(feaPayload: unknown, signature: string): Promise<FEAVerifyResult> {
    return pfp<FEAVerifyResult>("/api/fea/verify", {
      method: "POST",
      body: JSON.stringify({ fea_payload: feaPayload, signature }),
    });
  },
};
