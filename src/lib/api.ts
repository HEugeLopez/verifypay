// ----------------------------------------------------------------------------
// Mock API client — the integration seam.
//
// Each method mimics a network call (latency + structured result) but builds
// real, cryptographically signed artifacts. To wire up your real endpoints,
// replace the bodies of these methods with `fetch(...)` calls; the types and
// the rest of the app stay the same.
// ----------------------------------------------------------------------------

import {
  canonical,
  hashObject,
  hmacHex,
  hmacVerify,
  merkleRoot,
  MOCK_KEYS,
  sha256Hex,
} from "./crypto";
import type {
  Account,
  AssuranceLevel,
  IdentityCertificate,
  IdentityClaims,
  MasterProof,
  MerkleLeaf,
  Transaction,
  TransactionProof,
  VerificationCheck,
  VerificationReport,
} from "./types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function genId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(16).slice(2, 14);
  return `${prefix}_${rand}`;
}

function addYears(iso: string, years: number): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString();
}

// --- Canonical "signable body" builders (shared by create + verify) ---------

function certSignableBody(c: IdentityCertificate) {
  return {
    id: c.id,
    subjectAccountId: c.subjectAccountId,
    issuer: c.issuer,
    method: c.method,
    assuranceLevel: c.assuranceLevel,
    claims: c.claims,
    verifiedAt: c.verifiedAt,
    expiresAt: c.expiresAt,
    subjectHash: c.subjectHash,
  };
}

function txSignableBody(t: Transaction) {
  return {
    id: t.id,
    kind: t.kind,
    fromAccountId: t.fromAccountId,
    toAccountId: t.toAccountId,
    amount: t.amount,
    currency: t.currency,
    memo: t.memo,
    loanRef: t.loanRef ?? null,
    createdAt: t.createdAt,
  };
}

function txProofSignableBody(p: TransactionProof) {
  return {
    id: p.id,
    transactionId: p.transactionId,
    certificateId: p.certificateId,
    attestor: p.attestor,
    txHash: p.txHash,
    certHash: p.certHash,
    proofHash: p.proofHash,
    createdAt: p.createdAt,
  };
}

function masterSignableBody(m: MasterProof) {
  return {
    id: m.id,
    transactionId: m.transactionId,
    merkleRoot: m.merkleRoot,
    createdAt: m.createdAt,
  };
}

// Hash that uniquely identifies a certificate's content (excludes signature).
export async function certContentHash(c: IdentityCertificate): Promise<string> {
  return hashObject(certSignableBody(c));
}

// --- Identity API -----------------------------------------------------------

export interface VerifyOptions {
  assuranceLevel?: AssuranceLevel;
}

export const identityApi = {
  async verify(
    account: Account,
    opts: VerifyOptions = {},
  ): Promise<IdentityCertificate> {
    await delay(900);

    const claims: IdentityClaims = {
      legalName: account.profile.legalName,
      dateOfBirth: account.profile.dateOfBirth,
      nationality: account.profile.nationality,
      documentType: account.profile.documentType,
      documentNumber: account.profile.documentNumber,
    };

    const verifiedAt = new Date().toISOString();
    const subjectHash = await hashObject(claims);

    const cert: IdentityCertificate = {
      id: genId("idcert"),
      subjectAccountId: account.id,
      issuer: "Veriff Trust Services",
      method: ["Government ID scan", "Liveness / selfie match", "Sanctions & PEP screen"],
      assuranceLevel: opts.assuranceLevel ?? "IAL2",
      claims,
      verifiedAt,
      expiresAt: addYears(verifiedAt, 1),
      subjectHash,
      signature: "",
      status: "valid",
    };
    cert.signature = await hmacHex(MOCK_KEYS.issuer, canonical(certSignableBody(cert)));
    return cert;
  },
};

// --- Payments API -----------------------------------------------------------

export interface ExecutePaymentInput {
  kind: Transaction["kind"];
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  memo: string;
  loanRef?: string;
  certificateId: string;
}

export const paymentsApi = {
  async execute(input: ExecutePaymentInput): Promise<Transaction> {
    await delay(1100);
    const tx: Transaction = {
      id: genId("tx"),
      kind: input.kind,
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      amount: input.amount,
      currency: input.currency,
      memo: input.memo,
      loanRef: input.loanRef,
      createdAt: new Date().toISOString(),
      status: "settled",
      certificateId: input.certificateId,
    };
    tx.txHash = await hashObject(txSignableBody(tx));
    return tx;
  },
};

// --- Proof API --------------------------------------------------------------

