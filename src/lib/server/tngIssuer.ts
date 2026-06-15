import "server-only";
import { config } from "./config";

// ----------------------------------------------------------------------------
// Server-side client for the TNG Identity *issuer* (OpenID4VCI).
// Creates a credential offer and returns the claim URI (openid-credential-offer)
// the holder's wallet scans to claim the credential.
// Verified against a live TNG env (v2.2.0).
// ----------------------------------------------------------------------------

export interface IssueClaim {
  claimName: string;
  claimValue: string;
  dataType?: string;
}

export interface IssuedOffer {
  offerId: string;
  referenceId: string;
  credentialId: string;
  credentialName: string;
  claimUri: string; // openid-credential-offer://...
  deepLink?: string;
  status: string;
  expirationDate?: string;
}

async function issuer<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${config.tngIdentity.issuerBaseUrl}${path}`, {
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
    throw new Error(`TNG issuer ${path} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

export const tngIssuer = {
  // Create a credential offer and fetch its claim URI in one call.
  async issueCredential(credentialId: string, claims: IssueClaim[]): Promise<IssuedOffer> {
    const referenceId = crypto.randomUUID();
    const expirationDate = new Date(Date.now() + 30 * 864e5).toISOString();

    const created = await issuer<{
      credentialOffers: Array<{
        id: string;
        credentialId: string;
        credentialNames?: string[];
        status: string;
        referenceId: string;
        expirationDate?: string;
      }>;
    }>("/api/v1/credential-offers", {
      method: "POST",
      body: JSON.stringify({
        correlationId: config.tngIdentity.issuerAgentId,
        organisationProfileId: config.tngIdentity.issuerOrgProfileId,
        credentialOffers: [
          {
            credentialId,
            email: "amara.okafor@example.com",
            referenceId,
            expirationDate,
            claims: claims.map((c) => ({
              dataType: c.dataType ?? "string",
              claimName: c.claimName,
              claimValue: c.claimValue,
            })),
          },
        ],
      }),
    });

    const offer = created.credentialOffers[0];
    const claim = await issuer<{ uri: string; deepLink?: string }>(
      `/api/v1/credential-offers/${offer.id}/claim`,
      { method: "GET" },
    );

    return {
      offerId: offer.id,
      referenceId: offer.referenceId,
      credentialId: offer.credentialId,
      credentialName: offer.credentialNames?.[0] ?? credentialId,
      claimUri: claim.uri,
      deepLink: claim.deepLink,
      status: offer.status,
      expirationDate: offer.expirationDate,
    };
  },
};
