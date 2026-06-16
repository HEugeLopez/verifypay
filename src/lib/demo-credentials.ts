// Demo verifiable credentials Amara "holds". Shared by the issue route (to
// mint via TNG) and the profile UI (to display the claimed credentials).
// Claim values respect each credential's schema constraints (patterns/enums).

export interface DemoClaim {
  claimName: string;
  claimValue: string;
}

export interface DemoCredential {
  credentialId: string; // TNG credential id
  name: string; // display name
  icon: "bank" | "email" | "license";
  summary: string; // one-line subtitle
  description: string; // card description line
  issuer: string; // display issuer
  gradient: string; // CSS background for the credential card
  claims: DemoClaim[];
}

export const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    credentialId: "bankAccountCredential",
    name: "Bank Account",
    icon: "bank",
    summary: "Northwind Trust Bank",
    description: "Your verified bank account",
    issuer: "Northwind Trust Bank",
    gradient: "linear-gradient(140deg, #34d399 0%, #059669 60%, #047857 100%)",
    claims: [
      { claimName: "fullName", claimValue: "Amara Okafor" },
      { claimName: "accountNumber", claimValue: "1882773104" },
      { claimName: "accountType", claimValue: "Checking Account" },
      { claimName: "bankName", claimValue: "Northwind Trust Bank" },
      { claimName: "bankBranch", claimValue: "Austin, TX" },
      { claimName: "routingNumber", claimValue: "114000093" },
      { claimName: "address", claimValue: "1100 Congress Ave, Austin, TX, USA" },
      { claimName: "identificationNumber", claimValue: "ID-4471" },
      { claimName: "accountBalance", claimValue: "4820.55" },
    ],
  },
  {
    credentialId: "emailCredential",
    name: "Email",
    icon: "email",
    summary: "amara.okafor@example.com",
    description: "Verified email address",
    issuer: "TNG Identity",
    gradient: "linear-gradient(140deg, #a855f7 0%, #7c3aed 60%, #6d28d9 100%)",
    claims: [{ claimName: "email", claimValue: "amara.okafor@example.com" }],
  },
  {
    credentialId: "licenseCredential",
    name: "Driver License",
    icon: "license",
    summary: "Texas · Class C",
    description: "Government-issued driver license",
    issuer: "Texas DMV",
    gradient: "linear-gradient(140deg, #3b82f6 0%, #4f46e5 60%, #4338ca 100%)",
    claims: [
      { claimName: "fullName", claimValue: "Amara Okafor" },
      { claimName: "licenseNumber", claimValue: "DL 4471982" },
      { claimName: "professionalTitle", claimValue: "Class C Driver" },
      { claimName: "contactInformation", claimValue: "Austin, TX" },
      { claimName: "licenseRestrictionsConditions", claimValue: "Corrective lenses" },
    ],
  },
];

export function getDemoCredential(id: string): DemoCredential | undefined {
  return DEMO_CREDENTIALS.find((c) => c.credentialId === id);
}
