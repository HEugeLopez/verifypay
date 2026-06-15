# VerifyPay — identity-verified payments POC

A proof-of-concept payment processor where **every payment is gated by identity
verification and bound to a verifiable cryptographic proof**. The demo use case is
a **loan repayment** flowing from a Borrower to a Lender.

## What it does

Two switchable "accounts" (Borrower · Amara Okafor, Lender · Northwind Capital),
each with a wallet, profile, and transaction history. The repayment flow:

1. **Verify identity** → a signed, verifiable **identity certificate** is issued.
2. **Pay** → the repayment settles between wallets.
3. **Seal proof** → a **transaction proof** binds the exact payment to the exact
   identity, then a **"proof of everything"** Merkle root binds identity +
   payment + proof under one notary signature.
4. **Receipt** → carries the attached identity verification.
5. **Verify** (Proofs tab) → independently **recomputes every hash and re-checks
   every signature**. A *Simulate tampering* toggle alters the payment amount and
   shows the affected checks fail — the proofs are genuinely tamper-evident.

## The proofs are real

`src/lib/crypto.ts` uses the Web Crypto API for SHA-256 hashing and HMAC-SHA256
signatures. Verification re-derives everything from stored data, so nothing is
faked. (The signing keys are inlined client-side **only** for the offline demo —
in production they belong behind your APIs.)

## Live integrations

Two services are wired for real, behind server-side route handlers so the API
keys never reach the browser:

| Service | What it does | Route handlers | Server client |
|---|---|---|---|
| **TNG Identity** (OpenID4VP) | Issues/verifies the identity via a wallet presentation | `src/app/api/identity/{request,status}` | `src/lib/server/tngIdentity.ts` |
| **Proof Fabric Protocol** | Proof of transaction + verification | `src/app/api/proof/{generate,verify}` | `src/lib/server/proofFabric.ts` |

The browser-side seam (`src/lib/api.ts`) calls these `/api/*` routes; keys are
read only in `src/lib/server/config.ts` (guarded by the `server-only` package).

- **Identity** has *no* fallback — if it isn't configured the wizard says so.
- **Proof** falls back to a local HMAC proof (clearly labelled) when its key is
  absent, so the rest of the demo keeps working.

### Live API setup

1. Copy the env template and fill in your values (this file is git-ignored):

   ```bash
   cp .env.example .env.local
   ```

   ```bash
   # TNG Identity (verifier). Base URL = https://<host>/products/web/<envHash>/verifier
   TNG_IDENTITY_HOST=identity.products.teranode.group   # default; override if needed
   TNG_IDENTITY_ENV_HASH=        # your environment hash, e.g. 426f1ce15bf3df70
   TNG_IDENTITY_API_KEY=         # x-api-key value
   TNG_VERIFIER_DEFINITION_ID=   # presentation definition id, e.g. emailCredential

   # Proof Fabric Protocol
   PROOF_API_BASE_URL=https://fea-crypto.emergent.host   # default
   PROOF_API_KEY=                # X-API-Key value (pfp_sandbox_...)
   ```

2. Restart the dev server (env is read at startup).

3. Check what's wired without opening the UI:

   ```bash
   curl http://localhost:3003/api/health
   ```

   ```jsonc
   {
     "ok": true,
     "integrations": {
       "tngIdentity": { "configured": true,  "verifierBaseUrl": "…", "missing": [] },
       "proof":       { "configured": true,  "baseUrl": "…",         "missing": [] }
     }
   }
   ```

   `missing` lists any env vars still unset. No secret values are ever returned.

> **Notes / assumptions to confirm against your TNG environment:**
> - The verifier endpoints are assumed under `/api/v1/private/verifiable-presentations`
>   (the `VP_PATH` constant in `tngIdentity.ts`). If you get a 404, drop `/private`.
> - The env hash and `definitionId` come from your TNG portal / Getting Started.
> - Completing a verification needs a **TNG wallet holding a matching credential**
>   to scan the QR shown in the wizard.

## Run

```bash
npm run dev   # http://localhost:3000  (preview config uses 3003)
```

Stack: Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · TypeScript.
State lives in React context with localStorage persistence (`src/lib/store.tsx`);
use **Reset demo** in the header to clear it.
