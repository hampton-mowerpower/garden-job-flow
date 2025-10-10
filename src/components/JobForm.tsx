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
import { Plus, Trash2, Save, Printer, Check, Loader2 } from 'lucide-react';
import { Job, Customer, JobPart, ChecklistItem } from '@/types/job';
import { HAMPTON_MACHINE_CATEGORIES } from '@/data/hamptonMachineData';
import { DEFAULT_PARTS } from '@/data/defaultParts';
import { A4_PARTS, PART_CATEGORIES } from '@/data/a4Parts';
import { calculateJobTotals, formatCurrency, calculatePartTotal } from '@/lib/calculations';
import { jobBookingDB } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { JobPrintInvoice } from './JobPrintInvoice';
import { ServiceLabelPrintDialog } from './ServiceLabelPrintDialog';
import { printServiceLabel } from './ServiceLabelPrint';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';
import { useLanguage } from '@/contexts/LanguageContext';
import { Checkbox } from '@/components/ui/checkbox';
import { toTitleCase } from '@/lib/utils';
import { printThermal } from './ThermalPrint';
import { useCategories } from '@/hooks/useCategories';
import { useCategorySync } from '@/hooks/useCategorySync';
import { supabase } from '@/integrations/supabase/client';

import { ThermalPrintButton } from './ThermalPrintButton';
import { PrintPromptDialog } from './PrintPromptDialog';
import { StaffJobNotes } from './StaffJobNotes';
import { MachineManager } from './MachineManager';
import { initializeChecklists, getUniversalChecklist, getCategoryChecklist } from '@/data/serviceChecklist';
import { format } from 'date-fns';
import { CustomerNotificationDialog } from './CustomerNotificationDialog';
import { EmailNotificationDialog } from './EmailNotificationDialog';
import { Bell, Mail } from 'lucide-react';
import { TransportSection } from './booking/TransportSection';
import { SharpenSection } from './booking/SharpenSection';
import { DraggableQuickProblems } from './booking/DraggableQuickProblems';
import { SharpenItem } from '@/utils/sharpenCalculator';
import { MachineSizeTier } from '@/utils/transportCalculator';
// Phase 2 imports
import { CustomerAutocomplete } from './booking/CustomerAutocomplete';
import { SmallRepairSection } from './booking/SmallRepairSection';
import { MultiToolAttachments } from './booking/MultiToolAttachments';
import { RequestedFinishDatePicker } from './booking/RequestedFinishDatePicker';
import { PartsPicker } from './booking/PartsPicker';
import { syncJobToAccountCustomer } from '@/utils/accountCustomerSync';
import { scheduleServiceReminder, cancelMachineReminders } from '@/utils/reminderScheduler';

// Simple unique ID generator for UI elements (not database records)
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

interface JobFormProps {
  job?: Job;
  onSave: (job: Job) => void;
  onPrint?: (job: Job) => void;
}

