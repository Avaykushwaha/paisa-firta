import { useState, useEffect } from 'react';
import { storage, Group, User } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit, FolderOpen, Users as UsersIcon, Heart } from 'lucide-react';
import { toast } from 'sonner';

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    members: [] as string[],
    couples: [] as [string, string][],
    coupleMode: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setGroups(storage.getGroups());
    setUsers(storage.getUsers());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    if (formData.members.length === 0) {
      toast.error('Add at least one member');
      return;
    }

    const group: Group = {
      id: editingGroup?.id || `group-${Date.now()}`,
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      members: formData.members,
      couples: formData.couples,
      coupleMode: formData.coupleMode,
      createdAt: editingGroup?.createdAt || new Date().toISOString(),
    };

    storage.saveGroup(group);
    loadData();
    handleDialogClose();
    toast.success(editingGroup ? 'Group updated' : 'Group created');
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      members: group.members,
      couples: group.couples || [],
      coupleMode: group.coupleMode || false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this group?')) {
      storage.deleteGroup(id);
      loadData();
      toast.success('Group deleted');
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingGroup(null);
    setFormData({
      name: '',
      description: '',
      members: [],
      couples: [],
      coupleMode: false,
    });
  };

  const toggleMember = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter(id => id !== userId)
        : [...prev.members, userId],
    }));
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Groups</h1>
          <p className="text-muted-foreground">Organize expenses by groups</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Roommates, Vacation 2024"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Members *</Label>
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No users available. Create users first.</p>
                ) : (
                  <div className="space-y-2 border border-border rounded-lg p-3 max-h-48 overflow-y-auto">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={user.id}
                          checked={formData.members.includes(user.id)}
                          onCheckedChange={() => toggleMember(user.id)}
                        />
                        <label htmlFor={user.id} className="text-sm font-medium cursor-pointer">
                          {user.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="coupleMode">Couple Mode</Label>
                  <p className="text-sm text-muted-foreground">Treat couples as single financial entities</p>
                </div>
                <Switch
                  id="coupleMode"
                  checked={formData.coupleMode}
                  onCheckedChange={(checked) => setFormData({ ...formData, coupleMode: checked })}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGroup ? 'Update' : 'Create'} Group
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No groups yet</p>
            <p className="text-muted-foreground mb-4">Create your first group to organize expenses</p>
            <Button onClick={() => setIsDialogOpen(true)} disabled={users.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Create Group
            </Button>
            {users.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">Create users first before creating groups</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <UsersIcon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{group.members.length} members</span>
                  {group.coupleMode && (
                    <>
                      <Heart className="w-4 h-4 text-secondary ml-2" />
                      <span className="text-muted-foreground">Couple mode</span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {group.members.map((memberId) => (
                    <span
                      key={memberId}
                      className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground"
                    >
                      {getUserName(memberId)}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(group)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(group.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
