// START OF FILE: new-settlement-logic.ts
// Completely standalone simplified settlement + balance calculator
// Drop this file into: src/lib/new-settlement-logic.ts

export interface BalanceItem {
  userId: string;
  balance: number;
}

// Compute balances per user
export function getBalances(expenses: any[], users: any[], group?: any): BalanceItem[] {
  const balances: Record<string, number> = {};

  users.forEach(u => {
    // If group mode: ignore users not in this group
    if (group && !group.members.includes(u.id)) return;
    balances[u.id] = 0;
  });

  for (const e of expenses) {
    const payer = e.paidBy;
    const amount = Number(e.amount);

    // Skip expenses with unknown users
    if (!balances.hasOwnProperty(payer)) continue;

    balances[payer] += amount;

    // Split equally or custom
    if (e.splitType === 'equal') {
      const per = amount / e.participants.length;
      e.participants.forEach((uid: string) => {
        if (!balances.hasOwnProperty(uid)) return;
        balances[uid] -= per;
      });
    }

    if (e.splitType === 'custom') {
      Object.entries(e.customShares || {}).forEach(([uid, share]) => {
        if (!balances.hasOwnProperty(uid)) return;
        balances[uid] -= Number(share);
      });
    }
  }

  return Object.keys(balances).map(uid => ({ userId: uid, balance: balances[uid] }));
}

// Simplify balances to minimal transactions
export function simplifyDebts(balances: BalanceItem[]) {
  const debtors = [] as { id: string; amount: number }[];
  const creditors = [] as { id: string; amount: number }[];

  for (const b of balances) {
    if (b.balance < -0.01) debtors.push({ id: b.userId, amount: -b.balance });
    if (b.balance > 0.01) creditors.push({ id: b.userId, amount: b.balance });
  }

  const result: { from: string; to: string; amount: number }[] = [];

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];

    const settled = Math.min(d.amount, c.amount);

    result.push({ from: d.id, to: c.id, amount: Number(settled.toFixed(2)) });

    d.amount -= settled;
    c.amount -= settled;

    if (d.amount < 0.01) i++;
    if (c.amount < 0.01) j++;
  }

  return result;
}

// END OF FILE
