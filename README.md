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

## Wiring in real APIs

All network calls are mocked behind a single seam: **`src/lib/api.ts`**
(`identityApi.verify`, `paymentsApi.execute`,
`proofApi.createTransactionProof / createMasterProof / verifyMasterProof`).
Replace each method body with a real `fetch(...)`; the types in
`src/lib/types.ts` and the rest of the app stay the same.

## Run

```bash
npm run dev   # http://localhost:3000  (preview config uses 3003)
```

Stack: Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · TypeScript.
State lives in React context with localStorage persistence (`src/lib/store.tsx`);
use **Reset demo** in the header to clear it.
