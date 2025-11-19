import { useState, useEffect } from 'react';
import { storage, Expense, User, Group, Split, SplitMode } from '@/lib/storage';
import { calculateSplits } from '@/lib/settlement';
import { categories, getCategoryById } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Edit, Receipt } from 'lucide-react';
import { toast } from 'sonner';

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0],
    groupId: '',
    payerId: '',
    splitMode: 'equal' as SplitMode,
    notes: '',
    selectedMembers: [] as string[],
    customValues: {} as Record<string, number>,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setExpenses(storage.getExpenses());
    setUsers(storage.getUsers());
    setGroups(storage.getGroups());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.amount || !formData.groupId || !formData.payerId) {
      toast.error('Please fill all required fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount');
      return;
    }

    const group = groups.find(g => g.id === formData.groupId);
    if (!group) {
      toast.error('Invalid group');
      return;
    }

    if (formData.selectedMembers.length === 0) {
      toast.error('Select at least one member to split with');
      return;
    }

    // For custom split modes, get custom values
    const customValuesArray = formData.splitMode !== 'equal' 
      ? formData.selectedMembers.map(id => formData.customValues[id] || 0)
      : undefined;

    const splits = calculateSplits(amount, formData.splitMode, formData.selectedMembers, customValuesArray);

    const expense: Expense = {
      id: editingExpense?.id || `expense-${Date.now()}`,
      title: formData.title.trim(),
      amount,
      category: formData.category,
      date: formData.date,
      groupId: formData.groupId,
      payers: [{ userId: formData.payerId, amount }],
      splits,
      splitMode: formData.splitMode,
      notes: formData.notes.trim() || undefined,
      createdAt: editingExpense?.createdAt || new Date().toISOString(),
    };

    storage.saveExpense(expense);
    loadData();
    handleDialogClose();
    toast.success(editingExpense ? 'Expense updated' : 'Expense added');
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    const customValues: Record<string, number> = {};
    expense.splits.forEach(split => {
      customValues[split.userId] = split.amount;
    });
    
    setFormData({
      title: expense.title,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      groupId: expense.groupId,
      payerId: expense.payers[0]?.userId || '',
      splitMode: expense.splitMode,
      notes: expense.notes || '',
      selectedMembers: expense.splits.map(s => s.userId),
      customValues,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      storage.deleteExpense(id);
      loadData();
      toast.success('Expense deleted');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
    setFormData({
      title: '',
      amount: '',
      category: 'food',
      date: new Date().toISOString().split('T')[0],
      groupId: '',
      payerId: '',
      splitMode: 'equal',
      notes: '',
      selectedMembers: [],
      customValues: {},
    });
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';
  const getGroupName = (id: string) => groups.find(g => g.id === id)?.name || 'Unknown';
  
  const selectedGroup = groups.find(g => g.id === formData.groupId);
  
  const toggleMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedMembers: prev.selectedMembers.includes(userId)
        ? prev.selectedMembers.filter(id => id !== userId)
        : [...prev.selectedMembers, userId],
    }));
  };

  const updateCustomValue = (userId: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      customValues: {
        ...prev.customValues,
        [userId]: value,
      },
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Expenses</h1>
          <p className="text-muted-foreground">Track and split expenses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Dinner at restaurant"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group">Group *</Label>
                  <Select
                    value={formData.groupId}
                    onValueChange={(value) => {
                      const group = groups.find(g => g.id === value);
                      setFormData({
                        ...formData,
                        groupId: value,
                        payerId: group?.members[0] || '',
                        selectedMembers: group?.members || [],
                      });
                    }}
                  >
                    <SelectTrigger id="group">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.groupId && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="payer">Paid By *</Label>
                      <Select value={formData.payerId} onValueChange={(value) => setFormData({ ...formData, payerId: value })}>
                        <SelectTrigger id="payer">
                          <SelectValue placeholder="Select payer" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups
                            .find(g => g.id === formData.groupId)
                            ?.members.map((memberId) => (
                              <SelectItem key={memberId} value={memberId}>
                                {getUserName(memberId)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Split Between *</Label>
                      <p className="text-sm text-muted-foreground">Select members and enter custom values if needed</p>
                      <div className="space-y-2 border border-border rounded-lg p-3 max-h-64 overflow-y-auto">
                        {selectedGroup?.members.map((memberId) => (
                          <div key={memberId} className="flex items-center gap-3">
                            <Checkbox
                              id={`member-${memberId}`}
                              checked={formData.selectedMembers.includes(memberId)}
                              onCheckedChange={() => toggleMember(memberId)}
                            />
                            <label htmlFor={`member-${memberId}`} className="text-sm font-medium cursor-pointer flex-1">
                              {getUserName(memberId)}
                            </label>
                            {formData.selectedMembers.includes(memberId) && formData.splitMode !== 'equal' && (
                              <Input
                                type="number"
                                step="0.01"
                                placeholder={
                                  formData.splitMode === 'exact' ? '₹ Amount' :
                                  formData.splitMode === 'percent' ? '% Percent' :
                                  '# Shares'
                                }
                                value={formData.customValues[memberId] || ''}
                                onChange={(e) => updateCustomValue(memberId, parseFloat(e.target.value) || 0)}
                                className="w-32"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="splitMode">Split Mode *</Label>
                      <Select value={formData.splitMode} onValueChange={(value: SplitMode) => setFormData({ ...formData, splitMode: value })}>
                        <SelectTrigger id="splitMode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equal">Equal Split</SelectItem>
                          <SelectItem value="exact">Exact Amounts</SelectItem>
                          <SelectItem value="percent">Percentage</SelectItem>
                          <SelectItem value="shares">Shares</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!formData.groupId}>
                  {editingExpense ? 'Update' : 'Add'} Expense
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {expenses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Receipt className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No expenses yet</p>
            <p className="text-muted-foreground mb-4">Add your first expense to start tracking</p>
            <Button onClick={() => setIsDialogOpen(true)} disabled={groups.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">Create a group first before adding expenses</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => {
            const category = getCategoryById(expense.category);
            const CategoryIcon = category?.icon || Receipt;
            return (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: category?.color || 'hsl(var(--muted))' }}
                      >
                        <CategoryIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{expense.title}</h3>
                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                          <span>{category?.name}</span>
                          <span>•</span>
                          <span>{getGroupName(expense.groupId)}</span>
                          <span>•</span>
                          <span>{expense.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Paid by {getUserName(expense.payers[0]?.userId)} • Split {expense.splitMode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">₹{expense.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{expense.splits.length} people</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(expense)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(expense.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {expense.notes && (
                    <p className="mt-3 text-sm text-muted-foreground pl-16">{expense.notes}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