export default function JobForm({ job, onSave, onPrint }: JobFormProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { categories, getLabourRate, ensureCategoryExists, updateCategoryRateByName } = useCategories();
  const { reconcileCategories, ensureCategoryExists: syncEnsureCategory } = useCategorySync();
  const [isLoading, setIsLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'printing'>('idle');
  const [showServiceLabelDialog, setShowServiceLabelDialog] = useState(false);
  const [showPrintPromptDialog, setShowPrintPromptDialog] = useState(false);
  const [savedJob, setSavedJob] = useState<Job | null>(null);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  
  // Form state
  const [jobNumber, setJobNumber] = useState('');
  const [customer, setCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    address: '',
    email: '',
    notes: '',
    customerType: 'domestic' // default
  });
  const [customerType, setCustomerType] = useState<'commercial' | 'domestic'>('domestic');
  const [jobCompanyName, setJobCompanyName] = useState('');
  
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
  
  // One-way sync: Quotation → Service Deposit only
  const handleQuotationChange = (value: number) => {
    const sanitizedValue = Math.max(0, value || 0);
    setQuotationAmount(sanitizedValue);
    // Auto-fill service deposit when quotation is set
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
      setServiceDeposit(maxDeposit);
    } else {
      setServiceDeposit(sanitizedValue);
    }
    // No reverse sync to quotation
  };
  
  const [parts, setParts] = useState<JobPart[]>([]);
  const [labourHours, setLabourHours] = useState(0);
  const [labourFee, setLabourFee] = useState(0);
  const [lastEditedField, setLastEditedField] = useState<'hours' | 'fee'>('hours');
  const [status, setStatus] = useState<Job['status']>('pending');
  const [selectedPartCategory, setSelectedPartCategory] = useState<string>('All');
  const [quickDescriptions, setQuickDescriptions] = useState<string[]>([]);
  const [checklistUniversal, setChecklistUniversal] = useState<ChecklistItem[]>([]);
  const [checklistCategory, setChecklistCategory] = useState<ChecklistItem[]>([]);
  const [hasAccount, setHasAccount] = useState(false);
  const [accountCustomerId, setAccountCustomerId] = useState<string | undefined>(undefined);
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [newJobData, setNewJobData] = useState<Job | null>(null);
  
  // Phase 2: New state for requested finish date, attachments, small repair, additional notes
  const [requestedFinishDate, setRequestedFinishDate] = useState<Date | undefined>(undefined);
  const [attachments, setAttachments] = useState<Array<{ name: string; problemDescription: string }>>([]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [smallRepairData, setSmallRepairData] = useState({
    repairDetails: '',
    minutes: 0,
    rateType: 'per_hr' as 'per_min' | 'per_hr',
    rate: 100,
    calculatedTotal: 0,
    overrideTotal: undefined as number | undefined,
    includeInTotals: false
  });
  
  // Transport and Sharpen state
  const [transportData, setTransportData] = useState<{
    pickupRequired: boolean;
    deliveryRequired: boolean;
    sizeTier: MachineSizeTier | null;
    distanceKm: number;
    totalCharge: number;
    breakdown: string;
  }>({
    pickupRequired: false,
    deliveryRequired: false,
    sizeTier: null,
    distanceKm: 5,
    totalCharge: 0,
    breakdown: ''
  });
  
  const [sharpenData, setSharpenData] = useState<{
    items: SharpenItem[];
    totalCharge: number;
    breakdown: string;
  }>({
    items: [],
    totalCharge: 0,
    breakdown: ''
  });
  
  // Calculations - use Supabase categories for labour rate
  const labourRate = getLabourRate(machineCategory) || 95;
  
  // Auto-update labour fee when category (and thus rate) changes
  useEffect(() => {
    if (labourHours > 0 && lastEditedField === 'hours') {
      setLabourFee(Math.round(labourHours * labourRate * 100) / 100);
    } else if (labourFee > 0 && lastEditedField === 'fee' && labourRate > 0) {
      setLabourHours(Math.round((labourFee / labourRate) * 100) / 100);
    }
  }, [machineCategory, labourRate]);

  // Sync labour rate changes back to category
  useEffect(() => {
    const syncLabourRate = async () => {
      if (machineCategory && labourRate > 0 && labourRate !== getLabourRate(machineCategory)) {
        await updateCategoryRateByName(machineCategory, labourRate);
      }
    };
    
    const timer = setTimeout(syncLabourRate, 1000);
    return () => clearTimeout(timer);
  }, [labourRate, machineCategory]);
  
  // Labour Fee <-> Hours sync
  const handleLabourHoursChange = (hours: number) => {
    const sanitized = Math.max(0, Math.min(100, hours || 0));
    setLabourHours(sanitized);
    setLabourFee(Math.round(sanitized * labourRate * 100) / 100);
    setLastEditedField('hours');
  };
  
  const handleLabourFeeChange = (fee: number) => {
    const sanitized = Math.max(0, fee || 0);
    setLabourFee(sanitized);
    if (labourRate > 0) {
      setLabourHours(Math.round((sanitized / labourRate) * 100) / 100);
    }
    setLastEditedField('fee');
  };
  
  // Debug logging for charge calculations
  console.log('Calculation inputs:', {
    partsCount: parts.length,
    labourHours,
    labourRate,
    transportCharge: transportData.totalCharge,
    sharpenCharge: sharpenData.totalCharge,
    smallRepairCharge: smallRepairData.includeInTotals 
      ? (smallRepairData.overrideTotal ?? smallRepairData.calculatedTotal)
      : 0
  });

  // Reconcile categories on mount
  useEffect(() => {
    reconcileCategories();
  }, []);

  // Sync labour rate changes back to category
  useEffect(() => {
    if (!machineCategory || labourRate <= 0) return;
    
    const category = categories.find(c => c.name === machineCategory);
    if (category && category.rate_default !== labourRate) {
      // Debounce the update
      const timer = setTimeout(() => {
        updateCategoryRateByName(machineCategory, labourRate);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [machineCategory, labourRate, categories]);

  // Ensure category exists when changed
  useEffect(() => {
    if (!machineCategory) return;
    
    const category = categories.find(c => c.name === machineCategory);
    if (!category) {
      // Category doesn't exist in database yet, create it
      syncEnsureCategory(machineCategory, labourRate);
    }
  }, [machineCategory]);

  const baseCalculations = calculateJobTotals(
    parts, 
    labourHours, 
    labourRate, 
    discountType, 
    discountValue,
    transportData.totalCharge,
    sharpenData.totalCharge,
    smallRepairData.includeInTotals 
      ? (smallRepairData.overrideTotal ?? smallRepairData.calculatedTotal)
      : 0
  );
  
  console.log('Base calculations result:', baseCalculations);
  
  // Apply service deposit deduction to final total (balance due after deposit)
  const balanceAfterDeposit = Math.max(0, baseCalculations.grandTotal - serviceDeposit);
  
  const calculations = {
    ...baseCalculations,
    finalTotal: balanceAfterDeposit,
    serviceDeposit,
    balanceDue: balanceAfterDeposit
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

  // Auto-save when transport, sharpen, or small repair data changes (for existing jobs only)
  useEffect(() => {
    if (!job?.id) return; // Only auto-save for existing jobs
    
    const timeoutId = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        
        // Create updated job data with new charges
        const jobData: Job = {
          ...job,
          transportPickupRequired: transportData.pickupRequired,
          transportDeliveryRequired: transportData.deliveryRequired,
          transportSizeTier: transportData.sizeTier || undefined,
          transportDistanceKm: transportData.distanceKm,
          transportTotalCharge: transportData.totalCharge,
          transportBreakdown: transportData.breakdown,
          sharpenItems: sharpenData.items,
          sharpenTotalCharge: sharpenData.totalCharge,
          sharpenBreakdown: sharpenData.breakdown,
          smallRepairDetails: smallRepairData.repairDetails,
          smallRepairMinutes: smallRepairData.minutes,
          smallRepairRate: smallRepairData.rate,
          smallRepairTotal: smallRepairData.includeInTotals 
            ? (smallRepairData.overrideTotal ?? smallRepairData.calculatedTotal)
            : 0,
          // Recalculate totals
          ...calculations,
          updatedAt: new Date()
        };
        
        await jobBookingDB.saveJob(jobData);
        setAutoSaveStatus('saved');
        
        // Reset to idle after 2 seconds
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus('idle');
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [transportData, sharpenData, smallRepairData, job?.id]);

  const loadQuickDescriptions = async () => {
    try {
      const descriptions = await jobBookingDB.getQuickDescriptions();
      setQuickDescriptions(descriptions);
    } catch (error) {
      console.error('Error loading quick descriptions:', error);
      // Use defaults if loading fails
      setQuickDescriptions([
        'Full Service Required',
        'Blade Sharpen',
        'Won\'t Start',
        'Runs Rough'
      ]);
    }
  };

  const initializeForm = async () => {
    if (job) {
      // Edit existing job
      setJobNumber(job.jobNumber);
      setCustomer(job.customer);
      setCustomerType(job.customerType || job.customer.customerType || 'domestic');
      setJobCompanyName(job.jobCompanyName || job.customer.companyName || '');
      setMachineCategory(job.machineCategory);
      setMachineBrand(job.machineBrand);
      setMachineModel(job.machineModel);
      setMachineSerial(job.machineSerial || '');
      setProblemDescription(job.problemDescription);
      setNotes(job.notes || '');
      setAdditionalNotes(job.additionalNotes || '');
      setServicePerformed(job.servicePerformed || '');
      setRecommendations(job.recommendations || '');
      setServiceDeposit(job.serviceDeposit || 0);
      setQuotationAmount(job.quotationAmount || 0);
      setDiscountType(job.discountType || 'PERCENT');
      setDiscountValue(job.discountValue || 0);
      
      // Phase 2 fields - ensure dates are properly parsed
      if (job.requestedFinishDate) {
        const parsedDate = typeof job.requestedFinishDate === 'string' 
          ? new Date(job.requestedFinishDate) 
          : job.requestedFinishDate;
        setRequestedFinishDate(parsedDate);
      } else {
        setRequestedFinishDate(undefined);
      }
      setAttachments(job.attachments || []);
      
      // Migrate parts to include stable IDs if missing
      const migratedParts = job.parts.map(part => ({
        ...part,
        id: part.id || generateId() // Add ID if missing for backward compatibility
      }));
      setParts(migratedParts);
      setLabourHours(job.labourHours);
      setLabourFee(job.labourHours * labourRate);
      setStatus(job.status);
      setChecklistUniversal(job.checklistUniversal || []);
      setChecklistCategory(job.checklistCategory || []);
      setHasAccount(!!job.accountCustomerId); // Set checkbox based on whether accountCustomerId exists
      setAccountCustomerId(job.accountCustomerId);
      
      // Load transport data - ALWAYS load to preserve totalCharge
      setTransportData({
        pickupRequired: job.transportPickupRequired || false,
        deliveryRequired: job.transportDeliveryRequired || false,
        sizeTier: (job.transportSizeTier as MachineSizeTier) || null,
        distanceKm: job.transportDistanceKm || 5,
        totalCharge: job.transportTotalCharge || 0,
        breakdown: job.transportBreakdown || ''
      });
      
      // Load sharpen data - ALWAYS load to preserve totalCharge
      setSharpenData({
        items: job.sharpenItems || [],
        totalCharge: job.sharpenTotalCharge || 0,
        breakdown: job.sharpenBreakdown || ''
      });
      
      // Load small repair data
      setSmallRepairData({
        repairDetails: job.smallRepairDetails || '',
        minutes: job.smallRepairMinutes || 0,
        rateType: 'per_hr' as 'per_min' | 'per_hr',
        rate: job.smallRepairRate || 100,
        calculatedTotal: job.smallRepairTotal || 0,
        overrideTotal: job.smallRepairTotal > 0 ? job.smallRepairTotal : undefined,
        includeInTotals: (job.smallRepairTotal || 0) > 0
      });
    } else {
      // New job
      try {
        const nextJobNumber = await jobBookingDB.getNextJobNumber();
        setJobNumber(nextJobNumber);
        // Initialize universal checklist for new jobs
        setChecklistUniversal(getUniversalChecklist());
      } catch (error) {
        console.error('Error generating job number:', error);
        // Fallback job number
        setJobNumber(`JB${new Date().getFullYear()}-0001`);
        toast({
          title: "Error",
          description: "Failed to generate job number",
          variant: "destructive"
        });
      }
    }
  };

  // Auto-link Account Customer when hasAccount is checked and company name exists
  useEffect(() => {
    const linkAccountCustomer = async () => {
      if (!hasAccount || !jobCompanyName.trim()) {
        setAccountCustomerId(undefined);
        return;
      }

      try {
        // Search for existing account customer by name (case-insensitive)
        const { data: existingCustomers, error: searchError } = await supabase
          .from('account_customers')
          .select('*')
          .ilike('name', jobCompanyName.trim())
          .eq('active', true)
          .limit(1);

        if (searchError) throw searchError;

        if (existingCustomers && existingCustomers.length > 0) {
          // Found existing account customer
          const accountCustomer = existingCustomers[0];
          setAccountCustomerId(accountCustomer.id);
          
          // Auto-fill email from account customer if not already set
          if (accountCustomer.emails && accountCustomer.emails.length > 0 && !customer.email) {
            setCustomer(prev => ({
              ...prev,
              email: accountCustomer.emails[0]
            }));
          }
          
          toast({
            title: 'Account Customer Linked',
            description: `Linked to ${accountCustomer.name}`,
          });
        } else {
          // Create new account customer
          const { data: newAccountCustomer, error: createError } = await supabase
            .from('account_customers')
            .insert({
              name: jobCompanyName.trim(),
              emails: customer.email ? [customer.email] : [],
              phone: customer.phone || null,
              default_payment_terms: '30 days',
              active: true
            })
            .select()
            .single();

          if (createError) throw createError;

          setAccountCustomerId(newAccountCustomer.id);
          
          toast({
            title: 'Account Customer Created',
            description: `Created new account: ${newAccountCustomer.name}`,
          });
        }
      } catch (error) {
        console.error('Error linking account customer:', error);
        toast({
          title: 'Error',
          description: 'Failed to link account customer',
          variant: 'destructive',
        });
      }
    };

    // Debounce the account customer linking
    const timeoutId = setTimeout(linkAccountCustomer, 600);
    return () => clearTimeout(timeoutId);
  }, [hasAccount, jobCompanyName, customer.phone]);

  // Auto-fill email when account customer is linked
  useEffect(() => {
    const fillEmailFromAccount = async () => {
      if (!accountCustomerId) return;

      try {
        const { data: accountCustomer, error } = await supabase
          .from('account_customers')
          .select('emails')
          .eq('id', accountCustomerId)
          .single();

        if (error) throw error;

        if (accountCustomer?.emails && accountCustomer.emails.length > 0 && !customer.email) {
          setCustomer(prev => ({
            ...prev,
            email: accountCustomer.emails[0]
          }));
        }
      } catch (error) {
        console.error('Error fetching account customer email:', error);
      }
    };

    fillEmailFromAccount();
  }, [accountCustomerId]);

  const addPart = () => {
    const newPart: JobPart = {
      id: generateId(), // Add stable row ID
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
      id: generateId(),
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
        title: t('msg.validation.error'),
        description: t('msg.validation.required'),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setAutoSaveStatus('saving');

    try {
      // Ensure category exists in Supabase (for new categories added from booking)
      await ensureCategoryExists(machineCategory, labourRate);

      const customerData: Customer = {
        id: customer.id || '', // Will be ignored for new customers
        name: toTitleCase(customer.name.trim()),
        phone: customer.phone,
        address: customer.address || '',
        email: customer.email,
        notes: customer.notes,
        customerType: customerType, // save customer type to customer profile
        companyName: jobCompanyName || customer.companyName, // save company name to customer profile
        createdAt: customer.createdAt || new Date(),
        updatedAt: new Date()
      };

      const labourRateForCategory = getLabourRate(machineCategory) || 95;
      
      // Calculate labour total including small repair if enabled
      const smallRepairLabour = smallRepairData.includeInTotals 
        ? (smallRepairData.overrideTotal ?? smallRepairData.calculatedTotal)
        : 0;
      
      const jobData: Job = {
        id: job?.id || '', // Will be ignored for new jobs
        jobNumber: jobNumber || `JB${Date.now()}`,
        customerId: customer.id || '',
        customer: customerData,
        customerType, // save customer type to job
        jobCompanyName, // save company name to job
        machineCategory,
        machineBrand,
        machineModel,
        machineSerial,
        problemDescription,
        notes,
        additionalNotes,
        servicePerformed,
        recommendations,
        serviceDeposit,
        quotationAmount,
        discountType,
        discountValue,
        parts,
        labourHours,
        labourRate: labourRateForCategory,
        checklistUniversal,
        checklistCategory,
        equipmentCategory: machineCategory,
        transportPickupRequired: transportData.pickupRequired,
        transportDeliveryRequired: transportData.deliveryRequired,
        transportSizeTier: transportData.sizeTier || undefined,
        transportDistanceKm: transportData.distanceKm,
        transportTotalCharge: transportData.totalCharge,
        transportBreakdown: transportData.breakdown,
        sharpenItems: sharpenData.items,
        sharpenTotalCharge: sharpenData.totalCharge,
        sharpenBreakdown: sharpenData.breakdown,
        smallRepairDetails: smallRepairData.repairDetails,
        smallRepairMinutes: smallRepairData.minutes,
        smallRepairRate: smallRepairData.rate,
        smallRepairTotal: smallRepairData.includeInTotals 
          ? (smallRepairData.overrideTotal ?? smallRepairData.calculatedTotal)
          : 0,
        // Phase 2 fields
        requestedFinishDate,
        attachments,
        ...calculations,
        status,
        createdAt: job?.createdAt || new Date(),
        updatedAt: new Date(),
        completedAt: status === 'completed' && !job?.completedAt ? new Date() : job?.completedAt,
        deliveredAt: status === 'delivered' && !job?.deliveredAt ? new Date() : job?.deliveredAt,
        hasAccount,
        accountCustomerId: hasAccount ? accountCustomerId : undefined
      };

      const savedJob = await jobBookingDB.saveJob(jobData);
      
      // Update local savedJob state immediately so invoice uses fresh data
      setSavedJob(savedJob);
      setAutoSaveStatus('saved');
      
      toast({
        title: job ? t('msg.job.updated') : t('msg.job.created'),
        description: job ? t('msg.job.updated') : t('msg.job.created')
      });
      
      // For NEW jobs ONLY, automatically print collection receipt
      // IMPORTANT: Only trigger auto-print for brand new jobs, not edits
      if (!job || !job.id) {
        setAutoSaveStatus('printing');
        
        // Small delay to ensure job is fully saved
        await new Promise(resolve => setTimeout(resolve, 200));
        
        try {
          // Retry logic for printing
          let printSuccess = false;
          let retries = 0;
          const maxRetries = 3;
          
          while (!printSuccess && retries < maxRetries) {
            try {
              await printThermal({ 
                job: savedJob, 
                type: 'collection-receipt', 
                width: 79 
              });
              printSuccess = true;
              
              toast({
                title: 'Collection receipt sent',
                description: 'Label sent to printer successfully'
              });
            } catch (printError) {
              retries++;
              if (retries < maxRetries) {
                // Backoff: 300ms, 600ms, 900ms
                await new Promise(resolve => setTimeout(resolve, 300 * retries));
              } else {
                throw printError;
              }
            }
          }
        } catch (printError) {
          console.error('Print failed after retries:', printError);
          toast({
            title: 'Print failed',
            description: 'Could not print collection receipt. Please print manually.',
            variant: 'destructive'
          });
        } finally {
          setAutoSaveStatus('saved');
        }
      }
      
      // Sync to Account Customer if applicable
      if (savedJob.accountCustomerId) {
        try {
          await syncJobToAccountCustomer(savedJob);
        } catch (syncError) {
          console.error('Account customer sync failed (non-blocking):', syncError);
          // Don't block the save flow
        }
      }
      
      // Schedule service reminder if job is delivered
      if (savedJob.status === 'delivered') {
        try {
          await scheduleServiceReminder(savedJob);
        } catch (reminderError) {
          console.error('Reminder scheduling failed (non-blocking):', reminderError);
        }
      }
      
      // Cancel reminders if job is marked as write-off
      if (savedJob.status === 'write_off') {
        try {
          await cancelMachineReminders(
            savedJob.customerId,
            savedJob.machineCategory,
            savedJob.machineBrand,
            savedJob.machineModel,
            savedJob.machineSerial
          );
        } catch (cancelError) {
          console.error('Reminder cancellation failed (non-blocking):', cancelError);
        }
      }
      
      // Show print prompts for manual printing (ONLY for edits, not for new jobs)
      // New jobs already auto-printed collection receipt above
      if (job && job.id) {
        setSavedJob(savedJob);
        setShowPrintPromptDialog(true);
      }
      
      onSave(savedJob);
      
    } catch (error) {
      console.error('Error saving job:', error);
      setAutoSaveStatus('idle');
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNotificationDialog(true)}
              className="gap-2"
            >
              <Bell className="w-4 h-4" />
              Notify Customer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmailDialog(true)}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
            <JobPrintInvoice job={savedJob || job} />
            <ThermalPrintButton job={savedJob || job} type="service-label" label="Service Label" size="sm" width={79} />
            <ThermalPrintButton job={savedJob || job} type="collection-receipt" label="Collection Receipt" size="sm" width={79} />
          </>
        )}
        <Button onClick={handleSave} disabled={isLoading} className="flex-1 sm:flex-initial">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {autoSaveStatus === 'printing' ? 'Printing...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {t('jobs.save')}
            </>
          )}
        </Button>
        {autoSaveStatus === 'saved' && !isLoading && (
          <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
            <Check className="w-4 h-4" />
            Saved
          </span>
        )}
        {autoSaveStatus === 'saving' && (
          <span className="text-sm text-muted-foreground">
            Saving...
          </span>
        )}
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
              <CustomerAutocomplete
                customer={customer}
                onCustomerChange={(newCustomer) => {
                  setCustomer(newCustomer);
                  // Pre-fill customer type and company from stored customer data
                  const custType = (newCustomer as Customer).customerType;
                  const compName = (newCustomer as Customer).companyName;
                  if (custType) {
                    setCustomerType(custType);
                  }
                  if (compName) {
                    setJobCompanyName(compName);
                  }
                }}
              />
              
              {/* Customer Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-type">Customer Type</Label>
                  <Select value={customerType} onValueChange={(v: 'commercial' | 'domestic') => setCustomerType(v)}>
                    <SelectTrigger id="customer-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domestic">🏠 Domestic</SelectItem>
                      <SelectItem value="commercial">🏢 Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {customerType === 'commercial' ? '3-month service reminders' : '11-month service reminders'}
                  </p>
                </div>
                
                {/* Company Name */}
                <div>
                  <Label htmlFor="company-name">Company Name (Optional)</Label>
                  <Input
                    id="company-name"
                    value={jobCompanyName}
                    onChange={(e) => setJobCompanyName(e.target.value)}
                    onBlur={(e) => setJobCompanyName(toTitleCase(e.target.value))}
                    placeholder="Company name..."
                  />
                </div>
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

          {/* Transport Section */}
          <TransportSection
            machineCategory={machineCategory}
            onTransportChange={setTransportData}
            initialData={{
              pickupRequired: transportData.pickupRequired,
              deliveryRequired: transportData.deliveryRequired,
              sizeTier: transportData.sizeTier || undefined,
              distanceKm: transportData.distanceKm
            }}
          />

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
              
              {/* Requested Finish Date */}
              <RequestedFinishDatePicker
                date={requestedFinishDate}
                onChange={setRequestedFinishDate}
              />
            </CardContent>
          </Card>

          {/* Multi-Tool Attachments - Show only for Multi-Tool categories */}
          {(machineCategory === 'Multi-Tool' || machineCategory.startsWith('Battery Multi-Tool')) && (
            <MultiToolAttachments
              attachments={attachments}
              onChange={setAttachments}
            />
          )}

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
              
              <DraggableQuickProblems
                onSelect={(label) => {
                  const currentDesc = problemDescription.trim();
                  const newDesc = currentDesc 
                    ? `${currentDesc}${currentDesc.endsWith('.') || currentDesc.endsWith(',') ? ' ' : ', '}${label}`
                    : label;
                  setProblemDescription(newDesc);
                }}
                selectedProblems={problemDescription.split(',').map(s => s.trim())}
              />
              
              <div>
                <Label htmlFor="additional-notes">{t('problem.additional')}</Label>
                <TextareaTranslated
                  id="additional-notes"
                  value={additionalNotes}
                  onChange={(value) => setAdditionalNotes(value)}
                  placeholder="Any additional details or special requests..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sharpen Section */}
          <SharpenSection
            onSharpenChange={setSharpenData}
            initialData={{
              items: sharpenData.items
            }}
          />

          {/* Small Repair Section */}
          <SmallRepairSection
            data={smallRepairData}
            onChange={setSmallRepairData}
          />

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

          {/* Parts Picker - Catalog-based parts selection */}
          {machineCategory && (
            <PartsPicker
              equipmentCategory={machineCategory}
              onAddPart={(part, quantity, overridePrice) => {
                const newPart: JobPart = {
                  id: generateId(),
                  partId: part.id,
                  partName: part.name,
                  quantity,
                  unitPrice: overridePrice || part.sell_price,
                  totalPrice: (overridePrice || part.sell_price) * quantity,
                  category: part.category
                };
                setParts([...parts, newPart]);
              }}
            />
          )}

          {/* Added Parts List */}
          {parts.length > 0 && (
            <Card className="form-section">
              <CardHeader>
                <CardTitle>Added Parts ({parts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {parts.map((part) => (
                    <div key={part.id} className="flex items-center justify-between p-3 border rounded-lg bg-accent/20">
                      <div className="flex-1">
                        <p className="font-medium">{part.partName}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {part.quantity} × ${part.unitPrice.toFixed(2)} = ${part.totalPrice.toFixed(2)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePart(part.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Labour */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle>{t('labour.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t('labour.hours')}</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.25"
                    value={labourHours}
                    onChange={(e) => handleLabourHoursChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label>Labour Fee ($)</Label>
                  <InputCurrency
                    value={labourFee}
                    onChange={handleLabourFeeChange}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Fee ↔ Hours auto-sync. Rate: {formatCurrency(labourRate)}/hr
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('summary.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary Chips for Services */}
              {(transportData.totalCharge > 0 || sharpenData.totalCharge > 0 || (smallRepairData.includeInTotals && smallRepairData.calculatedTotal > 0)) && (
                <div className="flex flex-wrap gap-2 pb-3 border-b">
                  {transportData.totalCharge > 0 && (
                    <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full text-xs font-medium">
                      Transport: {formatCurrency(transportData.totalCharge)}
                    </div>
                  )}
                  {sharpenData.totalCharge > 0 && (
                    <div className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full text-xs font-medium">
                      Sharpen: {formatCurrency(sharpenData.totalCharge)}
                    </div>
                  )}
                  {smallRepairData.includeInTotals && smallRepairData.calculatedTotal > 0 && (
                    <div className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-full text-xs font-medium">
                      Small Repair: {formatCurrency(smallRepairData.overrideTotal ?? smallRepairData.calculatedTotal)}
                    </div>
                  )}
                </div>
              )}
              
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
                    <SelectItem value="write_off">🗑️ Write Off</SelectItem>
                  </SelectContent>
                </Select>
                {status === 'write_off' && (
                  <p className="text-xs text-muted-foreground mt-1 text-amber-600">
                    ⚠️ Machine marked as write-off will be excluded from future service reminders
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Staff Job Notes */}
          {job && <StaffJobNotes jobId={job.id} />}
        </div>
      </div>

      {/* Print Prompt Dialog */}
      {savedJob && (
        <PrintPromptDialog
          job={savedJob}
          open={showPrintPromptDialog}
          onOpenChange={setShowPrintPromptDialog}
          onComplete={() => {
            onSave(savedJob);
            setSavedJob(null);
          }}
        />
      )}
      
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

      {/* Customer Notification Dialog */}
      {job && (
        <CustomerNotificationDialog
          job={job}
          open={showNotificationDialog}
          onOpenChange={setShowNotificationDialog}
        />
      )}

      {/* Email Notification Dialog */}
      {job && (
        <EmailNotificationDialog
          job={job}
          open={showEmailDialog}
          onOpenChange={setShowEmailDialog}
        />
      )}
    </div>
  );
}
