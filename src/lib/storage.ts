// LocalStorage wrapper for offline data persistence

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[]; // user IDs
  couples: [string, string][]; // pairs of user IDs
  coupleMode: boolean;
  coupleDisplayNames: Record<string, string>; // couple pair key -> display user ID
  createdAt: string;
}

export type SplitMode = 'equal' | 'exact' | 'percent' | 'shares';

export interface Split {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  groupId: string;
  payers: Split[]; // who paid
  splits: Split[]; // how to split
  splitMode: SplitMode;
  notes?: string;
  receipt?: string; // base64 image
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    endDate?: string;
  };
  createdAt: string;
}

export interface Settlement {
  id: string;
  from: string; // user ID
  to: string; // user ID
  amount: number;
  groupId?: string;
  date: string;
  notes?: string;
}

interface AppSettings {
  currency: string;
}

interface AppData {
  users: User[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  settings?: AppSettings;
}

const STORAGE_KEY = 'paisa-firta-data';

export const storage = {
  getData(): AppData {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { users: [], groups: [], expenses: [], settlements: [], settings: { currency: '₹' } };
    }
    const parsed = JSON.parse(data);
    if (!parsed.settings) {
      parsed.settings = { currency: '₹' };
    }
    return parsed;
  },

  saveData(data: AppData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  // Users
  getUsers(): User[] {
    return this.getData().users;
  },

  saveUser(user: User): void {
    const data = this.getData();
    const index = data.users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      data.users[index] = user;
    } else {
      data.users.push(user);
    }
    this.saveData(data);
  },

  deleteUser(id: string): void {
    const data = this.getData();
    data.users = data.users.filter(u => u.id !== id);
    this.saveData(data);
  },

  // Groups
  getGroups(): Group[] {
    return this.getData().groups;
  },

  saveGroup(group: Group): void {
    const data = this.getData();
    const index = data.groups.findIndex(g => g.id === group.id);
    if (index >= 0) {
      data.groups[index] = group;
    } else {
      data.groups.push(group);
    }
    this.saveData(data);
  },

  deleteGroup(id: string): void {
    const data = this.getData();
    data.groups = data.groups.filter(g => g.id !== id);
    this.saveData(data);
  },

  // Expenses
  getExpenses(): Expense[] {
    return this.getData().expenses;
  },

  saveExpense(expense: Expense): void {
    const data = this.getData();
    const index = data.expenses.findIndex(e => e.id === expense.id);
    if (index >= 0) {
      data.expenses[index] = expense;
    } else {
      data.expenses.push(expense);
    }
    this.saveData(data);
  },

  deleteExpense(id: string): void {
    const data = this.getData();
    data.expenses = data.expenses.filter(e => e.id !== id);
    this.saveData(data);
  },

  // Settlements
  getSettlements(): Settlement[] {
    return this.getData().settlements;
  },

  saveSettlement(settlement: Settlement): void {
    const data = this.getData();
    data.settlements.push(settlement);
    this.saveData(data);
  },

  // Backup & Restore
  exportBackup(): string {
    return JSON.stringify(this.getData(), null, 2);
  },

  importBackup(jsonString: string): void {
    const data = JSON.parse(jsonString);
    this.saveData(data);
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Settings
  getSettings(): AppSettings {
    return this.getData().settings || { currency: '₹' };
  },

  saveSettings(settings: AppSettings): void {
    const data = this.getData();
    data.settings = settings;
    this.saveData(data);
  },
};
