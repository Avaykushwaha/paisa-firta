import { User, Group, Expense, Split } from './storage';

export interface Debt {
  from: string; // user ID
  to: string; // user ID
  amount: number;
}

/**
 * Calculate simplified debts for a group using the minimum transaction algorithm
 */
export function calculateDebts(
  expenses: Expense[],
  users: User[],
  group?: Group
): Debt[] {
  // Calculate net balance for each user
  const balances: Record<string, number> = {};
  
  users.forEach(user => {
    balances[user.id] = 0;
  });

  expenses.forEach(expense => {
    // Add what each payer paid
    expense.payers.forEach(payer => {
      balances[payer.userId] = (balances[payer.userId] || 0) + payer.amount;
    });

    // Subtract what each person owes
    expense.splits.forEach(split => {
      balances[split.userId] = (balances[split.userId] || 0) - split.amount;
    });
  });

  // Handle couple mode - merge couple balances
  if (group?.coupleMode && group.couples.length > 0) {
    group.couples.forEach(([user1Id, user2Id]) => {
      const combinedBalance = (balances[user1Id] || 0) + (balances[user2Id] || 0);
      balances[user1Id] = combinedBalance;
      balances[user2Id] = combinedBalance;
    });
  }

  // Separate creditors (positive balance) and debtors (negative balance)
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  Object.entries(balances).forEach(([userId, balance]) => {
    if (balance > 0.01) {
      creditors.push({ id: userId, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id: userId, amount: -balance });
    }
  });

  // Sort for consistent results
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Greedy algorithm to minimize transactions
  const debts: Debt[] = [];
  let i = 0;
  let j = 0;

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const amount = Math.min(creditor.amount, debtor.amount);

    if (amount > 0.01) {
      debts.push({
        from: debtor.id,
        to: creditor.id,
        amount: Math.round(amount * 100) / 100,
      });
    }

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return debts;
}

/**
 * Get user balance across all expenses
 */
export function getUserBalance(userId: string, expenses: Expense[]): number {
  let balance = 0;

  expenses.forEach(expense => {
    // Add what user paid
    const paid = expense.payers.find(p => p.userId === userId);
    if (paid) {
      balance += paid.amount;
    }

    // Subtract what user owes
    const owes = expense.splits.find(s => s.userId === userId);
    if (owes) {
      balance -= owes.amount;
    }
  });

  return Math.round(balance * 100) / 100;
}

/**
 * Calculate split amounts based on mode
 */
export function calculateSplits(
  totalAmount: number,
  splitMode: 'equal' | 'exact' | 'percent' | 'shares',
  userIds: string[],
  customValues?: number[]
): Split[] {
  const splits: Split[] = [];

  switch (splitMode) {
    case 'equal': {
      const amountPerPerson = totalAmount / userIds.length;
      userIds.forEach(userId => {
        splits.push({ userId, amount: Math.round(amountPerPerson * 100) / 100 });
      });
      break;
    }

    case 'exact': {
      if (customValues && customValues.length === userIds.length) {
        userIds.forEach((userId, i) => {
          splits.push({ userId, amount: customValues[i] });
        });
      }
      break;
    }

    case 'percent': {
      if (customValues && customValues.length === userIds.length) {
        userIds.forEach((userId, i) => {
          const amount = (totalAmount * customValues[i]) / 100;
          splits.push({ userId, amount: Math.round(amount * 100) / 100 });
        });
      }
      break;
    }

    case 'shares': {
      if (customValues && customValues.length === userIds.length) {
        const totalShares = customValues.reduce((sum, val) => sum + val, 0);
        userIds.forEach((userId, i) => {
          const amount = (totalAmount * customValues[i]) / totalShares;
          splits.push({ userId, amount: Math.round(amount * 100) / 100 });
        });
      }
      break;
    }
  }

  return splits;
}