export const proofApi = {
  // Binds a settled transaction to the identity certificate that authorized it.
  async createTransactionProof(
    tx: Transaction,
    cert: IdentityCertificate,
  ): Promise<TransactionProof> {
    await delay(800);
    const txHash = tx.txHash ?? (await hashObject(txSignableBody(tx)));
    const certHash = await certContentHash(cert);
    const proofHash = await sha256Hex(txHash + certHash);

    const proof: TransactionProof = {
      id: genId("txproof"),
      transactionId: tx.id,
      certificateId: cert.id,
      attestor: "VerifyPay Attestation Service",
      txHash,
      certHash,
      proofHash,
      signature: "",
      createdAt: new Date().toISOString(),
    };
    proof.signature = await hmacHex(
      MOCK_KEYS.attestor,
      canonical(txProofSignableBody(proof)),
    );
    return proof;
  },

  // "Proof of everything": one Merkle root over identity + payment + tx-proof.
  async createMasterProof(
    tx: Transaction,
    cert: IdentityCertificate,
    txProof: TransactionProof,
  ): Promise<MasterProof> {
    await delay(900);
    const certHash = await certContentHash(cert);
    const txHash = tx.txHash ?? (await hashObject(txSignableBody(tx)));

    const leaves: MerkleLeaf[] = [
      { label: "Identity certificate", kind: "certificate", refId: cert.id, hash: certHash },
      { label: "Payment transaction", kind: "transaction", refId: tx.id, hash: txHash },
      {
        label: "Transaction proof",
        kind: "transactionProof",
        refId: txProof.id,
        hash: txProof.proofHash,
      },
    ];
    const root = await merkleRoot(leaves.map((l) => l.hash));

    const master: MasterProof = {
      id: genId("master"),
      transactionId: tx.id,
      leaves,
      merkleRoot: root,
      signature: "",
      createdAt: new Date().toISOString(),
    };
    master.signature = await hmacHex(MOCK_KEYS.notary, canonical(masterSignableBody(master)));
    return master;
  },

  // Independently re-derives every hash + signature from stored data.
  // Returns a per-check report so tampering with any field is visible.
  async verifyMasterProof(
    master: MasterProof,
    cert: IdentityCertificate,
    tx: Transaction,
    txProof: TransactionProof,
  ): Promise<VerificationReport> {
    await delay(1300);
    const checks: VerificationCheck[] = [];

    // 1. Identity claims integrity
    const recomputedSubject = await hashObject(cert.claims);
    checks.push({
      label: "Identity claims integrity",
      detail: "Re-hash subject claims and match the certificate's subject hash.",
      ok: recomputedSubject === cert.subjectHash,
    });

    // 2. Issuer signature on the certificate
    const certSigOk = await hmacVerify(
      MOCK_KEYS.issuer,
      canonical(certSignableBody(cert)),
      cert.signature,
    );
    checks.push({
      label: "Issuer signature (identity)",
      detail: `Verify HMAC signature from ${cert.issuer}.`,
      ok: certSigOk,
    });

    // 3. Transaction integrity
    const recomputedTx = await hashObject(txSignableBody(tx));
    checks.push({
      label: "Transaction integrity",
      detail: "Re-hash the payment body and match the recorded transaction hash.",
      ok: recomputedTx === (tx.txHash ?? "") && recomputedTx === txProof.txHash,
    });

    // 4. Binding: payment ↔ identity
    const certHash = await certContentHash(cert);
    const recomputedBinding = await sha256Hex(recomputedTx + certHash);
    const bindingOk =
      certHash === txProof.certHash && recomputedBinding === txProof.proofHash;
    checks.push({
      label: "Payment ↔ identity binding",
      detail: "Recompute sha256(txHash + certHash) and match the transaction proof.",
      ok: bindingOk,
    });

    // 5. Attestor signature on the transaction proof
    const txProofSigOk = await hmacVerify(
      MOCK_KEYS.attestor,
      canonical(txProofSignableBody(txProof)),
      txProof.signature,
    );
    checks.push({
      label: "Attestor signature (proof)",
      detail: `Verify HMAC signature from ${txProof.attestor}.`,
      ok: txProofSigOk,
    });

    // 6. Merkle root over all artifacts
    const recomputedRoot = await merkleRoot(master.leaves.map((l) => l.hash));
    checks.push({
      label: "Merkle root",
      detail: "Rebuild the root over identity + payment + proof leaves.",
      ok: recomputedRoot === master.merkleRoot,
    });

    // 7. Notary signature on the master proof
    const masterSigOk = await hmacVerify(
      MOCK_KEYS.notary,
      canonical(masterSignableBody(master)),
      master.signature,
    );
    checks.push({
      label: "Notary signature (master)",
      detail: "Verify the signature binding the whole proof bundle.",
      ok: masterSigOk,
    });

    return {
      ok: checks.every((c) => c.ok),
      checkedAt: new Date().toISOString(),
      checks,
    };
  },
};
