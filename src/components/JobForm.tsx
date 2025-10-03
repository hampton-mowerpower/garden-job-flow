import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputCurrency } from '@/components/ui/input-currency';
import { InputTranslated } from '@/components/ui/input-translated';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TextareaTranslated } from '@/components/ui/textarea-translated';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, Printer } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Job, Customer, JobPart, ChecklistItem } from '@/types/job';
import { HAMPTON_MACHINE_CATEGORIES } from '@/data/hamptonMachineData';
import { DEFAULT_PARTS } from '@/data/defaultParts';
import { A4_PARTS, PART_CATEGORIES } from '@/data/a4Parts';
import { calculateJobTotals, formatCurrency, calculatePartTotal } from '@/lib/calculations';
import { jobBookingDB } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { JobPrintLabel } from './JobPrintLabel';
import { JobPrintInvoice } from './JobPrintInvoice';
import { ServiceLabelPrintDialog } from './ServiceLabelPrintDialog';
import { printServiceLabel } from './ServiceLabelPrint';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';
import { useLanguage } from '@/contexts/LanguageContext';
import { Checkbox } from '@/components/ui/checkbox';

import { ThermalPrintButton } from './ThermalPrintButton';
import { MachineManager } from './MachineManager';
import { initializeChecklists, getUniversalChecklist, getCategoryChecklist } from '@/data/serviceChecklist';
import { format } from 'date-fns';

interface JobFormProps {
  job?: Job;
  onSave: (job: Job) => void;
  onPrint?: (job: Job) => void;
}

