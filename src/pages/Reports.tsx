import { useState, useEffect } from 'react';
import { storage, Expense, User, Group } from '@/lib/storage';
import { categories, getCategoryById } from '@/lib/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Receipt } from 'lucide-react';
import { toast } from 'sonner';

export default function Reports() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    groupId: 'all',
    userId: 'all',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    setExpenses(storage.getExpenses());
    setUsers(storage.getUsers());
    setGroups(storage.getGroups());
  }, []);

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';
  const getGroupName = (id: string) => groups.find(g => g.id === id)?.name || 'Unknown';

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    if (filters.search && !expense.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.category !== 'all' && expense.category !== filters.category) {
      return false;
    }
    if (filters.groupId !== 'all' && expense.groupId !== filters.groupId) {
      return false;
    }
    if (filters.userId !== 'all' && !expense.splits.some(s => s.userId === filters.userId)) {
      return false;
    }
    if (filters.startDate && expense.date < filters.startDate) {
      return false;
    }
    if (filters.endDate && expense.date > filters.endDate) {
      return false;
    }
    return true;
  });

  // Calculate summary
  const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const categoryBreakdown = categories.map(cat => {
    const total = filteredExpenses
      .filter(exp => exp.category === cat.id)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return { category: cat.name, total };
  }).filter(c => c.total > 0);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Title', 'Amount', 'Category', 'Group', 'Paid By', 'Split Mode', 'Notes'];
    const rows = filteredExpenses.map(exp => [
      exp.date,
      exp.title,
      exp.amount,
      getCategoryById(exp.category)?.name || exp.category,
      getGroupName(exp.groupId),
      getUserName(exp.payers[0]?.userId),
      exp.splitMode,
      exp.notes || '',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Reports</h1>
          <p className="text-muted-foreground">Analyze your spending patterns</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search expenses..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.groupId} onValueChange={(value) => setFilters({ ...filters, groupId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.userId} onValueChange={(value) => setFilters({ ...filters, userId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Start date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <Input
              type="date"
              placeholder="End date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{totalAmount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{filteredExpenses.length > 0 ? (totalAmount / filteredExpenses.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {categoryBreakdown.length > 0 ? categoryBreakdown[0].category : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {categoryBreakdown.length > 0 ? `₹${categoryBreakdown[0].total.toFixed(2)}` : 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expense Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">No expenses found</p>
              <p className="text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Paid By</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => {
                    const category = getCategoryById(expense.category);
                    const CategoryIcon = category?.icon || Receipt;
                    return (
                      <TableRow key={expense.id}>
                        <TableCell>{expense.date}</TableCell>
                        <TableCell className="font-medium">{expense.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CategoryIcon className="w-4 h-4" style={{ color: category?.color }} />
                            {category?.name}
                          </div>
                        </TableCell>
                        <TableCell>{getGroupName(expense.groupId)}</TableCell>
                        <TableCell>{getUserName(expense.payers[0]?.userId)}</TableCell>
                        <TableCell className="text-right font-semibold">₹{expense.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoryBreakdown.map(({ category, total }) => (
                <div key={category} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="font-medium text-foreground">{category}</span>
                  <span className="font-semibold text-foreground">₹{total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
