import type { Account, Loan, Transaction } from "./types";

// ----------------------------------------------------------------------------
// Seed data — two "apps": a Borrower account and a Lender account, plus an
// active personal loan and a short repayment history.
// ----------------------------------------------------------------------------

export const BORROWER_ID = "acct_borrower_amara";
export const LENDER_ID = "acct_lender_northwind";

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export function seedAccounts(): Account[] {
  return [
    {
      id: BORROWER_ID,
      role: "borrower",
      displayName: "Amara Okafor",
      handle: "@amara",
      accent: "#2563eb",
      currency: "USD",
      balance: 4820.55,
      profile: {
        legalName: "Amara N. Okafor",
        dateOfBirth: "1991-03-14",
        nationality: "United States",
        documentType: "Passport",
        documentNumber: "•••• •• 4471",
        email: "amara.okafor@example.com",
        addressCity: "Austin, TX",
        addressCountry: "United States",
      },
    },
    {
      id: LENDER_ID,
      role: "lender",
      displayName: "Northwind Capital",
      handle: "@northwind",
      accent: "#0f9d6b",
      currency: "USD",
      balance: 1284300.0,
      profile: {
        legalName: "Northwind Capital Lending, LLC",
        dateOfBirth: "2014-06-02", // incorporation date, reused field
        nationality: "United States",
        documentType: "EIN / Charter",
        documentNumber: "•••• •• 9920",
        email: "servicing@northwind.example",
        addressCity: "Wilmington, DE",
        addressCountry: "United States",
      },
    },
  ];
}

export function seedLoan(): Loan {
  return {
    id: "loan_amara_0098",
    borrowerId: BORROWER_ID,
    lenderId: LENDER_ID,
    principal: 12000,
    apr: 0.089,
    termMonths: 36,
    installment: 381.2,
    outstanding: 6097.94,
    installmentsPaid: 18,
    installmentsTotal: 36,
    nextDueDate: daysFromNow(6),
    reference: "LN-2024-0098",
  };
}

export function seedTransactions(): Transaction[] {
  // A couple of historical, already-settled repayments for realism.
  const mk = (n: number, daysAgo: number): Transaction => ({
    id: `tx_seed_${n}`,
    kind: "repayment",
    fromAccountId: BORROWER_ID,
    toAccountId: LENDER_ID,
    amount: 381.2,
    currency: "USD",
    memo: `Loan repayment · installment ${n} of 36`,
    loanRef: "LN-2024-0098",
    createdAt: daysFromNow(-daysAgo),
    status: "settled",
  });
  return [mk(18, 24), mk(17, 54)];
}
