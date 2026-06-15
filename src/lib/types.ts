// ----------------------------------------------------------------------------
// Domain types for the VerifyPay POC
// A loan-repayment flow: Borrower -> Lender, gated by verifiable identity,
// settled with a transaction, and bound together by cryptographic proofs.
// ----------------------------------------------------------------------------

export type AccountRole = "borrower" | "lender";

export interface Profile {
  legalName: string;
  dateOfBirth: string; // ISO date
  nationality: string;
  documentType: string; // e.g. "Passport"
  documentNumber: string; // masked for display
  email: string;
  addressCity: string;
  addressCountry: string;
}

export interface Account {
  id: string;
  role: AccountRole;
  displayName: string; // app/brand name, e.g. "Northwind Capital"
  handle: string; // @handle
  accent: string; // hex for avatar
  profile: Profile;
  balance: number; // wallet balance in minor->major units (we store major)
  currency: string; // e.g. "USD"
}

export interface Loan {
  id: string;
  borrowerId: string;
  lenderId: string;
  principal: number;
  apr: number; // annual percentage rate, e.g. 0.089
  termMonths: number;
  installment: number; // monthly payment amount
  outstanding: number; // remaining balance
  installmentsPaid: number;
  installmentsTotal: number;
  nextDueDate: string; // ISO date
  reference: string; // human reference, e.g. "LN-2024-0098"
}

// --- Identity ---------------------------------------------------------------

export type AssuranceLevel = "IAL2" | "IAL3";

export interface IdentityClaims {
  legalName: string;
  dateOfBirth: string;
  nationality: string;
  documentType: string;
  documentNumber: string; // masked
}

export interface IdentityCertificate {
  id: string;
  subjectAccountId: string;
  issuer: string; // verification provider
  method: string[]; // e.g. ["Document scan", "Liveness", "Database match"]
  assuranceLevel: AssuranceLevel;
  claims: IdentityClaims;
  verifiedAt: string; // ISO datetime
  expiresAt: string; // ISO datetime
  subjectHash: string; // sha-256 of canonical claims
  signature: string; // HMAC-SHA256 over the certificate body (issuer key)
  status: "valid" | "expired" | "revoked";
}

// --- Transaction ------------------------------------------------------------

export type TxStatus = "pending" | "settled" | "failed";
export type TxKind = "repayment" | "disbursement" | "transfer";

export interface Transaction {
  id: string;
  kind: TxKind;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  memo: string;
  loanRef?: string;
  createdAt: string; // ISO datetime
  status: TxStatus;
  certificateId?: string; // identity bound to this payment
  txHash?: string; // sha-256 of canonical transaction body
  proofId?: string; // transaction proof
}

// --- Proofs -----------------------------------------------------------------

export interface TransactionProof {
  id: string;
  transactionId: string;
  certificateId: string;
  attestor: string; // proof service
  txHash: string;
  certHash: string;
  proofHash: string; // sha-256(txHash + certHash)
  signature: string; // HMAC over proof body (attestor key)
  createdAt: string;
}

export interface MerkleLeaf {
  label: string;
  kind: "certificate" | "transaction" | "transactionProof";
  refId: string;
  hash: string;
}

// "Proof of everything" — binds identity + payment + tx-proof under one root.
export interface MasterProof {
  id: string;
  transactionId: string;
  leaves: MerkleLeaf[];
  merkleRoot: string;
  signature: string; // HMAC over the root (notary key)
  createdAt: string;
}

// Result of independently re-verifying a master proof.
export interface VerificationCheck {
  label: string;
  detail: string;
  ok: boolean;
}

export interface VerificationReport {
  ok: boolean;
  checkedAt: string;
  checks: VerificationCheck[];
}
