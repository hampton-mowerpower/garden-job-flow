import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Package, Upload, Download, History, Search } from 'lucide-react';
import { BulkImportDialog } from './BulkImportDialog';
import { PartsAuditLog } from './PartsAuditLog';
import { QuickAddPartDialog } from './QuickAddPartDialog';
import { debounce } from 'lodash-es';

interface PartsCatalogueItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  base_price: number;
  sell_price: number;
  stock_quantity: number;
  in_stock: boolean;
  description?: string;
  supplier?: string;
}

const CATEGORIES = [
  'Engine Parts',
  'Electrical',
  'Hydraulics',
  'Transmission',
  'Filters',
  'Belts & Hoses',
  'Hardware',
  'Tools',
  'Other'
];

export function EnhancedPartsCatalogue() {
  const [parts, setParts] = useState<PartsCatalogueItem[]>([]);
  const [filteredParts, setFilteredParts] = useState<PartsCatalogueItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<PartsCatalogueItem>>({});

  const { hasPermission } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadParts();
    setupKeyboardShortcuts();
  }, []);

  useEffect(() => {
    filterParts();
  }, [parts, searchTerm, selectedCategory]);

  const setupKeyboardShortcuts = () => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'n' && hasPermission('all')) {
        e.preventDefault();
        document.getElementById('add-part-trigger')?.click();
      } else if (e.key === '/') {
        e.preventDefault();
        document.getElementById('search-parts')?.focus();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedParts.size > 0 && hasPermission('all')) {
        e.preventDefault();
        setShowDeleteDialog(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  };

  const loadParts = async () => {
    try {
      const { data, error } = await supabase
        .from('parts_catalogue')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;
      setParts(data || []);
    } catch (error) {
      toast({
        title: "Error loading parts",
        description: "Failed to load parts catalogue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const debouncedFilter = useCallback(
    debounce(() => {
      let filtered = parts;

      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(part =>
          part.name.toLowerCase().includes(search) ||
          part.sku.toLowerCase().includes(search) ||
          part.description?.toLowerCase().includes(search)
        );
      }

      if (selectedCategory !== 'all') {
        filtered = filtered.filter(part => part.category === selectedCategory);
      }

      setFilteredParts(filtered);
    }, 200),
    [parts, searchTerm, selectedCategory]
  );

  const filterParts = () => {
    debouncedFilter();
  };

  const handleDelete = async () => {
    if (selectedParts.size === 0) return;

    try {
      const { error } = await supabase
        .from('parts_catalogue')
        .delete()
        .in('id', Array.from(selectedParts));

      if (error) throw error;

      toast({
        title: "Parts deleted",
        description: `Successfully deleted ${selectedParts.size} part(s).`,
      });

      setSelectedParts(new Set());
      loadParts();
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleInlineEdit = async (partId: string) => {
    if (!editValues || Object.keys(editValues).length === 0) {
      setEditingRow(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('parts_catalogue')
        .update(editValues)
        .eq('id', partId);

      if (error) throw error;

      toast({
        title: "Part updated",
        description: "Part has been updated successfully.",
      });

      setEditingRow(null);
      setEditValues({});
      loadParts();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Base Price', 'Sell Price', 'Stock', 'Supplier'];
    const rows = filteredParts.map(part => [
      part.sku,
      part.name,
      part.category,
      part.base_price.toFixed(2),
      part.sell_price.toFixed(2),
      part.stock_quantity,
      part.supplier || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parts-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Exported ${filteredParts.length} parts to CSV.`
    });
  };

  const toggleSelectAll = () => {
    if (selectedParts.size === filteredParts.length) {
      setSelectedParts(new Set());
    } else {
      setSelectedParts(new Set(filteredParts.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedParts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedParts(newSelected);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading parts catalogue...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6" />
              <CardTitle>Parts Catalogue</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAuditLog(true)}>
                <History className="h-4 w-4 mr-2" />
                Audit Log
              </Button>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowImportDialog(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              {hasPermission('all') && (
                <QuickAddPartDialog 
                  onPartAdded={loadParts}
                  trigger={
                    <Button id="add-part-trigger">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Part (N)
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-parts"
                placeholder="Search parts... (Press / to focus)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedParts.size > 0 && hasPermission('all') && (
            <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
              <span>{selectedParts.size} part(s) selected</span>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected (Del)
              </Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                {hasPermission('all') && (
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedParts.size === filteredParts.length && filteredParts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sell Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                {hasPermission('all') && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={hasPermission('all') ? 8 : 7} className="text-center">
                    No parts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredParts.map((part) => (
                  <TableRow key={part.id} className={editingRow === part.id ? 'bg-muted/50' : ''}>
                    {hasPermission('all') && (
                      <TableCell>
                        <Checkbox
                          checked={selectedParts.has(part.id)}
                          onCheckedChange={() => toggleSelect(part.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="font-mono">{part.sku}</TableCell>
                    <TableCell>{part.name}</TableCell>
                    <TableCell>{part.category}</TableCell>
                    <TableCell>${part.sell_price.toFixed(2)}</TableCell>
                    <TableCell>{part.stock_quantity}</TableCell>
                    <TableCell>
                      <Badge variant={part.in_stock ? "default" : "secondary"}>
                        {part.in_stock ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </TableCell>
                    {hasPermission('all') && (
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (editingRow === part.id) {
                                handleInlineEdit(part.id);
                              } else {
                                setEditingRow(part.id);
                                setEditValues(part);
                              }
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedParts.size} part(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected parts will be permanently deleted from the catalogue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BulkImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={loadParts}
      />

      <PartsAuditLog
        open={showAuditLog}
        onOpenChange={setShowAuditLog}
      />
    </div>
  );
}
