import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Package, Upload, Download, History, Search, Undo2, Save } from 'lucide-react';
import { BulkImportDialog } from './BulkImportDialog';
import { PartsAuditLog } from './PartsAuditLog';
import { QuickAddPartDialog } from './QuickAddPartDialog';
import { EditableCell } from './EditableCell';
import { debounce } from 'lodash-es';

interface PartsCatalogueItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  base_price: number;
  sell_price: number;
  markup?: number;
  stock_quantity: number;
  in_stock: boolean;
  description?: string;
  supplier?: string;
  upc?: string;
}

interface EditingState {
  partId: string;
  field: string;
}

interface PendingUpdate {
  partId: string;
  field: string;
  oldValue: any;
  newValue: any;
}

interface UndoAction {
  partId: string;
  updates: Partial<PartsCatalogueItem>;
  description: string;
}

const CATEGORIES = [
  'Engine',
  'Fluids',
  'Cutting',
  'Drive System',
  'Hardware',
  'Electrical',
  'Hydraulics',
  'Transmission',
  'Filters',
  'Belts & Hoses',
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
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, PendingUpdate>>(new Map());
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkEditField, setBulkEditField] = useState<string>('');
  const [bulkEditValue, setBulkEditValue] = useState<any>('');
  const undoTimeoutRef = useRef<NodeJS.Timeout>();

  const { hasPermission, userRole } = useAuth();
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

  const canEditField = (field: string): boolean => {
    if (userRole === 'admin') return true;
    
    // Staff/Counter can edit: sell_price, base_price, stock_quantity, description
    const staffEditableFields = ['sell_price', 'base_price', 'stock_quantity', 'description', 'markup'];
    
    if (userRole === 'counter' || userRole === 'technician') {
      return staffEditableFields.includes(field);
    }
    
    return false;
  };

  const validateField = (field: string, value: any): string | null => {
    switch (field) {
      case 'sku':
        if (!value || value.trim() === '') return 'SKU is required';
        // Note: Unique validation happens server-side
        break;
      case 'name':
        if (!value || value.trim() === '') return 'Name is required';
        break;
      case 'sell_price':
      case 'base_price':
        if (value < 0) return 'Price cannot be negative';
        if (value === '' || value === null) return 'Price is required';
        break;
      case 'stock_quantity':
        if (value < 0) return 'Stock quantity cannot be negative';
        break;
      case 'markup':
        if (value !== null && value !== undefined && value < 0) return 'Markup cannot be negative';
        break;
    }
    return null;
  };

  const updatePartOptimistic = (partId: string, field: string, value: any) => {
    // Optimistically update UI
    setParts(prevParts =>
      prevParts.map(part =>
        part.id === partId ? { ...part, [field]: value } : part
      )
    );
  };

  const rollbackUpdate = (partId: string, field: string, oldValue: any) => {
    setParts(prevParts =>
      prevParts.map(part =>
        part.id === partId ? { ...part, [field]: oldValue } : part
      )
    );
    
    // Remove from pending
    setPendingUpdates(prev => {
      const newMap = new Map(prev);
      newMap.delete(`${partId}-${field}`);
      return newMap;
    });
  };

  const handleCellSave = async (partId: string, field: string, value: any) => {
    const part = parts.find(p => p.id === partId);
    if (!part) return;

    const oldValue = part[field as keyof PartsCatalogueItem];
    
    // Validate
    const error = validateField(field, value);
    if (error) {
      toast({
        title: "Validation error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    // Check if value actually changed
    if (oldValue === value) {
      setEditingState(null);
      return;
    }

    // Mark as pending
    const pendingKey = `${partId}-${field}`;
    setPendingUpdates(prev => new Map(prev).set(pendingKey, { partId, field, oldValue, newValue: value }));

    // Optimistic update
    updatePartOptimistic(partId, field, value);
    setEditingState(null);

    try {
      const { error: updateError } = await supabase
        .from('parts_catalogue')
        .update({ [field]: value })
        .eq('id', partId);

      if (updateError) throw updateError;

      // Remove from pending
      setPendingUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(pendingKey);
        return newMap;
      });

      // Add to undo stack
      const undoAction: UndoAction = {
        partId,
        updates: { [field]: oldValue },
        description: `Changed ${field} from ${oldValue} to ${value}`
      };
      setUndoStack(prev => [...prev.slice(-9), undoAction]); // Keep last 10

      // Show undo toast
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }

      toast({
        title: "Updated",
        description: (
          <div className="flex items-center justify-between">
            <span>Part updated successfully</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUndo(undoAction)}
              className="ml-2"
            >
              <Undo2 className="h-3 w-3 mr-1" />
              Undo
            </Button>
          </div>
        ),
        duration: 10000,
      });

    } catch (error: any) {
      // Rollback on error
      rollbackUpdate(partId, field, oldValue);
      
      toast({
        title: "Update failed",
        description: error.message || "Failed to update part",
        variant: "destructive",
      });
    }
  };

  const handleUndo = async (action: UndoAction) => {
    try {
      const { error } = await supabase
        .from('parts_catalogue')
        .update(action.updates)
        .eq('id', action.partId);

      if (error) throw error;

      // Update local state
      setParts(prevParts =>
        prevParts.map(part =>
          part.id === action.partId ? { ...part, ...action.updates } : part
        )
      );

      // Remove from undo stack
      setUndoStack(prev => prev.filter(a => a !== action));

      toast({
        title: "Undone",
        description: "Change has been reverted",
      });
    } catch (error: any) {
      toast({
        title: "Undo failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBulkEdit = async () => {
    if (selectedParts.size === 0 || !bulkEditField || bulkEditValue === '') return;

    // Validate
    const error = validateField(bulkEditField, bulkEditValue);
    if (error) {
      toast({
        title: "Validation error",
        description: error,
        variant: "destructive",
      });
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('parts_catalogue')
        .update({ [bulkEditField]: bulkEditValue })
        .in('id', Array.from(selectedParts));

      if (updateError) throw updateError;

      toast({
        title: "Bulk update successful",
        description: `Updated ${selectedParts.size} part(s)`,
      });

      setShowBulkEdit(false);
      setBulkEditField('');
      setBulkEditValue('');
      setSelectedParts(new Set());
      loadParts();
    } catch (error: any) {
      toast({
        title: "Bulk update failed",
        description: error.message,
        variant: "destructive",
      });
    }
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

  const navigateCell = (currentPartId: string, currentField: string, direction: 'next' | 'prev') => {
    const editableFields = ['sku', 'name', 'category', 'base_price', 'sell_price', 'stock_quantity', 'in_stock'];
    const allowedFields = editableFields.filter(f => canEditField(f));
    
    const currentFieldIndex = allowedFields.indexOf(currentField);
    const currentPartIndex = filteredParts.findIndex(p => p.id === currentPartId);

    if (direction === 'next') {
      if (currentFieldIndex < allowedFields.length - 1) {
        // Move to next field in same row
        setEditingState({ partId: currentPartId, field: allowedFields[currentFieldIndex + 1] });
      } else if (currentPartIndex < filteredParts.length - 1) {
        // Move to first field of next row
        setEditingState({ partId: filteredParts[currentPartIndex + 1].id, field: allowedFields[0] });
      }
    } else {
      if (currentFieldIndex > 0) {
        // Move to previous field in same row
        setEditingState({ partId: currentPartId, field: allowedFields[currentFieldIndex - 1] });
      } else if (currentPartIndex > 0) {
        // Move to last field of previous row
        setEditingState({ partId: filteredParts[currentPartIndex - 1].id, field: allowedFields[allowedFields.length - 1] });
      }
    }
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

          {selectedParts.size > 0 && (
            <div className="mb-4 p-4 bg-muted rounded-lg flex items-center justify-between">
              <span>{selectedParts.size} part(s) selected</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowBulkEdit(true)}>
                  <Save className="h-4 w-4 mr-2" />
                  Bulk Edit
                </Button>
                {hasPermission('all') && (
                  <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected (Del)
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedParts.size === filteredParts.length && filteredParts.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Sell Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No parts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedParts.has(part.id)}
                          onCheckedChange={() => toggleSelect(part.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={part.sku}
                          type="text"
                          isEditing={editingState?.partId === part.id && editingState?.field === 'sku'}
                          isDisabled={!canEditField('sku')}
                          isPending={pendingUpdates.has(`${part.id}-sku`)}
                          onEdit={() => setEditingState({ partId: part.id, field: 'sku' })}
                          onSave={(value) => handleCellSave(part.id, 'sku', value)}
                          onCancel={() => setEditingState(null)}
                          onNavigate={(dir) => navigateCell(part.id, 'sku', dir)}
                          validation={(value) => validateField('sku', value)}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={part.name}
                          type="text"
                          isEditing={editingState?.partId === part.id && editingState?.field === 'name'}
                          isDisabled={!canEditField('name')}
                          isPending={pendingUpdates.has(`${part.id}-name`)}
                          onEdit={() => setEditingState({ partId: part.id, field: 'name' })}
                          onSave={(value) => handleCellSave(part.id, 'name', value)}
                          onCancel={() => setEditingState(null)}
                          onNavigate={(dir) => navigateCell(part.id, 'name', dir)}
                          validation={(value) => validateField('name', value)}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={part.category}
                          type="select"
                          options={CATEGORIES}
                          isEditing={editingState?.partId === part.id && editingState?.field === 'category'}
                          isDisabled={!canEditField('category')}
                          isPending={pendingUpdates.has(`${part.id}-category`)}
                          onEdit={() => setEditingState({ partId: part.id, field: 'category' })}
                          onSave={(value) => handleCellSave(part.id, 'category', value)}
                          onCancel={() => setEditingState(null)}
                          onNavigate={(dir) => navigateCell(part.id, 'category', dir)}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={part.base_price}
                          type="currency"
                          isEditing={editingState?.partId === part.id && editingState?.field === 'base_price'}
                          isDisabled={!canEditField('base_price')}
                          isPending={pendingUpdates.has(`${part.id}-base_price`)}
                          onEdit={() => setEditingState({ partId: part.id, field: 'base_price' })}
                          onSave={(value) => handleCellSave(part.id, 'base_price', value)}
                          onCancel={() => setEditingState(null)}
                          onNavigate={(dir) => navigateCell(part.id, 'base_price', dir)}
                          validation={(value) => validateField('base_price', value)}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={part.sell_price}
                          type="currency"
                          isEditing={editingState?.partId === part.id && editingState?.field === 'sell_price'}
                          isDisabled={!canEditField('sell_price')}
                          isPending={pendingUpdates.has(`${part.id}-sell_price`)}
                          onEdit={() => setEditingState({ partId: part.id, field: 'sell_price' })}
                          onSave={(value) => handleCellSave(part.id, 'sell_price', value)}
                          onCancel={() => setEditingState(null)}
                          onNavigate={(dir) => navigateCell(part.id, 'sell_price', dir)}
                          validation={(value) => validateField('sell_price', value)}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={part.stock_quantity}
                          type="number"
                          isEditing={editingState?.partId === part.id && editingState?.field === 'stock_quantity'}
                          isDisabled={!canEditField('stock_quantity')}
                          isPending={pendingUpdates.has(`${part.id}-stock_quantity`)}
                          onEdit={() => setEditingState({ partId: part.id, field: 'stock_quantity' })}
                          onSave={(value) => handleCellSave(part.id, 'stock_quantity', value)}
                          onCancel={() => setEditingState(null)}
                          onNavigate={(dir) => navigateCell(part.id, 'stock_quantity', dir)}
                          validation={(value) => validateField('stock_quantity', value)}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={part.in_stock}
                          type="boolean"
                          isEditing={editingState?.partId === part.id && editingState?.field === 'in_stock'}
                          isDisabled={!canEditField('in_stock')}
                          isPending={pendingUpdates.has(`${part.id}-in_stock`)}
                          onEdit={() => setEditingState({ partId: part.id, field: 'in_stock' })}
                          onSave={(value) => handleCellSave(part.id, 'in_stock', value)}
                          onCancel={() => setEditingState(null)}
                          onNavigate={(dir) => navigateCell(part.id, 'in_stock', dir)}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Edit Dialog */}
      <AlertDialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Edit {selectedParts.size} Part(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Select a field and enter a new value to apply to all selected parts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Select value={bulkEditField} onValueChange={setBulkEditField}>
              <SelectTrigger>
                <SelectValue placeholder="Select field to edit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="in_stock">In Stock Status</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                {userRole === 'admin' && <SelectItem value="markup">Markup %</SelectItem>}
              </SelectContent>
            </Select>
            {bulkEditField === 'category' && (
              <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {bulkEditField === 'in_stock' && (
              <Select value={String(bulkEditValue)} onValueChange={(v) => setBulkEditValue(v === 'true')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">In Stock</SelectItem>
                  <SelectItem value="false">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            )}
            {(bulkEditField === 'supplier' || bulkEditField === 'markup') && (
              <Input
                placeholder={`Enter ${bulkEditField}`}
                value={bulkEditValue}
                onChange={(e) => setBulkEditValue(bulkEditField === 'markup' ? Number(e.target.value) : e.target.value)}
                type={bulkEditField === 'markup' ? 'number' : 'text'}
              />
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkEdit}>
              Apply to {selectedParts.size} Part(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
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
