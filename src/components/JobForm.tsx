import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputCurrency } from '@/components/ui/input-currency';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Save, Printer } from 'lucide-react';
import { nanoid } from 'nanoid';
import { Job, Customer, JobPart } from '@/types/job';
import { HAMPTON_MACHINE_CATEGORIES } from '@/data/hamptonMachineData';
import { DEFAULT_PARTS } from '@/data/defaultParts';
import { A4_PARTS, PART_CATEGORIES } from '@/data/a4Parts';
import { calculateJobTotals, formatCurrency, calculatePartTotal } from '@/lib/calculations';
import { jobBookingDB } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { JobPrintLabel } from './JobPrintLabel';
import { JobPrintInvoice } from './JobPrintInvoice';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';

import { MachineManager } from './MachineManager';

interface JobFormProps {
  job?: Job;
  onSave: (job: Job) => void;
  onPrint?: (job: Job) => void;
}

export default function JobForm({ job, onSave, onPrint }: JobFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
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
  
  const [parts, setParts] = useState<JobPart[]>([]);
  const [labourHours, setLabourHours] = useState(0);
  const [status, setStatus] = useState<Job['status']>('pending');
  const [selectedPartCategory, setSelectedPartCategory] = useState<string>('All');
  const [quickDescriptions, setQuickDescriptions] = useState<string[]>([]);
  
  // Calculations
  const selectedCategory = HAMPTON_MACHINE_CATEGORIES.find(cat => cat.id === machineCategory);
  const labourRate = selectedCategory?.labourRate || 0;
  const baseCalculations = calculateJobTotals(parts, labourHours, labourRate);
  
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
      
      // Migrate parts to include stable IDs if missing
      const migratedParts = job.parts.map(part => ({
        ...part,
        id: part.id || nanoid() // Add ID if missing for backward compatibility
      }));
      setParts(migratedParts);
      setLabourHours(job.labourHours);
      setStatus(job.status);
    } else {
      // New job
      try {
        await jobBookingDB.init();
        const nextJobNumber = await jobBookingDB.getNextJobNumber();
        setJobNumber(nextJobNumber);
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

  const handleSave = async () => {
    // Validation
    if (!customer.name || !customer.phone || !machineCategory || !problemDescription) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
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
        createdAt: job?.createdAt || new Date(),
        updatedAt: new Date(),
        completedAt: status === 'completed' ? new Date() : job?.completedAt
      };
      
      await jobBookingDB.saveJob(jobData);
      
      toast({
        title: "Success",
        description: job ? "Job updated successfully" : "Job created successfully"
      });
      
      onSave(jobData);
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: "Error",
        description: "Failed to save job",
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
            {job ? `Edit Job ${jobNumber}` : 'New Job Booking'}
          </h2>
          <p className="text-muted-foreground">
            {job ? 'Update job details' : 'Create a new service booking'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {job && (
            <>
              <JobPrintLabel job={job} />
              <JobPrintInvoice job={job} />
            </>
          )}
          <Button onClick={handleSave} disabled={isLoading} className="flex-1 sm:flex-initial">
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Job'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Job Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-name">Customer Name *</Label>
                  <Input
                    id="customer-name"
                    value={customer.name}
                    onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone Number *</Label>
                  <Input
                    id="customer-phone"
                    value={customer.phone}
                    onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="customer-address">Address</Label>
                <GooglePlacesAutocomplete
                  value={customer.address || ''}
                  onChange={(value) => setCustomer({...customer, address: value})}
                  placeholder="Enter customer address"
                />
              </div>
              <div>
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({...customer, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
            </CardContent>
          </Card>

          {/* Machine Information */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle>Machine Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <MachineManager
              machineCategory={machineCategory}
              machineBrand={machineBrand}
              machineModel={machineModel}
              onCategoryChange={setMachineCategory}
              onBrandChange={setMachineBrand}
              onModelChange={setMachineModel}
            />
              <div>
                <Label htmlFor="machine-serial">Serial Number</Label>
                <Input
                  id="machine-serial"
                  value={machineSerial}
                  onChange={(e) => setMachineSerial(e.target.value)}
                  placeholder="Enter serial number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Problem Description */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle>Problem Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="problem-description">Problem Description *</Label>
                <Textarea
                  id="problem-description"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describe the problem or service required"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Quick Problem Descriptions</Label>
                <p className="text-sm text-muted-foreground mb-3">Click to add to problem description above</p>
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
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes or special instructions"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Quotation Box */}
          <Card className="form-section border-orange-200 bg-orange-50/50">
            <CardHeader>
              <CardTitle className="text-orange-700">Quotation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quotation-amount">Quotation Amount</Label>
                <InputCurrency
                  value={quotationAmount}
                  onChange={setQuotationAmount}
                  placeholder="Enter quotation amount"
                />
              </div>
              <div className="bg-orange-100 border border-orange-200 rounded-lg p-3">
                <p className="text-sm font-medium text-orange-800 mb-1">
                  Important Notice:
                </p>
                <p className="text-xs text-orange-700">
                  Quotation cost is non-refundable. It may only be deducted from the total repair cost when the job is finalized.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mechanic Service Notes */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle>Mechanic Service Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="service-performed">Service Performed (by mechanic)</Label>
                <Textarea
                  id="service-performed"
                  value={servicePerformed}
                  onChange={(e) => setServicePerformed(e.target.value)}
                  placeholder="e.g., Changed oil, replaced spark plug, sharpened blade, tuned carburettor..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="recommendations">Recommendations / Future Attention</Label>
                <Textarea
                  id="recommendations"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  placeholder="e.g., Rear belt worn—replace within 3 months; check air filter monthly..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Parts */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <span>Parts Required</span>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Select value={selectedPartCategory} onValueChange={setSelectedPartCategory}>
                    <SelectTrigger className="w-full sm:w-40">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Categories</SelectItem>
                      {PART_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={addPart} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Part
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No parts added yet. Click "Add Part" to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {parts.map((part) => (
                    <div key={part.id} className="flex flex-col gap-3 p-4 border rounded-lg">
                      <div className="w-full">
                        <Label>Part Name</Label>
                        <Select
                          value={part.partId}
                          onValueChange={(value) => selectPresetPart(value, part.id)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select part" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60">
                            <SelectItem value="custom">Custom Part</SelectItem>
                            {selectedPartCategory !== 'All' && (
                              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b">
                                {selectedPartCategory} Parts
                              </div>
                            )}
                            {getFilteredPartsForRow(part.partId).map((preset) => (
                              <SelectItem key={preset.id} value={preset.id}>
                                <div className="flex justify-between items-center w-full">
                                  <span>{preset.name}</span>
                                  <span className="text-muted-foreground ml-2">${preset.sellPrice}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(!part.partId || part.partId === 'custom') && (
                          <Input
                            className="mt-2"
                            value={part.partName}
                            onChange={(e) => updatePart(part.id, { partName: e.target.value })}
                            placeholder="Enter part name"
                          />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min="1"
                            value={part.quantity}
                            onChange={(e) => updatePart(part.id, { quantity: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div>
                          <Label>Unit Price</Label>
                          <InputCurrency
                            value={part.unitPrice}
                            onChange={(value) => updatePart(part.id, { unitPrice: value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Total</Label>
                          <div className="h-10 flex items-center px-3 bg-muted rounded-md font-medium">
                            {formatCurrency(part.totalPrice)}
                          </div>
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removePart(part.id)}
                            className="w-full"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Pricing & Summary */}
        <div className="space-y-6">
          <Card className="stats-card">
            <CardHeader>
              <CardTitle>Job Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Job Number</Label>
                <div className="font-mono font-bold text-primary">
                  {jobNumber}
                </div>
              </div>
              
              {partsRequired && (
                <div className="space-y-2">
                  <Label>Parts Required</Label>
                  <div className="text-sm bg-muted p-3 rounded min-h-[60px] text-muted-foreground">
                    {partsRequired || 'No parts selected yet'}
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="labour-hours">Labour Hours</Label>
                <Input
                  id="labour-hours"
                  type="number"
                  min="0"
                  step="0.25"
                  value={labourHours}
                  onChange={(e) => setLabourHours(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="service-deposit">Service Deposit</Label>
                <InputCurrency
                  value={serviceDeposit}
                  onChange={setServiceDeposit}
                  placeholder="Enter service deposit amount"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Will be deducted from final total when job is finalized
                </p>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: Job['status']) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="form-section">
            <CardHeader>
              <CardTitle>Pricing Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span>Parts Subtotal:</span>
                <span>{formatCurrency(calculations.partsSubtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Labour ({labourHours}h × ${labourRate}/h):</span>
                <span>{formatCurrency(labourHours * labourRate)}</span>
              </div>
              
              <div className="flex justify-between font-medium">
                <span>Labour Total:</span>
                <span>{formatCurrency(calculations.labourTotal)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(calculations.subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>GST (10%):</span>
                <span>{formatCurrency(calculations.gst)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Grand Total:</span>
                <span className="text-primary">{formatCurrency(calculations.grandTotal)}</span>
              </div>

              {serviceDeposit > 0 && (
                <>
                  <div className="flex justify-between text-orange-600">
                    <span>Less: Service Deposit:</span>
                    <span>-{formatCurrency(serviceDeposit)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-xl font-bold text-green-600">
                    <span>Final Amount Due:</span>
                    <span>{formatCurrency(calculations.finalTotal)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}