// ----------------------------------------------------------------------------
// Real, in-browser cryptography for the proof layer.
// SHA-256 hashing + HMAC-SHA256 signatures via the Web Crypto API.
//
// This is what makes the proofs genuinely *verifiable* in the demo: the "Verify"
// step recomputes every hash and re-checks every signature from stored data, so
// tampering with any field breaks verification — nothing is faked.
//
// In production these signing keys live behind your identity / proof APIs, not
// in the client. They're inlined here only so the POC can sign + verify offline.
// ----------------------------------------------------------------------------

export const MOCK_KEYS = {
  issuer: "vp.identity.issuer.k1", // signs identity certificates
  attestor: "vp.proof.attestor.k1", // signs transaction proofs
  notary: "vp.proof.notary.k1", // signs the master "proof of everything"
} as const;

const enc = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Deterministic, stable JSON: object keys sorted recursively. */
export function canonical(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortDeep((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(input));
  return toHex(digest);
}

/** SHA-256 over the canonical form of an object. */
export async function hashObject(obj: unknown): Promise<string> {
  return sha256Hex(canonical(obj));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toHex(sig);
}

export async function hmacVerify(
  secret: string,
  message: string,
  signatureHex: string,
): Promise<boolean> {
  const expected = await hmacHex(secret, message);
  // constant-ish time compare is overkill for a POC; equality is fine
  return expected === signatureHex;
}

/** Pairwise SHA-256 Merkle root. Odd nodes are promoted (duplicated). */
export async function merkleRoot(leafHashes: string[]): Promise<string> {
  if (leafHashes.length === 0) return sha256Hex("");
  let level = [...leafHashes];
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? left;
      next.push(await sha256Hex(left + right));
    }
    level = next;
  }
  return level[0];
}

/** Short display form for a long hex hash: `a1b2c3…d4e5f6`. */
export function shortHash(hex: string, edge = 6): string {
  if (hex.length <= edge * 2 + 1) return hex;
  return `${hex.slice(0, edge)}…${hex.slice(-edge)}`;
}
