import { useState, useEffect } from 'react';
import { storage, User, Group, Expense, Settlement } from '@/lib/storage';
import { simplifyDebts, getBalances } from '@/lib/new-settlement-logic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, CheckCircle, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function Settlements() {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [debts, setDebts] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateEverything();
  }, [users, groups, expenses, selectedGroupId]);

  const loadData = () => {
    setUsers(storage.getUsers());
    setGroups(storage.getGroups());
    setExpenses(storage.getExpenses());
    setSettlements(storage.getSettlements());
  };

  const calculateEverything = () => {
    const filtered = selectedGroupId === 'all'
      ? expenses
      : expenses.filter(e => e.groupId === selectedGroupId);

    const group = selectedGroupId === 'all'
      ? undefined
      : groups.find(g => g.id === selectedGroupId);

    const b = getBalances(filtered, users, group);
    const s = simplifyDebts(b);

    setBalances(b);
    setDebts(s);
  };

  const settleTransaction = (d: any) => {
    const s: Settlement = {
      id: `st-${Date.now()}`,
      from: d.from,
      to: d.to,
      amount: d.amount,
      groupId: selectedGroupId === 'all' ? undefined : selectedGroupId,
      date: new Date().toISOString().split('T')[0]
    };

    storage.saveSettlement(s);
    loadData();
    toast.success("Settlement saved");
  };

  const getUserName = (id: string) =>
    users.find(u => u.id === id)?.name || 'Unknown';
  
  const getGroupName = (id: string) =>
    groups.find(g => g.id === id)?.name || 'Unknown';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settlements</h1>
          <p className="text-muted-foreground">Simplified resolution</p>
        </div>

        <div className="w-64">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map(g => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Balances */}
      <Card>
        <CardHeader>
          <CardTitle>User Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {balances.map(b => (
              <div
                key={b.userId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <UsersIcon className="w-5 h-5 text-primary-foreground" />
                  </div>

                  <div>
                    <p className="font-medium">{getUserName(b.userId)}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.balance >= 0
                        ? `Gets ₹${b.balance.toFixed(2)}`
                        : `Owes ₹${Math.abs(b.balance).toFixed(2)}`}
                    </p>
                  </div>
                </div>

                <p
                  className={`text-lg font-bold ${
                    b.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ₹{b.balance.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Settlements */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Settlements</CardTitle>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              All Settled!
            </div>
          ) : (
            <div className="space-y-3">
              {debts.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <p className="font-medium">
                    {getUserName(d.from)} pays {getUserName(d.to)}
                  </p>

                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold">
                      ₹{d.amount.toFixed(2)}
                    </span>
                    <Button onClick={() => settleTransaction(d)}>
                      Settle
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {settlements
                .slice(-12)
                .reverse()
                .map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {getUserName(s.from)} → {getUserName(s.to)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {s.date}{' '}
                        {s.groupId && `• ${getGroupName(s.groupId)}`}
                      </p>
                    </div>

                    <strong className="text-green-600">
                      ₹{s.amount.toFixed(2)}
                    </strong>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
