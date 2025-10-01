import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputCurrency } from '@/components/ui/input-currency';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Download, Upload, Save, Settings } from 'lucide-react';
import { nanoid } from 'nanoid';
import { MachineCategory, JobPart } from '@/types/job';
import { MACHINE_CATEGORIES } from '@/data/machineCategories';
import { DEFAULT_PARTS } from '@/data/defaultParts';
import { A4_PARTS, PART_CATEGORIES } from '@/data/a4Parts';
import { jobBookingDB } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { PartsManager } from './PartsManager';
import { EnhancedPartsCatalogue } from './parts/EnhancedPartsCatalogue';

interface AdminSettingsProps {
  onClose: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ onClose }) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<MachineCategory[]>(MACHINE_CATEGORIES);
  const [parts, setParts] = useState<JobPart[]>([]);
  const [quickDescriptions, setQuickDescriptions] = useState<string[]>([]);
  const [newDescription, setNewDescription] = useState('');
  const [printSettings, setPrintSettings] = useState({
    autoPrintLabel: false,
    defaultLabelTemplate: 'thermal-large' as 'thermal-large' | 'thermal-small' | 'a4',
    defaultLabelQuantity: 1,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      await jobBookingDB.init();
      
      // Load custom categories and parts
      const customCategories = await jobBookingDB.getCustomCategories();
      const customParts = await jobBookingDB.getCustomParts();
      const descriptions = await jobBookingDB.getQuickDescriptions();
      const printSettingsData = await jobBookingDB.getPrintSettings();
      
      if (customCategories.length > 0) {
        setCategories(customCategories);
      }
      
      setQuickDescriptions(descriptions);
      setPrintSettings(printSettingsData);
      
      // Convert DEFAULT_PARTS and A4_PARTS to JobPart format
      const allParts = [...DEFAULT_PARTS, ...A4_PARTS];
      const formattedParts = allParts.map(part => ({
        id: nanoid(), // Use proper unique ID
        partId: part.id,
        partName: part.name,
        quantity: 1,
        unitPrice: part.sellPrice,
        totalPrice: part.sellPrice,
        category: part.category
      }));
      
      setParts([...formattedParts, ...customParts]);
      
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
  };

  const saveCategories = async () => {
    try {
      await jobBookingDB.saveCustomCategories(categories);
      toast({
        title: "Success",
        description: "Categories saved successfully"
      });
    } catch (error) {
      console.error('Error saving categories:', error);
      toast({
        title: "Error",
        description: "Failed to save categories",
        variant: "destructive"
      });
    }
  };

  const saveParts = async () => {
    try {
      const allDefaultParts = [...DEFAULT_PARTS, ...A4_PARTS];
      const customParts = parts.filter(part => !allDefaultParts.find(dp => dp.id === part.partId));
      await jobBookingDB.saveCustomParts(customParts);
      toast({
        title: "Success",
        description: "Parts saved successfully"
      });
    } catch (error) {
      console.error('Error saving parts:', error);
      toast({
        title: "Error",
        description: "Failed to save parts",
        variant: "destructive"
      });
    }
  };

  const addCategory = () => {
    const newCategory: MachineCategory = {
      id: `custom-${Date.now()}`,
      name: '',
      labourRate: 95,
      commonBrands: []
    };
    setCategories([...categories, newCategory]);
  };

  const updateCategory = (index: number, updates: Partial<MachineCategory>) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = { ...updatedCategories[index], ...updates };
    setCategories(updatedCategories);
  };

  const removeCategory = (index: number) => {
    const updatedCategories = categories.filter((_, i) => i !== index);
    setCategories(updatedCategories);
  };

  const addPart = () => {
    const newPart: JobPart = {
      id: nanoid(), // Use proper unique ID
      partId: `custom-${Date.now()}`,
      partName: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: 'General'
    };
    setParts([...parts, newPart]);
  };

  const updatePart = (index: number, updates: Partial<JobPart>) => {
    const updatedParts = [...parts];
    updatedParts[index] = { ...updatedParts[index], ...updates };
    if (updates.unitPrice !== undefined) {
      updatedParts[index].totalPrice = updatedParts[index].unitPrice * updatedParts[index].quantity;
    }
    setParts(updatedParts);
  };

  const removePart = (index: number) => {
    const updatedParts = parts.filter((_, i) => i !== index);
    setParts(updatedParts);
  };

  const saveQuickDescriptions = async () => {
    try {
      await jobBookingDB.saveQuickDescriptions(quickDescriptions);
      toast({
        title: "Success",
        description: "Quick descriptions saved successfully"
      });
    } catch (error) {
      console.error('Error saving quick descriptions:', error);
      toast({
        title: "Error",
        description: "Failed to save quick descriptions",
        variant: "destructive"
      });
    }
  };

  const addQuickDescription = () => {
    if (newDescription.trim()) {
      setQuickDescriptions([...quickDescriptions, newDescription.trim()]);
      setNewDescription('');
    }
  };

  const removeQuickDescription = (index: number) => {
    const updated = quickDescriptions.filter((_, i) => i !== index);
    setQuickDescriptions(updated);
  };

  const updateQuickDescription = (index: number, value: string) => {
    const updated = [...quickDescriptions];
    updated[index] = value;
    setQuickDescriptions(updated);
  };

  const savePrintSettings = async () => {
    try {
      await jobBookingDB.savePrintSettings(printSettings);
      toast({
        title: "Success",
        description: "Print settings saved successfully"
      });
    } catch (error) {
      console.error('Error saving print settings:', error);
      toast({
        title: "Error",
        description: "Failed to save print settings",
        variant: "destructive"
      });
    }
  };

  const exportData = async () => {
    try {
      await jobBookingDB.init();
      const jobs = await jobBookingDB.getAllJobs();
      const customers = await jobBookingDB.getAllCustomers();
      
      const exportData = {
        jobs,
        customers,
        categories,
        parts,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hampton-mowerpower-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Data exported successfully"
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const exportCSV = async () => {
    try {
      await jobBookingDB.init();
      const jobs = await jobBookingDB.getAllJobs();
      
      const csvHeaders = [
        'Job Number', 'Customer Name', 'Phone', 'Address', 'Machine Category', 
        'Machine Brand', 'Machine Model', 'Problem Description', 'Status', 
        'Parts Total', 'Labour Hours', 'Labour Rate', 'Grand Total', 'Created Date'
      ];
      
      const csvRows = jobs.map(job => [
        job.jobNumber,
        job.customer.name,
        job.customer.phone,
        job.customer.address || '',
        job.machineCategory,
        job.machineBrand,
        job.machineModel,
        job.problemDescription.replace(/,/g, ';'), // Replace commas to avoid CSV issues
        job.status,
        job.partsSubtotal,
        job.labourHours,
        job.labourRate,
        job.grandTotal,
        new Date(job.createdAt).toLocaleDateString('en-AU')
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hampton-mowerpower-jobs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Jobs exported to CSV successfully"
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: "Error",
        description: "Failed to export CSV",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={onClose} className="mb-4">
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-primary mb-2 flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Admin Settings
          </h1>
          <p className="text-muted-foreground">
            Manage categories, parts, rates, and system settings
          </p>
        </div>

        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="categories">Categories & Rates</TabsTrigger>
            <TabsTrigger value="parts">Parts Management</TabsTrigger>
            <TabsTrigger value="descriptions">Quick Descriptions</TabsTrigger>
            <TabsTrigger value="print">Print Settings</TabsTrigger>
            <TabsTrigger value="export">Data Export</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Machine Categories & Labour Rates
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={addCategory}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Category
                    </Button>
                    <Button variant="default" size="sm" onClick={saveCategories}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category, index) => (
                    <div key={category.id} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                      <div className="col-span-3">
                        <Label>Category Name</Label>
                        <Input
                          value={category.name}
                          onChange={(e) => updateCategory(index, { name: e.target.value })}
                          placeholder="Enter category name"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Labour Rate</Label>
                        <InputCurrency
                          value={category.labourRate}
                          onChange={(value) => updateCategory(index, { labourRate: value })}
                        />
                      </div>
                      <div className="col-span-5">
                        <Label>Common Brands (comma separated)</Label>
                        <Input
                          value={category.commonBrands.join(', ')}
                          onChange={(e) => updateCategory(index, { 
                            commonBrands: e.target.value.split(',').map(b => b.trim()).filter(b => b)
                          })}
                          placeholder="Honda, Victa, Husqvarna"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCategory(index)}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parts">
            <EnhancedPartsCatalogue />
          </TabsContent>

          <TabsContent value="descriptions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Quick Problem Descriptions
                  <Button variant="default" size="sm" onClick={saveQuickDescriptions}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addQuickDescription()}
                    placeholder="Enter new quick description"
                  />
                  <Button onClick={addQuickDescription}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  {quickDescriptions.map((desc, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={desc}
                        onChange={(e) => updateQuickDescription(index, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeQuickDescription(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="print">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Print & Label Settings
                  <Button variant="default" size="sm" onClick={savePrintSettings}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-semibold">Auto-Print Service Label</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically prompt to print service label when creating new jobs
                      </p>
                    </div>
                    <Select
                      value={printSettings.autoPrintLabel ? 'on' : 'off'}
                      onValueChange={(val) => setPrintSettings({ ...printSettings, autoPrintLabel: val === 'on' })}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on">On</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Default Label Template</Label>
                      <Select
                        value={printSettings.defaultLabelTemplate}
                        onValueChange={(val: any) => setPrintSettings({ ...printSettings, defaultLabelTemplate: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="thermal-large">Thermal (62×100mm)</SelectItem>
                          <SelectItem value="thermal-small">Thermal (58×40mm)</SelectItem>
                          <SelectItem value="a4">A4 Sticker Sheet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Default Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={printSettings.defaultLabelQuantity}
                        onChange={(e) => setPrintSettings({ 
                          ...printSettings, 
                          defaultLabelQuantity: parseInt(e.target.value) || 1 
                        })}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Label Print Preview</h4>
                    <p className="text-sm text-muted-foreground">
                      Service labels include: Work Order #, Customer name/phone, Equipment details, 
                      Serial, Drop-off date, QR code for job lookup.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>Data Export & Backup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button onClick={exportData} className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export All Data (JSON)
                  </Button>
                  <Button onClick={exportCSV} variant="outline" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Export Jobs (CSV)
                  </Button>
                </div>
                <Separator />
                <div className="text-sm text-muted-foreground">
                  <p><strong>JSON Export:</strong> Complete backup including jobs, customers, settings, and configurations.</p>
                  <p><strong>CSV Export:</strong> Job data only, suitable for spreadsheet applications.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};