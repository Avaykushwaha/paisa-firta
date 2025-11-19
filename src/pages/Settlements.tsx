import { useState, useEffect } from 'react';
import { storage, User, Group, Expense, Settlement } from '@/lib/storage';
import { calculateDebts, getUserBalance, Debt } from '@/lib/settlement';
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
  const [debts, setDebts] = useState<Debt[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateCurrentDebts();
  }, [selectedGroupId, expenses, groups, users]);

  const loadData = () => {
    setUsers(storage.getUsers());
    setGroups(storage.getGroups());
    setExpenses(storage.getExpenses());
    setSettlements(storage.getSettlements());
  };

  const calculateCurrentDebts = () => {
    const filteredExpenses = selectedGroupId === 'all'
      ? expenses
      : expenses.filter(e => e.groupId === selectedGroupId);

    const group = selectedGroupId === 'all' ? undefined : groups.find(g => g.id === selectedGroupId);
    const currentDebts = calculateDebts(filteredExpenses, users, group);
    setDebts(currentDebts);
  };

  const handleSettle = (debt: Debt) => {
    const settlement: Settlement = {
      id: `settlement-${Date.now()}`,
      from: debt.from,
      to: debt.to,
      amount: debt.amount,
      groupId: selectedGroupId === 'all' ? undefined : selectedGroupId,
      date: new Date().toISOString().split('T')[0],
    };

    storage.saveSettlement(settlement);
    loadData();
    toast.success('Settlement recorded!');
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';
  const getGroupName = (id: string) => groups.find(g => g.id === id)?.name || 'Unknown';

  // Calculate user summaries
  const userSummaries = users.map(user => {
    const balance = getUserBalance(user.id, selectedGroupId === 'all' ? expenses : expenses.filter(e => e.groupId === selectedGroupId));
    const owes = debts.filter(d => d.from === user.id).reduce((sum, d) => sum + d.amount, 0);
    const owed = debts.filter(d => d.to === user.id).reduce((sum, d) => sum + d.amount, 0);
    return { user, balance, owes, owed };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settlements</h1>
          <p className="text-muted-foreground">Simplified debt resolution</p>
        </div>
        <div className="w-64">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* User Balances */}
      <Card>
        <CardHeader>
          <CardTitle>User Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userSummaries.map(({ user, balance, owes, owed }) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <UsersIcon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {balance >= 0 ? `Gets back ₹${balance.toFixed(2)}` : `Owes ₹${Math.abs(balance).toFixed(2)}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {balance >= 0 ? '+' : ''}₹{balance.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Settlements */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Settlements ({debts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {debts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">All settled up!</p>
              <p className="text-muted-foreground">No pending settlements</p>
            </div>
          ) : (
            <div className="space-y-3">
              {debts.map((debt, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                      <ArrowLeftRight className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {getUserName(debt.from)} pays {getUserName(debt.to)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Simplified settlement
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-2xl font-bold text-foreground">₹{debt.amount.toFixed(2)}</p>
                    <Button onClick={() => handleSettle(debt)} variant="outline">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Settle
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlement History */}
      {settlements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Settlement History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {settlements.slice(-10).reverse().map((settlement) => (
                <div key={settlement.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">
                      {getUserName(settlement.from)} → {getUserName(settlement.to)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {settlement.date}
                      {settlement.groupId && ` • ${getGroupName(settlement.groupId)}`}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-success">₹{settlement.amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
