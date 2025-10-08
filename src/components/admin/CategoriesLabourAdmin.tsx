import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Folder, Check, GripVertical, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Category {
  id: string;
  name: string;
  rate_default: number;
  display_order: number;
  active: boolean;
}

interface Brand {
  id: string;
  name: string;
  category_id: string | null;
  active: boolean;
}

interface Model {
  id: string;
  name: string;
  brand_id: string;
  active: boolean;
}

export const CategoriesLabourAdmin: React.FC = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editedRate, setEditedRate] = useState<number>(0);
  const [newBrandName, setNewBrandName] = useState('');
  const [newModelName, setNewModelName] = useState('');

  // Load categories
  useEffect(() => {
    loadCategories();
    
    // Subscribe to all changes
    const categoriesChannel = supabase
      .channel('categories-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        loadCategories();
      })
      .subscribe();

    const brandsChannel = supabase
      .channel('brands-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brands' }, () => {
        if (selectedCategory) {
          loadBrands(selectedCategory.id);
        }
      })
      .subscribe();

    const modelsChannel = supabase
      .channel('models-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'machinery_models' }, () => {
        if (selectedBrand) {
          loadModels(selectedBrand.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(categoriesChannel);
      supabase.removeChannel(brandsChannel);
      supabase.removeChannel(modelsChannel);
    };
  }, [selectedCategory, selectedBrand]);

  // Load brands when category changes
  useEffect(() => {
    if (selectedCategory) {
      loadBrands(selectedCategory.id);
      setSelectedBrand(null);
      setModels([]);
    }
  }, [selectedCategory]);

  // Load models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      loadModels(selectedBrand.id);
    }
  }, [selectedBrand]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('active', true)
        .order('display_order');

      if (error) throw error;

      setCategories(data || []);
      
      if (!selectedCategory && data && data.length > 0) {
        setSelectedCategory(data[0]);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBrands = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('category_id', categoryId)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      setBrands(data || []);
    } catch (error) {
      console.error('Error loading brands:', error);
      toast({
        title: 'Error',
        description: 'Failed to load brands',
        variant: 'destructive'
      });
    }
  };

  const loadModels = async (brandId: string) => {
    try {
      const { data, error } = await supabase
        .from('machinery_models')
        .select('*')
        .eq('brand_id', brandId)
        .eq('active', true)
        .order('name');

      if (error) throw error;

      setModels(data || []);
    } catch (error) {
      console.error('Error loading models:', error);
      toast({
        title: 'Error',
        description: 'Failed to load models',
        variant: 'destructive'
      });
    }
  };

  const handleAddCategory = async () => {
    try {
      const maxOrder = Math.max(...categories.map(c => c.display_order), 0);
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: 'New Category',
          rate_default: 95,
          display_order: maxOrder + 1,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      setCategories(prev => [...prev, data]);
      setSelectedCategory(data);
      setEditingCategoryId(data.id);
      setEditedRate(data.rate_default);

      toast({
        title: 'Success',
        description: 'New category added'
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'Error',
        description: 'Failed to add category',
        variant: 'destructive'
      });
    }
  };

  const handleSaveRate = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ rate_default: editedRate })
        .eq('id', categoryId);

      if (error) throw error;

      setCategories(prev => prev.map(c => 
        c.id === categoryId ? { ...c, rate_default: editedRate } : c
      ));
      setEditingCategoryId(null);

      toast({
        title: 'Saved ✓',
        description: 'Labour rate updated'
      });
    } catch (error) {
      console.error('Error saving rate:', error);
      toast({
        title: 'Error',
        description: 'Failed to save rate',
        variant: 'destructive'
      });
    }
  };

  const handleAddBrand = async () => {
    if (!selectedCategory || !newBrandName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('brands')
        .insert({
          name: newBrandName.trim(),
          category_id: selectedCategory.id,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      setBrands(prev => [...prev, data]);
      setNewBrandName('');

      toast({
        title: 'Success',
        description: 'Brand added'
      });
    } catch (error) {
      console.error('Error adding brand:', error);
      toast({
        title: 'Error',
        description: 'Failed to add brand',
        variant: 'destructive'
      });
    }
  };

  const handleAddModel = async () => {
    if (!selectedBrand || !newModelName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('machinery_models')
        .insert({
          name: newModelName.trim(),
          brand_id: selectedBrand.id,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      setModels(prev => [...prev, data]);
      setNewModelName('');

      toast({
        title: 'Success',
        description: 'Model added'
      });
    } catch (error) {
      console.error('Error adding model:', error);
      toast({
        title: 'Error',
        description: 'Failed to add model',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm('Delete this brand? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('brands')
        .update({ active: false })
        .eq('id', brandId);

      if (error) throw error;

      setBrands(prev => prev.filter(b => b.id !== brandId));
      if (selectedBrand?.id === brandId) {
        setSelectedBrand(null);
        setModels([]);
      }

      toast({
        title: 'Success',
        description: 'Brand deleted'
      });
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete brand',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm('Delete this model? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('machinery_models')
        .update({ active: false })
        .eq('id', modelId);

      if (error) throw error;

      setModels(prev => prev.filter(m => m.id !== modelId));

      toast({
        title: 'Success',
        description: 'Model deleted'
      });
    } catch (error) {
      console.error('Error deleting model:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete model',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
      {/* Left Panel - Categories */}
      <div className="col-span-3">
        <Card className="h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Categories</CardTitle>
              <Button size="sm" variant="ghost" onClick={handleAddCategory}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[calc(100vh-18rem)]">
              <div className="space-y-1">
                {categories.map(category => {
                  const isEditing = editingCategoryId === category.id;
                  const displayRate = isEditing ? editedRate : category.rate_default;

                  return (
                    <div
                      key={category.id}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer ${
                        selectedCategory?.id === category.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      <Folder className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{category.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {isEditing ? (
                            <>
                              <Input
                                type="number"
                                value={displayRate}
                                onChange={(e) => setEditedRate(parseFloat(e.target.value) || 0)}
                                onClick={(e) => e.stopPropagation()}
                                className="h-6 text-xs w-20"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveRate(category.id);
                                }}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategoryId(category.id);
                                setEditedRate(category.rate_default);
                              }}
                            >
                              ${category.rate_default}/hr
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Brands & Models */}
      <div className="col-span-9">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-xl">
              {selectedCategory?.name} - Brands & Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 h-[calc(100vh-20rem)]">
              {/* Brands Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New brand name"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
                  />
                  <Button size="sm" onClick={handleAddBrand}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Separator />
                <ScrollArea className="h-[calc(100vh-26rem)]">
                  <div className="space-y-1">
                    {brands.map(brand => (
                      <div
                        key={brand.id}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                          selectedBrand?.id === brand.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                        }`}
                        onClick={() => setSelectedBrand(brand)}
                      >
                        <span className="text-sm">{brand.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBrand(brand.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    {brands.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No brands yet. Add one above.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Models Column */}
              <div className="space-y-4">
                {selectedBrand ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="New model name"
                        value={newModelName}
                        onChange={(e) => setNewModelName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddModel()}
                      />
                      <Button size="sm" onClick={handleAddModel}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Separator />
                    <ScrollArea className="h-[calc(100vh-26rem)]">
                      <div className="space-y-1">
                        {models.map(model => (
                          <div
                            key={model.id}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50"
                          >
                            <span className="text-sm">{model.name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteModel(model.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {models.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No models yet. Add one above.
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    ← Select a brand to view models
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
