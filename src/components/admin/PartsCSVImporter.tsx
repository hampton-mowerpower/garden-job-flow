import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const PartsCSVImporter: React.FC = () => {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<{ imported: number; updated: number; errors: number } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    setStats(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());

      // Validate headers
      const requiredHeaders = ['Equipment Category', 'Part Group', 'Part Name', 'Sell Price', 'Active'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }

      let imported = 0;
      let updated = 0;
      let errors = 0;

      // Process each row
      for (let i = 1; i < lines.length; i++) {
        try {
          // Handle CSV with quoted values
          const row: any = {};
          let currentCol = 0;
          let currentValue = '';
          let inQuotes = false;
          
          for (let char of lines[i]) {
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              row[headers[currentCol]] = currentValue.trim();
              currentValue = '';
              currentCol++;
            } else {
              currentValue += char;
            }
          }
          row[headers[currentCol]] = currentValue.trim();

          // Skip inactive rows
          if (row['Active']?.toLowerCase() !== 'yes') continue;

          const equipmentCategory = row['Equipment Category']?.trim();
          const partGroup = row['Part Group']?.trim();
          const partName = row['Part Name']?.trim();
          
          if (!equipmentCategory || !partName) {
            errors++;
            continue;
          }

          // Generate unique SKU if not provided
          const sku = row['SKU']?.trim() || `${equipmentCategory.substring(0, 3).toUpperCase()}-${partGroup?.substring(0, 3).toUpperCase() || 'GEN'}-${Date.now()}-${i}`;
          
          // Parse data
          const partData: any = {
            sku,
            category: equipmentCategory,
            name: partName,
            base_price: parseFloat(row['Base Price']) || parseFloat(row['Sell Price']) || 0,
            sell_price: parseFloat(row['Sell Price']) || 0,
            in_stock: true,
            description: row['Notes'] || null,
            supplier: row['Competitor Site'] || null
          };

          // Add part_group if present (will need migration to add column)
          if (partGroup) {
            partData.part_group = partGroup;
          }

          // Upsert part (insert or update based on unique constraint)
          const { error } = await supabase
            .from('parts_catalogue')
            .upsert({
              ...partData,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'sku',
              ignoreDuplicates: false
            });

          if (error) {
            console.error(`Error importing row ${i}:`, error);
            errors++;
          } else {
            imported++;
          }
        } catch (rowError) {
          console.error(`Error processing row ${i}:`, rowError);
          errors++;
        }
      }

      setStats({ imported, updated, errors });
      
      toast({
        title: "Import Complete",
        description: `Imported ${imported} parts${errors > 0 ? `, ${errors} errors` : ''}`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import CSV",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const template = `SKU,Equipment Category,Part Group,Part Name,Base Price,Sell Price,Tax Code,Active,Competitor Site,Competitor Item,Competitor Price (AUD),Notes
,Lawn Mower,Carburettor,Air Filter,18.33,22.0,GST,Yes,,,,Example part
,Chainsaw,Engine / Sundry Parts,Spark Plug,15.0,18.0,GST,Yes,,,,Another example`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parts_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Parts Catalog (v16)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="csv-file">Upload CSV File</Label>
          <div className="flex gap-2 mt-2">
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={importing}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplate}
              disabled={importing}
            >
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Upload the v16 parts master CSV to sync prices. Active parts will be imported/updated.
          </p>
        </div>

        {importing && (
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              Importing parts... Please wait.
            </AlertDescription>
          </Alert>
        )}

        {stats && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Import Results:</strong><br />
              Imported/Updated: {stats.imported}<br />
              {stats.errors > 0 && `Errors: ${stats.errors}`}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
