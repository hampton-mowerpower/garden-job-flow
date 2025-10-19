// @ts-nocheck
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportRow {
  sku: string;
  name: string;
  category: string;
  base_price: number;
  sell_price: number;
  markup?: number;
  stock_quantity: number;
  description?: string;
  supplier?: string;
  valid: boolean;
  errors: string[];
}

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function BulkImportDialog({ open, onOpenChange, onImportComplete }: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const downloadTemplate = () => {
    const template = [
      ['SKU*', 'Name*', 'Category*', 'Base Price*', 'Sell Price*', 'Markup %', 'Stock Quantity*', 'Description', 'Supplier'],
      ['PART-001', 'Sample Part', 'Engine Parts', '50.00', '60.00', '20', '10', 'Sample description', 'Supplier Name']
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Parts Template');
    XLSX.writeFile(wb, 'parts_import_template.xlsx');

    toast({
      title: "Template downloaded",
      description: "Fill in the template and upload it to import parts."
    });
  };

  const validateRow = (row: any, index: number): ImportRow => {
    const errors: string[] = [];

    if (!row.sku || String(row.sku).trim() === '') errors.push('SKU is required');
    if (!row.name || String(row.name).trim() === '') errors.push('Name is required');
    if (!row.category || String(row.category).trim() === '') errors.push('Category is required');
    
    const basePrice = parseFloat(row.base_price);
    const sellPrice = parseFloat(row.sell_price);
    const stockQty = parseInt(row.stock_quantity);

    if (isNaN(basePrice) || basePrice < 0) errors.push('Base price must be a positive number');
    if (isNaN(sellPrice) || sellPrice < 0) errors.push('Sell price must be a positive number');
    if (isNaN(stockQty) || stockQty < 0) errors.push('Stock quantity must be a positive number');

    return {
      sku: String(row.sku || '').trim(),
      name: String(row.name || '').trim(),
      category: String(row.category || '').trim(),
      base_price: basePrice,
      sell_price: sellPrice,
      markup: row.markup ? parseFloat(row.markup) : undefined,
      stock_quantity: stockQty,
      description: row.description ? String(row.description).trim() : undefined,
      supplier: row.supplier ? String(row.supplier).trim() : undefined,
      valid: errors.length === 0,
      errors
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });

        // Skip header row and parse
        const rows = jsonData.slice(1).map((row: any, index) => {
          const normalized = {
            sku: row.A,
            name: row.B,
            category: row.C,
            base_price: row.D,
            sell_price: row.E,
            markup: row.F,
            stock_quantity: row.G,
            description: row.H,
            supplier: row.I
          };
          return validateRow(normalized, index + 2);
        });

        setPreviewData(rows);

        const errors: ValidationError[] = [];
        rows.forEach((row, index) => {
          if (!row.valid) {
            row.errors.forEach(error => {
              errors.push({ row: index + 2, field: '', message: error });
            });
          }
        });
        setValidationErrors(errors);

      } catch (error) {
        toast({
          title: "Error reading file",
          description: "Failed to parse the uploaded file. Please check the format.",
          variant: "destructive"
        });
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const handleImport = async () => {
    const validRows = previewData.filter(row => row.valid);
    
    if (validRows.length === 0) {
      toast({
        title: "No valid rows",
        description: "Please fix validation errors before importing.",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);

    try {
      const { data, error } = await supabase
        .from('parts_catalogue')
        .insert(validRows.map(row => ({
          sku: row.sku,
          name: row.name,
          category: row.category,
          base_price: row.base_price,
          sell_price: row.sell_price,
          markup: row.markup,
          stock_quantity: row.stock_quantity,
          description: row.description,
          supplier: row.supplier,
          in_stock: row.stock_quantity > 0
        })));

      if (error) throw error;

      toast({
        title: "Import successful",
        description: `Successfully imported ${validRows.length} parts.`
      });

      onImportComplete();
      onOpenChange(false);
      setFile(null);
      setPreviewData([]);
      setValidationErrors([]);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const validCount = previewData.filter(r => r.valid).length;
  const invalidCount = previewData.length - validCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Parts</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button onClick={downloadTemplate} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Download Template
            </Button>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="bulk-import-file"
            />
            <Button onClick={() => document.getElementById('bulk-import-file')?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          </div>

          {file && (
            <Alert>
              <AlertDescription>
                File: {file.name} - {previewData.length} rows
              </AlertDescription>
            </Alert>
          )}

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {invalidCount} rows have validation errors. Please fix them before importing.
              </AlertDescription>
            </Alert>
          )}

          {previewData.length > 0 && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Badge variant="default">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {validCount} Valid
                </Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {invalidCount} Invalid
                  </Badge>
                )}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Sell Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Errors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index} className={!row.valid ? 'bg-destructive/10' : ''}>
                        <TableCell>
                          {row.valid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono">{row.sku}</TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>${row.base_price?.toFixed(2)}</TableCell>
                        <TableCell>${row.sell_price?.toFixed(2)}</TableCell>
                        <TableCell>{row.stock_quantity}</TableCell>
                        <TableCell>
                          {row.errors.length > 0 && (
                            <div className="text-xs text-destructive">
                              {row.errors.join(', ')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleImport} 
                  disabled={validCount === 0 || importing}
                >
                  {importing ? 'Importing...' : `Import ${validCount} Parts`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
