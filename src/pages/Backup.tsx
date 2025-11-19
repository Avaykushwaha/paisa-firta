import { useState } from 'react';
import { storage } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function Backup() {
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleExport = () => {
    const data = storage.exportBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paisa-firta-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast.success('Backup exported successfully');
  };

  const handleImport = () => {
    if (!importFile) {
      toast.error('Please select a file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        storage.importBackup(jsonString);
        toast.success('Backup imported successfully');
        setImportFile(null);
        // Reload page to reflect changes
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast.error('Invalid backup file');
      }
    };
    reader.readAsText(importFile);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
      if (confirm('This will permanently delete all users, groups, expenses, and settlements. Continue?')) {
        storage.clearAll();
        toast.success('All data cleared');
        setTimeout(() => window.location.reload(), 1000);
      }
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Backup & Restore</h1>
        <p className="text-muted-foreground">Manage your offline data</p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          All data is stored locally in your browser. Make regular backups to prevent data loss.
        </AlertDescription>
      </Alert>

      {/* Export Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Export Backup</CardTitle>
          <CardDescription>
            Download all your data as a JSON file. You can import this file later to restore your data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export All Data
          </Button>
        </CardContent>
      </Card>

      {/* Import Backup */}
      <Card>
        <CardHeader>
          <CardTitle>Import Backup</CardTitle>
          <CardDescription>
            Restore data from a previously exported backup file. This will replace all current data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                cursor-pointer"
            />
          </div>
          <Button onClick={handleImport} disabled={!importFile}>
            <Upload className="w-4 h-4 mr-2" />
            Import Backup
          </Button>
        </CardContent>
      </Card>

      {/* Clear All Data */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete all data from local storage. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleClearAll}>
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Local Storage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Paisa Firta stores all data locally in your browser using LocalStorage. This means:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>No internet connection required</li>
            <li>Data stays private on your device</li>
            <li>Data persists across browser sessions</li>
            <li>Clearing browser data will delete app data</li>
            <li>Data is not synced across devices</li>
          </ul>
          <p className="font-medium text-foreground">
            Recommendation: Export regular backups to protect your data!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