export default function JobForm({ job, onSave, onPrint }: JobFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showServiceLabelDialog, setShowServiceLabelDialog] = useState(false);
  const [savedJob, setSavedJob] = useState<Job | null>(null);
  
  // Form state
  const [jobNumber, setJobNumber] = useState('');
  const [customer, setCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    address: '',
    email: '',
    notes: ''
  });
  
  const [machineCategory, setMachineCategory] = useState('');
  const [machineBrand, setMachineBrand] = useState('');
  const [machineModel, setMachineModel] = useState('');
  const [machineSerial, setMachineSerial] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [servicePerformed, setServicePerformed] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [serviceDeposit, setServiceDeposit] = useState(0);
  const [quotationAmount, setQuotationAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'PERCENT' | 'AMOUNT'>('PERCENT');
  const [discountValue, setDiscountValue] = useState(0);
  const [depositDate, setDepositDate] = useState('');
  const [depositMethod, setDepositMethod] = useState('');
  
  // Bi-directional sync handlers with validation
  const handleQuotationChange = (value: number) => {
    const sanitizedValue = Math.max(0, value || 0);
    setQuotationAmount(sanitizedValue);
    setServiceDeposit(sanitizedValue);
  };

  const handleServiceDepositChange = (value: number) => {
    const sanitizedValue = Math.max(0, value || 0);
    const maxDeposit = baseCalculations.grandTotal;
    
    if (sanitizedValue > maxDeposit && maxDeposit > 0) {
      toast({
        title: "Validation Error",
        description: `Service deposit cannot exceed the total amount of ${formatCurrency(maxDeposit)}`,
        variant: "destructive"
      });
      const cappedValue = maxDeposit;
      setServiceDeposit(cappedValue);
      setQuotationAmount(cappedValue);
    } else {
      setServiceDeposit(sanitizedValue);
      setQuotationAmount(sanitizedValue);
    }
  };
  
  const [parts, setParts] = useState<JobPart[]>([]);
  const [labourHours, setLabourHours] = useState(0);
  const [status, setStatus] = useState<Job['status']>('pending');
  const [selectedPartCategory, setSelectedPartCategory] = useState<string>('All');
  const [quickDescriptions, setQuickDescriptions] = useState<string[]>([]);
  const [checklistUniversal, setChecklistUniversal] = useState<ChecklistItem[]>([]);
  const [checklistCategory, setChecklistCategory] = useState<ChecklistItem[]>([]);
  const [hasAccount, setHasAccount] = useState(false);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [newJobData, setNewJobData] = useState<Job | null>(null);
  
  // Calculations
  const selectedCategory = HAMPTON_MACHINE_CATEGORIES.find(cat => cat.id === machineCategory);
  const labourRate = selectedCategory?.labourRate || 0;
  const baseCalculations = calculateJobTotals(parts, labourHours, labourRate, discountType, discountValue);
  
  // Apply service deposit deduction to final total
  const calculations = {
    ...baseCalculations,
    finalTotal: Math.max(0, baseCalculations.grandTotal - serviceDeposit),
    serviceDeposit
  };
  
  // Generate Parts Required list reliably
  const partsRequired = parts
    .filter(part => part.partName && part.partName.trim() !== '' && part.quantity > 0)
    .map(part => `${part.partName.trim()} × ${part.quantity || 1}`)
    .join(', ');

  useEffect(() => {
    initializeForm();
  }, [job]);

  useEffect(() => {
    loadQuickDescriptions();
  }, []);

  const loadQuickDescriptions = async () => {
    try {
      await jobBookingDB.init();
      const descriptions = await jobBookingDB.getQuickDescriptions();
      setQuickDescriptions(descriptions);
    } catch (error) {
      console.error('Error loading quick descriptions:', error);
    }
  };

  const initializeForm = async () => {
    if (job) {
      // Edit existing job
      setJobNumber(job.jobNumber);
      setCustomer(job.customer);
      setMachineCategory(job.machineCategory);
      setMachineBrand(job.machineBrand);
      setMachineModel(job.machineModel);
      setMachineSerial(job.machineSerial || '');
      setProblemDescription(job.problemDescription);
      setNotes(job.notes || '');
      setServicePerformed(job.servicePerformed || '');
      setRecommendations(job.recommendations || '');
      setServiceDeposit(job.serviceDeposit || 0);
      setQuotationAmount(job.quotationAmount || 0);
      setDiscountType(job.discountType || 'PERCENT');
      setDiscountValue(job.discountValue || 0);
      setDepositDate(job.depositDate ? format(new Date(job.depositDate), 'yyyy-MM-dd') : '');
      setDepositMethod(job.depositMethod || '');
      
      // Migrate parts to include stable IDs if missing
      const migratedParts = job.parts.map(part => ({
        ...part,
        id: part.id || nanoid() // Add ID if missing for backward compatibility
      }));
      setParts(migratedParts);
      setLabourHours(job.labourHours);
      setStatus(job.status);
      setChecklistUniversal(job.checklistUniversal || []);
      setChecklistCategory(job.checklistCategory || []);
      setHasAccount(job.hasAccount || false);
    } else {
      // New job
      try {
        await jobBookingDB.init();
        const nextJobNumber = await jobBookingDB.getNextJobNumber();
        setJobNumber(nextJobNumber);
        // Initialize universal checklist for new jobs
        setChecklistUniversal(getUniversalChecklist());
      } catch (error) {
        console.error('Error generating job number:', error);
        toast({
          title: "Error",
          description: "Failed to generate job number",
          variant: "destructive"
        });
      }
    }
  };

  const addPart = () => {
    const newPart: JobPart = {
      id: nanoid(), // Add stable row ID
      partId: '',
      partName: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };
    setParts([...parts, newPart]);
  };

  const updatePart = (id: string, updates: Partial<JobPart>) => {
    setParts(prev => prev.map(part => {
      if (part.id === id) {
        const updatedPart = { ...part, ...updates };
        
        // Recalculate total price
        if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
          updatedPart.totalPrice = calculatePartTotal(
            updatedPart.unitPrice,
            updatedPart.quantity
          );
        }
        
        return updatedPart;
      }
      return part;
    }));
  };

  const removePart = (id: string) => {
    setParts(prev => prev.filter(part => part.id !== id));
  };

  const selectPresetPart = (partId: string, rowId: string) => {
    if (partId === 'custom') {
      updatePart(rowId, {
        partId: 'custom',
        partName: '',
        unitPrice: 0
      });
      return;
    }
    
    // Check both DEFAULT_PARTS and A4_PARTS
    const allParts = [...DEFAULT_PARTS, ...A4_PARTS];
    const presetPart = allParts.find(p => p.id === partId);
    
    if (presetPart) {
      const currentPart = parts.find(p => p.id === rowId);
      const quantity = currentPart?.quantity || 1;
      const unitPrice = presetPart.sellPrice || presetPart.basePrice || 0;
      
      updatePart(rowId, {
        partId: presetPart.id,
        partName: presetPart.name,
        unitPrice: unitPrice,
        category: presetPart.category,
        totalPrice: calculatePartTotal(unitPrice, quantity)
      });
    }
  };

  // Get filtered parts based on selected category - preserve current selection
  const getFilteredPartsForRow = (currentPartId?: string) => {
    const allParts = [...DEFAULT_PARTS, ...A4_PARTS];
    
    // Get currently selected part IDs from all rows (excluding empty and custom)
    const selectedPartIds = new Set(
      parts
        .map(p => p.partId)
        .filter(id => id && id !== 'custom' && id.trim() !== '')
    );
    
    // Filter by category, but ALWAYS include the current part even if it's in a different category
    let filteredParts = allParts;
    if (selectedPartCategory !== 'All') {
      filteredParts = allParts.filter(part => 
        part.category === selectedPartCategory || part.id === currentPartId
      );
    }
    
    // Keep currently selected part in dropdown and filter out other selected parts
    const availableParts = filteredParts.filter(part => 
      !selectedPartIds.has(part.id) || part.id === currentPartId
    );
    
    return availableParts;
  };

  // Checklist handlers
  const updateChecklistUniversal = (id: string, updates: Partial<ChecklistItem>) => {
    setChecklistUniversal(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const updateChecklistCategory = (id: string, updates: Partial<ChecklistItem>) => {
    setChecklistCategory(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const addCustomChecklistItem = (type: 'universal' | 'category') => {
    const newItem: ChecklistItem = {
      id: nanoid(),
      label: '',
      checked: false,
      note: '',
      isCustom: true,
    };
    if (type === 'universal') {
      setChecklistUniversal(prev => [...prev, newItem]);
    } else {
      setChecklistCategory(prev => [...prev, newItem]);
    }
  };

  const removeCustomChecklistItem = (id: string, type: 'universal' | 'category') => {
    if (type === 'universal') {
      setChecklistUniversal(prev => prev.filter(item => item.id !== id));
    } else {
      setChecklistCategory(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleServiceLabelPrint = async (quantity: number, template: 'thermal-large' | 'thermal-small' | 'a4') => {
    if (savedJob) {
      await printServiceLabel({ job: savedJob, quantity, template });
      toast({
        title: "Service Label Printed",
        description: `Printed ${quantity} label(s) using ${template} template`,
      });
      // Now call onSave after printing
      onSave(savedJob);
      // Reset state
      setSavedJob(null);
      setShowServiceLabelDialog(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!customer.name || !customer.phone || !machineCategory || !problemDescription) {
      toast({
        title: t('msg.validation'),
        description: t('msg.validation.required'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Create or update customer
      const customerId = job?.customerId || `cust-${Date.now()}`;
      const customerData: Customer = {
        id: customerId,
        name: customer.name!,
        phone: customer.phone!,
        address: customer.address || '',
        email: customer.email,
        notes: customer.notes,
        createdAt: job?.customer.createdAt || new Date(),
        updatedAt: new Date()
      };
      
      await jobBookingDB.saveCustomer(customerData);
      
      // Create job
      const jobData: Job = {
        id: job?.id || `job-${Date.now()}`,
        jobNumber,
        customerId,
        customer: customerData,
        machineCategory,
        machineBrand,
        machineModel,
        machineSerial,
        problemDescription,
        notes,
        servicePerformed,
        recommendations,
        serviceDeposit,
        quotationAmount,
        partsRequired, // Store computed parts list
        parts,
        labourHours,
        labourRate,
        ...calculations,
        status,
        checklistUniversal,
        checklistCategory,
        equipmentCategory: machineCategory,
        equipmentModel: machineModel,
        hasAccount,
        createdAt: job?.createdAt || new Date(),
        updatedAt: new Date(),
        completedAt: status === 'completed' ? new Date() : job?.completedAt
      };
      
      await jobBookingDB.saveJob(jobData);
      
      toast({
        title: t('msg.success'),
        description: job ? t('msg.job.updated') : t('msg.job.created')
      });
      
      // For new jobs, check auto-print settings
      if (!job) {
        const printSettings = await jobBookingDB.getPrintSettings();
        if (printSettings.autoPrintLabel) {
          setSavedJob(jobData);
          setShowServiceLabelDialog(true);
          return; // Don't call onSave yet - wait for dialog
        }
      }
      
      onSave(jobData);
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: t('msg.error'),
        description: t('msg.job.failed'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            {job ? `${t('jobs.edit')} ${jobNumber}` : t('jobs.new')}
          </h2>
          <p className="text-muted-foreground">
            {job ? t('jobs.update.details') : t('jobs.create.service')}
          </p>
        </div>
      <div className="flex flex-wrap gap-2">
        {job && (
          <>
            <JobPrintLabel job={job} />
            <JobPrintInvoice job={job} />
            <ThermalPrintButton job={job} type="service-label" size="sm" />
            <ThermalPrintButton job={job} type="collection-receipt" size="sm" />
          </>
        )}
        <Button onClick={handleSave} disabled={isLoading} className="flex-1 sm:flex-initial">
          <Save className="w-4 h-4 mr-2" />
          {isLoading ? t('jobs.saving') : t('jobs.save')}
        </Button>
      </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Job Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle>{t('customer.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-name">{t('customer.name')} *</Label>
                  <InputTranslated
                    id="customer-name"
                    value={customer.name}
                    onChange={(value) => setCustomer({...customer, name: value})}
                    placeholder={t('placeholder.customer.name')}
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone">{t('customer.phone')} *</Label>
                  <Input
                    id="customer-phone"
                    value={customer.phone}
                    onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                    placeholder={t('placeholder.customer.phone')}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customer-address">{t('customer.address')}</Label>
                <GooglePlacesAutocomplete
                  value={customer.address || ''}
                  onChange={(value) => setCustomer({...customer, address: value})}
                  placeholder={t('placeholder.customer.address')}
                />
              </div>
              <div>
                <Label htmlFor="customer-email">{t('customer.email')}</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({...customer, email: e.target.value})}
                  placeholder={t('placeholder.customer.email')}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="has-account"
                  checked={hasAccount}
                  onCheckedChange={(checked) => setHasAccount(checked as boolean)}
                />
                <Label htmlFor="has-account" className="cursor-pointer">
                  Account Customer (30-day payment terms)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Machine Information */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle>{t('machine.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <MachineManager
              machineCategory={machineCategory}
              machineBrand={machineBrand}
              machineModel={machineModel}
              onCategoryChange={(cat) => {
                setMachineCategory(cat);
                // Initialize category checklist when category is selected
                if (cat) {
                  setChecklistCategory(getCategoryChecklist(cat));
                }
              }}
              onBrandChange={setMachineBrand}
              onModelChange={setMachineModel}
            />
              <div>
                <Label htmlFor="machine-serial">{t('machine.serial')}</Label>
                <Input
                  id="machine-serial"
                  value={machineSerial}
                  onChange={(e) => setMachineSerial(e.target.value)}
                  placeholder={t('placeholder.machine.serial')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Problem Description */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle>{t('problem.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="problem-description">{t('problem.description')} *</Label>
                <TextareaTranslated
                  id="problem-description"
                  value={problemDescription}
                  onChange={(value) => setProblemDescription(value)}
                  placeholder={t('placeholder.problem')}
                  rows={3}
                />
              </div>
              
              <div>
                <Label>{t('problem.quick')}</Label>
                <p className="text-sm text-muted-foreground mb-3">{t('problem.quick.help')}</p>
                <div className="flex flex-wrap gap-2">
                  {quickDescriptions.map((quickDesc) => (
                    <Button
                      key={quickDesc}
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => {
                        const currentDesc = problemDescription.trim();
                        const newDesc = currentDesc 
                          ? `${currentDesc}${currentDesc.endsWith('.') || currentDesc.endsWith(',') ? ' ' : ', '}${quickDesc}`
                          : quickDesc;
                        setProblemDescription(newDesc);
                      }}
                      className="text-xs"
                    >
                      {quickDesc}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="notes">{t('problem.additional')}</Label>
                <TextareaTranslated
                  id="notes"
                  value={notes}
                  onChange={(value) => setNotes(value)}
                  placeholder={t('placeholder.notes')}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quotation Box */}
          <Card className="form-section border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="text-orange-700">{t('quotation.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quotation-amount">{t('quotation.amount')}</Label>
                <InputCurrency
                  value={quotationAmount}
                  onChange={handleQuotationChange}
                  placeholder={t('placeholder.quotation')}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Syncs with service deposit below
                </p>
              </div>
              <div className="bg-orange-100 border border-orange-200 rounded-lg p-3">
                <p className="text-sm font-medium text-orange-800 mb-1">
                  {t('quotation.notice')}
                </p>
                <p className="text-xs text-orange-700">
                  {t('quotation.notice.text')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Checklist */}
          {(checklistUniversal.length > 0 || checklistCategory.length > 0) && (
            <Card className="form-section">
              <CardHeader>
                <CardTitle>Service Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Universal Checks */}
                {checklistUniversal.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Universal Checks</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCustomChecklistItem('universal')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {checklistUniversal.map((item) => (
                        <div key={item.id} className="space-y-1">
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={item.checked}
                              onCheckedChange={(checked) => {
                                updateChecklistUniversal(item.id, { checked: checked as boolean });
                              }}
                            />
                            <div className="flex-1 flex gap-2">
                              <Input
                                value={item.label}
                                onChange={(e) => updateChecklistUniversal(item.id, { label: e.target.value })}
                                placeholder="Check item..."
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeCustomChecklistItem(item.id, 'universal')}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {item.checked && (
                            <div className="ml-6">
                              <Input
                                value={item.note || ''}
                                onChange={(e) => updateChecklistUniversal(item.id, { note: e.target.value })}
                                placeholder="Optional note..."
                                className="text-xs"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category-Specific Checks */}
                {machineCategory && checklistCategory.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Category: {machineCategory}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addCustomChecklistItem('category')}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Item
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {checklistCategory.map((item) => (
                        <div key={item.id} className="space-y-1">
                          <div className="flex items-start gap-2">
                            <Checkbox
                              checked={item.checked}
                              onCheckedChange={(checked) => {
                                updateChecklistCategory(item.id, { checked: checked as boolean });
                              }}
                            />
                            <div className="flex-1 flex gap-2">
                              <Input
                                value={item.label}
                                onChange={(e) => updateChecklistCategory(item.id, { label: e.target.value })}
                                placeholder="Check item..."
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeCustomChecklistItem(item.id, 'category')}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          {item.checked && (
                            <div className="ml-6">
                              <Input
                                value={item.note || ''}
                                onChange={(e) => updateChecklistCategory(item.id, { note: e.target.value })}
                                placeholder="Optional note..."
                                className="text-xs"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Service Notes */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle>{t('service.notes')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="service-performed">{t('service.performed')}</Label>
                <TextareaTranslated
                  id="service-performed"
                  value={servicePerformed}
                  onChange={(value) => setServicePerformed(value)}
                  placeholder={t('placeholder.service.performed')}
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="recommendations">{t('service.recommendations')}</Label>
                <TextareaTranslated
                  id="recommendations"
                  value={recommendations}
                  onChange={(value) => setRecommendations(value)}
                  placeholder={t('placeholder.recommendations')}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Parts List */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('parts.title')}</span>
                <Select value={selectedPartCategory} onValueChange={setSelectedPartCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('parts.filter')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Parts</SelectItem>
                    {PART_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parts.map((part) => (
                  <div key={part.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label className="text-xs">{t('parts.name')}</Label>
                      <Select
                        value={part.partId || 'custom'}
                        onValueChange={(value) => selectPresetPart(value, part.id)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('placeholder.parts.select')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="custom">{t('parts.custom')}</SelectItem>
                          {getFilteredPartsForRow(part.partId).map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name} ({formatCurrency(p.sellPrice)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {part.partId === 'custom' && (
                      <div className="col-span-3">
                        <Label className="text-xs">{t('parts.custom.name')}</Label>
                        <Input
                          value={part.partName}
                          onChange={(e) => updatePart(part.id, { partName: e.target.value })}
                          placeholder={t('placeholder.parts.name')}
                        />
                      </div>
                    )}
                    
                    <div className={part.partId === 'custom' ? 'col-span-1' : 'col-span-2'}>
                      <Label className="text-xs">{t('parts.qty')}</Label>
                      <Input
                        type="number"
                        min="1"
                        value={part.quantity}
                        onChange={(e) => updatePart(part.id, { quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label className="text-xs">{t('parts.price')}</Label>
                      <InputCurrency
                        value={part.unitPrice}
                        onChange={(value) => updatePart(part.id, { unitPrice: value })}
                      />
                    </div>
                    
                    <div className="col-span-1 flex items-end justify-end pb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removePart(part.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button type="button" variant="outline" onClick={addPart} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('parts.add')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Labour */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle>{t('labour.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>{t('labour.hours')}</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.25"
                  value={labourHours}
                  onChange={(e) => setLabourHours(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {t('labour.rate')}: {formatCurrency(labourRate)}/hr
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>{t('summary.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('summary.parts')}</span>
                  <span className="font-medium">{formatCurrency(calculations.partsSubtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t('summary.labour')} ({labourHours} hrs @ {formatCurrency(labourRate)}/hr)
                  </span>
                  <span className="font-medium">{formatCurrency(calculations.labourTotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('summary.subtotal')}</span>
                  <span className="font-medium">{formatCurrency(calculations.subtotal)}</span>
                </div>
                
                {/* Discount Section */}
                <div className="space-y-2 pt-2 pb-2 border-t">
                  <Label className="text-xs">Discount</Label>
                  <div className="flex gap-2">
                    <Select value={discountType} onValueChange={(v: 'PERCENT' | 'AMOUNT') => setDiscountType(v)}>
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENT">%</SelectItem>
                        <SelectItem value="AMOUNT">$</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="0"
                      step={discountType === 'PERCENT' ? '1' : '0.01'}
                      max={discountType === 'PERCENT' ? '100' : undefined}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="flex-1"
                    />
                  </div>
                  {calculations.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount Applied:</span>
                      <span>-{formatCurrency(calculations.discountAmount)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('summary.gst')}</span>
                  <span className="font-medium">{formatCurrency(calculations.gst)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">{t('summary.total')}</span>
                  <span className="font-bold text-lg">{formatCurrency(calculations.grandTotal)}</span>
                </div>
              </div>

              <Separator />

              {/* Service Deposit */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="service-deposit">{t('service.deposit')}</Label>
                  <InputCurrency
                    id="service-deposit"
                    value={serviceDeposit}
                    onChange={handleServiceDepositChange}
                    placeholder="0.00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('service.deposit.help')}
                  </p>
                </div>
                
                {serviceDeposit > 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="deposit-date" className="text-xs">Date Received</Label>
                        <Input
                          id="deposit-date"
                          type="date"
                          value={depositDate}
                          onChange={(e) => setDepositDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="deposit-method" className="text-xs">Payment Method</Label>
                        <Select value={depositMethod} onValueChange={setDepositMethod}>
                          <SelectTrigger id="deposit-method">
                            <SelectValue placeholder="Select..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                            <SelectItem value="eftpos">EFTPOS</SelectItem>
                            <SelectItem value="transfer">Bank Transfer</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {serviceDeposit > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-semibold">{t('summary.balance')}</span>
                    <span className="font-bold text-lg text-primary">
                      {formatCurrency(calculations.finalTotal)}
                    </span>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <Label>{t('status.title')}</Label>
                <Select value={status} onValueChange={(value: Job['status']) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('status.pending')}</SelectItem>
                    <SelectItem value="in-progress">{t('status.inprogress')}</SelectItem>
                    <SelectItem value="completed">{t('status.completed')}</SelectItem>
                    <SelectItem value="delivered">{t('status.delivered')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Service Label Print Dialog */}
      {savedJob && (
        <ServiceLabelPrintDialog
          job={savedJob}
          open={showServiceLabelDialog}
          onOpenChange={(open) => {
            setShowServiceLabelDialog(open);
            if (!open && savedJob) {
              // User closed dialog without printing
              onSave(savedJob);
              setSavedJob(null);
            }
          }}
          onPrint={handleServiceLabelPrint}
        />
      )}
    </div>
  );
}
