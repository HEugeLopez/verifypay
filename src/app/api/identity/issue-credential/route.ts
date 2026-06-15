import { tngIssuer } from "@/lib/server/tngIssuer";
import { config } from "@/lib/server/config";

// POST /api/identity/issue-credential
// Issues a demo "bank account" verifiable credential and returns the claim URI
// (QR) plus the claims, so the profile can display + persist it.
const BANK_CLAIMS = [
  { claimName: "fullName", claimValue: "Amara Okafor" },
  { claimName: "accountNumber", claimValue: "1882773104" },
  { claimName: "accountType", claimValue: "Checking Account" },
  { claimName: "bankName", claimValue: "Northwind Trust Bank" },
  { claimName: "bankBranch", claimValue: "Austin, TX" },
  { claimName: "routingNumber", claimValue: "114000093" },
  { claimName: "address", claimValue: "1100 Congress Ave, Austin, TX, USA" },
  { claimName: "identificationNumber", claimValue: "ID-4471" },
  { claimName: "accountBalance", claimValue: "4820.55" },
];

export async function POST() {
  if (!config.tngIdentity.hasCredentials) {
    return Response.json(
      { ok: false, error: "TNG Identity not configured" },
      { status: 200 },
    );
  }
  try {
    const offer = await tngIssuer.issueCredential("bankAccountCredential", BANK_CLAIMS);
    return Response.json({ ok: true, offer, claims: BANK_CLAIMS });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
