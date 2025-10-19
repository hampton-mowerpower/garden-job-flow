// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Check, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface DuplicateGroup {
  normalized_name: string;
  ids: string[];
  names: string[];
  brand_count?: number;
  part_count?: number;
  model_count?: number;
  category_name?: string;
}

export function DuplicatesManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categoryDuplicates, setCategoryDuplicates] = useState<DuplicateGroup[]>([]);
  const [brandDuplicates, setBrandDuplicates] = useState<DuplicateGroup[]>([]);
  const [selectedTab, setSelectedTab] = useState('categories');

  const findDuplicates = async () => {
    setLoading(true);
    try {
      // Find category duplicates
      const { data: catData, error: catError } = await supabase
        .rpc('find_duplicate_categories');

      if (catError) throw catError;

      setCategoryDuplicates(
        (catData || []).map((dup: any) => ({
          normalized_name: dup.normalized_name,
          ids: dup.category_ids,
          names: dup.category_names,
          brand_count: parseInt(dup.brand_count),
          part_count: parseInt(dup.part_count)
        }))
      );

      // Find brand duplicates
      const { data: brandData, error: brandError } = await supabase
        .rpc('find_duplicate_brands');

      if (brandError) throw brandError;

      setBrandDuplicates(
        (brandData || []).map((dup: any) => ({
          normalized_name: dup.normalized_name,
          ids: dup.brand_ids,
          names: dup.brand_names,
          category_name: dup.category_name,
          model_count: parseInt(dup.model_count)
        }))
      );

      toast({
        title: 'Scan complete',
        description: `Found ${(catData || []).length} category duplicates and ${(brandData || []).length} brand duplicates`
      });
    } catch (error: any) {
      console.error('Error finding duplicates:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to find duplicates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Duplicates</CardTitle>
        <CardDescription>
          Find and merge duplicate categories and brands to maintain data integrity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <Button onClick={findDuplicates} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Find Duplicates
              </>
            )}
          </Button>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList>
            <TabsTrigger value="categories">
              Categories {categoryDuplicates.length > 0 && <Badge variant="destructive" className="ml-2">{categoryDuplicates.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="brands">
              Brands {brandDuplicates.length > 0 && <Badge variant="destructive" className="ml-2">{brandDuplicates.length}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            {categoryDuplicates.length === 0 ? (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  No duplicate categories found. Great job keeping things clean!
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {categoryDuplicates.map((group, idx) => (
                  <CategoryDuplicateGroup
                    key={idx}
                    group={group}
                    onMerged={findDuplicates}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="brands">
            {brandDuplicates.length === 0 ? (
              <Alert>
                <Check className="h-4 w-4" />
                <AlertDescription>
                  No duplicate brands found. Great job keeping things clean!
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {brandDuplicates.map((group, idx) => (
                  <BrandDuplicateGroup
                    key={idx}
                    group={group}
                    onMerged={findDuplicates}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function CategoryDuplicateGroup({ group, onMerged }: { group: DuplicateGroup; onMerged: () => void }) {
  const { toast } = useToast();
  const [primaryId, setPrimaryId] = useState(group.ids[0]);
  const [merging, setMerging] = useState(false);

  const handleMerge = async () => {
    const duplicateIds = group.ids.filter(id => id !== primaryId);
    
    if (duplicateIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select duplicates to merge',
        variant: 'destructive'
      });
      return;
    }

    if (!confirm(`Merge ${duplicateIds.length} duplicate(s) into the primary category? This will affect ${group.brand_count} brands and ${group.part_count} parts.`)) {
      return;
    }

    setMerging(true);
    try {
      const { data, error } = await supabase
        .rpc('merge_categories', {
          primary_id: primaryId,
          duplicate_ids: duplicateIds
        });

      if (error) throw error;

      const result = data as any;
      toast({
        title: 'Success',
        description: `Merged ${result.merged_count} duplicate(s). Updated ${result.affected_brands} brands and ${result.affected_parts} parts.`
      });

      onMerged();
    } catch (error: any) {
      console.error('Error merging categories:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to merge categories',
        variant: 'destructive'
      });
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold">"{group.normalized_name}"</h4>
          <p className="text-sm text-muted-foreground">
            {group.brand_count} brands • {group.part_count} parts
          </p>
        </div>
        <Badge variant="destructive">{group.ids.length} duplicates</Badge>
      </div>

      <RadioGroup value={primaryId} onValueChange={setPrimaryId} className="space-y-2 mb-3">
        {group.ids.map((id, idx) => (
          <div key={id} className="flex items-center space-x-2">
            <RadioGroupItem value={id} id={`cat-${id}`} />
            <Label htmlFor={`cat-${id}`} className="flex-1 cursor-pointer">
              {group.names[idx]}
            </Label>
          </div>
        ))}
      </RadioGroup>

      <Button onClick={handleMerge} disabled={merging} size="sm">
        {merging ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Merging...
          </>
        ) : (
          'Merge Duplicates'
        )}
      </Button>
    </div>
  );
}

function BrandDuplicateGroup({ group, onMerged }: { group: DuplicateGroup; onMerged: () => void }) {
  const { toast } = useToast();
  const [primaryId, setPrimaryId] = useState(group.ids[0]);
  const [merging, setMerging] = useState(false);

  const handleMerge = async () => {
    const duplicateIds = group.ids.filter(id => id !== primaryId);
    
    if (duplicateIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select duplicates to merge',
        variant: 'destructive'
      });
      return;
    }

    const categoryInfo = group.category_name ? ` in "${group.category_name}"` : '';
    if (!confirm(`Merge ${duplicateIds.length} duplicate(s) into the primary brand${categoryInfo}? This will affect ${group.model_count} models.`)) {
      return;
    }

    setMerging(true);
    try {
      const { data, error } = await supabase
        .rpc('merge_brands', {
          primary_id: primaryId,
          duplicate_ids: duplicateIds
        });

      if (error) throw error;

      const result = data as any;
      toast({
        title: 'Success',
        description: `Merged ${result.merged_count} duplicate(s). Updated ${result.affected_models} models and ${result.affected_jobs} jobs.`
      });

      onMerged();
    } catch (error: any) {
      console.error('Error merging brands:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to merge brands',
        variant: 'destructive'
      });
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold">"{group.normalized_name}"</h4>
          <p className="text-sm text-muted-foreground">
            {group.category_name && <span className="font-medium">{group.category_name} • </span>}
            {group.model_count} models
          </p>
        </div>
        <Badge variant="destructive">{group.ids.length} duplicates</Badge>
      </div>

      <RadioGroup value={primaryId} onValueChange={setPrimaryId} className="space-y-2 mb-3">
        {group.ids.map((id, idx) => (
          <div key={id} className="flex items-center space-x-2">
            <RadioGroupItem value={id} id={`brand-${id}`} />
            <Label htmlFor={`brand-${id}`} className="flex-1 cursor-pointer">
              {group.names[idx]}
            </Label>
          </div>
        ))}
      </RadioGroup>

      <Button onClick={handleMerge} disabled={merging} size="sm">
        {merging ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Merging...
          </>
        ) : (
          'Merge Duplicates'
        )}
      </Button>
    </div>
  );
}
