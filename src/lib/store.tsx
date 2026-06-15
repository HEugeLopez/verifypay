"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Account,
  IdentityCertificate,
  Loan,
  MasterProof,
  Transaction,
  TransactionProof,
} from "./types";
import {
  BORROWER_ID,
  LENDER_ID,
  seedAccounts,
  seedLoan,
  seedTransactions,
} from "./seed";

const STORAGE_KEY = "verifypay.state.v2";

interface PersistedState {
  accounts: Account[];
  loan: Loan;
  transactions: Transaction[];
  certificates: IdentityCertificate[];
  txProofs: TransactionProof[];
  masterProofs: MasterProof[];
  activeAccountId: string;
}

function freshState(): PersistedState {
  return {
    accounts: seedAccounts(),
    loan: seedLoan(),
    transactions: seedTransactions(),
    certificates: [],
    txProofs: [],
    masterProofs: [],
    activeAccountId: BORROWER_ID,
  };
}

interface AppContextValue extends PersistedState {
  hydrated: boolean;
  activeAccount: Account;
  borrower: Account;
  lender: Account;
  setActiveAccount: (id: string) => void;
  getAccount: (id: string) => Account | undefined;
  getCertificate: (id?: string) => IdentityCertificate | undefined;
  getTxProof: (id?: string) => TransactionProof | undefined;
  getMasterProofForTx: (txId: string) => MasterProof | undefined;
  addCertificate: (cert: IdentityCertificate) => void;
  applyTransaction: (tx: Transaction) => void;
  addTxProof: (proof: TransactionProof) => void;
  addMasterProof: (master: MasterProof) => void;
  reset: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(freshState);
  const [hydrated, setHydrated] = useState(false);
  const didLoad = useRef(false);

  // Load persisted state once, after mount (avoids SSR hydration mismatch).
  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(JSON.parse(raw) as PersistedState);
    } catch {
      /* ignore corrupt state */
    }
    setHydrated(true);
  }, []);

  // Persist on change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / unavailable */
    }
  }, [state, hydrated]);

  const setActiveAccount = useCallback((id: string) => {
    setState((s) => ({ ...s, activeAccountId: id }));
  }, []);

  const addCertificate = useCallback((cert: IdentityCertificate) => {
    setState((s) => ({ ...s, certificates: [cert, ...s.certificates] }));
  }, []);

  const applyTransaction = useCallback((tx: Transaction) => {
    setState((s) => {
      const accounts = s.accounts.map((a) => {
        if (a.id === tx.fromAccountId) return { ...a, balance: a.balance - tx.amount };
        if (a.id === tx.toAccountId) return { ...a, balance: a.balance + tx.amount };
        return a;
      });
      // Update the loan if this is a repayment against it.
      let loan = s.loan;
      if (tx.kind === "repayment" && tx.loanRef === s.loan.reference) {
        const next = new Date(s.loan.nextDueDate);
        next.setMonth(next.getMonth() + 1);
        loan = {
          ...s.loan,
          outstanding: Math.max(0, +(s.loan.outstanding - tx.amount).toFixed(2)),
          installmentsPaid: Math.min(s.loan.installmentsTotal, s.loan.installmentsPaid + 1),
          nextDueDate: next.toISOString(),
        };
      }
      return { ...s, accounts, loan, transactions: [tx, ...s.transactions] };
    });
  }, []);

  const addTxProof = useCallback((proof: TransactionProof) => {
    setState((s) => ({
      ...s,
      txProofs: [proof, ...s.txProofs],
      transactions: s.transactions.map((t) =>
        t.id === proof.transactionId ? { ...t, proofId: proof.id } : t,
      ),
    }));
  }, []);

  const addMasterProof = useCallback((master: MasterProof) => {
    setState((s) => ({ ...s, masterProofs: [master, ...s.masterProofs] }));
  }, []);

  const reset = useCallback(() => {
    setState(freshState());
  }, []);

  const value = useMemo<AppContextValue>(() => {
    const getAccount = (id: string) => state.accounts.find((a) => a.id === id);
    const borrower = state.accounts.find((a) => a.id === BORROWER_ID)!;
    const lender = state.accounts.find((a) => a.id === LENDER_ID)!;
    const activeAccount = getAccount(state.activeAccountId) ?? borrower;
    return {
      ...state,
      hydrated,
      activeAccount,
      borrower,
      lender,
      setActiveAccount,
      getAccount,
      getCertificate: (id?: string) =>
        id ? state.certificates.find((c) => c.id === id) : undefined,
      getTxProof: (id?: string) =>
        id ? state.txProofs.find((p) => p.id === id) : undefined,
      getMasterProofForTx: (txId: string) =>
        state.masterProofs.find((m) => m.transactionId === txId),
      addCertificate,
      applyTransaction,
      addTxProof,
      addMasterProof,
      reset,
    };
  }, [
    state,
    hydrated,
    setActiveAccount,
    addCertificate,
    applyTransaction,
    addTxProof,
    addMasterProof,
    reset,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}

export { BORROWER_ID, LENDER_ID };
