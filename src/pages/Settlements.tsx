// settlement.ts

export interface Debt {
  from: string;   // user/couple ID
  to: string;     // user/couple ID
  amount: number; // Positive value
}

export interface Expense {
  payers: { userId: string; amount: number }[];
  splits: { userId: string; amount: number }[];
  groupId?: string;
}

export interface Group {
  id: string;
  name: string;
  coupleMode?: boolean;
  couples?: [string, string][];
}

export interface User {
  id: string;
  name: string;
}

// Core debt calculation with couple mode support
export function calculateDebts(
  expenses: Expense[],
  users: User[],
  group?: Group
): Debt[] {
  // Net balances for each user by sum of paid/owed per expense
  const balances: Record<string, number> = {};
  users.forEach(u => { balances[u.id] = 0; });

  expenses.forEach(exp => {
    exp.payers.forEach(payer => {
      balances[payer.userId] += payer.amount;
    });
    exp.splits.forEach(split => {
      balances[split.userId] -= split.amount;
    });
  });

  // Couple mode: merge couple balances as single entity
  let coupleMap: Record<string, string> = {};
  const mergedBalances: Record<string, number> = {};
  if (group?.coupleMode && group.couples?.length) {
    group.couples.forEach(([id1, id2], idx) => {
      const coupleId = `couple_${idx}_${id1}_${id2}`;
      coupleMap[id1] = coupleId;
      coupleMap[id2] = coupleId;
      mergedBalances[coupleId] = (balances[id1] || 0) + (balances[id2] || 0);
    });
    // Add solo users
    users.forEach(u => {
      if (!coupleMap[u.id]) mergedBalances[u.id] = balances[u.id];
    });
  } else {
    Object.assign(mergedBalances, balances);
  }

  // Find creditors/debtors for simplified settlement
  const creditors: [string, number][] = [];
  const debtors: [string, number][] = [];
  Object.entries(mergedBalances).forEach(([id, bal]) => {
    if (bal < 0) creditors.push([id, -bal]);
    if (bal > 0) debtors.push([id, bal]);
  });

  // Greedy transaction minimization between creditors/debtors
  const debts: Debt[] = [];
  let credIdx = 0, debtIdx = 0;
  while (credIdx < creditors.length && debtIdx < debtors.length) {
    const [credId, credAmt] = creditors[credIdx];
    const [debtId, debtAmt] = debtors[debtIdx];
    const pay = Math.min(credAmt, debtAmt);
    debts.push({ from: debtId, to: credId, amount: Math.round(pay * 100) / 100 });
    creditors[credIdx][1] -= pay;
    debtors[debtIdx][1] -= pay;
    if (creditors[credIdx][1] === 0) credIdx++;
    if (debtors[debtIdx][1] === 0) debtIdx++;
  }

  return debts;
}

// Utility function: calculate total user balance (positive: gets back)
export function getUserBalance(
  userId: string,
  expenses: Expense[]
): number {
  let paid = 0, owed = 0;
  expenses.forEach(exp => {
    exp.payers.forEach(payer => {
      if (payer.userId === userId) paid += payer.amount;
    });
    exp.splits.forEach(split => {
      if (split.userId === userId) owed += split.amount;
    });
  });
  return Math.round((paid - owed) * 100) / 100;
}
