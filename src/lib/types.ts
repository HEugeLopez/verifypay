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

// A single verified attribute returned by the identity provider.
export interface IdentityAttribute {
  name: string; // claim name, e.g. "email", "fullName"
  value: string;
  dataType?: string;
}

// A verifiable credential issued to (and claimable by) the holder's wallet.
export interface IssuedCredential {
  offerId: string;
  credentialId: string;
  credentialName: string;
  claimUri: string; // openid-credential-offer:// — encode as QR
  deepLink?: string;
  claims: { claimName: string; claimValue: string }[];
  issuedAt: string;
}

export interface IdentityCertificate {
  id: string;
  subjectAccountId: string;
  issuer: string; // verification provider
  method: string[]; // e.g. ["Verifiable credential presentation", "OpenID4VP / SIOP"]
  assuranceLevel?: string;
  subject: string; // primary display subject (name/email)
  attributes: IdentityAttribute[]; // the actual verified claims
  verifiedAt: string; // ISO datetime
  expiresAt?: string; // ISO datetime
  subjectHash: string; // sha-256 of canonical attributes
  signature: string; // HMAC attestation over the certificate body
  status: "valid" | "expired" | "revoked";
  source: "tng";
  tng?: {
    correlationId: string;
    definitionId: string;
    credentialId?: string;
    credentialTypes?: string[];
  };
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

  // Provenance: "pfp" = real Proof Fabric Protocol artifact, "local" = offline fallback
  source: "pfp" | "local";
  // Proof Fabric Protocol artifact (present when source === "pfp")
  feaId?: string;
  feaPayload?: unknown;
  feaSignature?: string;
  feaSignatureVersion?: string;
  feaPublicKeyId?: string;
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
