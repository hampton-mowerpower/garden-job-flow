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
import { Job, Customer, JobPart } from '@/types/job';
import { MACHINE_CATEGORIES } from '@/data/machineCategories';
import { DEFAULT_PARTS } from '@/data/defaultParts';
import { calculateJobTotals, formatCurrency, calculatePartTotal } from '@/lib/calculations';
import { jobBookingDB } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import { JobPrintLabel } from './JobPrintLabel';
import { JobPrintInvoice } from './JobPrintInvoice';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';
import { ServiceNoteTemplates } from './ServiceNoteTemplates';

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
  const [serviceTemplates, setServiceTemplates] = useState<string[]>([]);
  
  const [parts, setParts] = useState<JobPart[]>([]);
  const [labourHours, setLabourHours] = useState(0);
  const [status, setStatus] = useState<Job['status']>('pending');
  
  // Calculations
  const selectedCategory = MACHINE_CATEGORIES.find(cat => cat.id === machineCategory);
  const labourRate = selectedCategory?.labourRate || 0;
  const labelCharge = selectedCategory?.labelCharge || 0;
  const calculations = calculateJobTotals(parts, labourHours, labourRate, labelCharge);

  useEffect(() => {
    initializeForm();
  }, [job]);

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
      setParts(job.parts);
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
      partId: '',
      partName: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };
    setParts([...parts, newPart]);
  };

  const updatePart = (index: number, updates: Partial<JobPart>) => {
    const updatedParts = [...parts];
    updatedParts[index] = { ...updatedParts[index], ...updates };
    
    // Recalculate total price
    if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
      updatedParts[index].totalPrice = calculatePartTotal(
        updatedParts[index].unitPrice,
        updatedParts[index].quantity
      );
    }
    
    setParts(updatedParts);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const selectPresetPart = (partId: string, index: number) => {
    if (partId === 'custom') {
      updatePart(index, {
        partId: 'custom',
        partName: '',
        unitPrice: 0
      });
      return;
    }
    
    const presetPart = DEFAULT_PARTS.find(p => p.id === partId);
    if (presetPart) {
      updatePart(index, {
        partId: presetPart.id,
        partName: presetPart.name,
        unitPrice: presetPart.price
      });
    }
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
        parts,
        labourHours,
        labourRate,
        labelCharge,
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {job ? `Edit Job ${jobNumber}` : 'New Job Booking'}
          </h2>
          <p className="text-muted-foreground">
            {job ? 'Update job details' : 'Create a new service booking'}
          </p>
        </div>
        <div className="flex gap-2">
          {job && (
            <>
              <JobPrintLabel job={job} />
              <JobPrintInvoice job={job} />
            </>
          )}
          <Button onClick={handleSave} disabled={isLoading}>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="machine-category">Category *</Label>
                  <Select value={machineCategory} onValueChange={setMachineCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine category" />
                    </SelectTrigger>
                    <SelectContent>
                      {MACHINE_CATEGORIES.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} (${category.labourRate}/hr)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="machine-brand">Brand</Label>
                  <Select value={machineBrand} onValueChange={setMachineBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategory?.commonBrands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="machine-model">Model</Label>
                  <Input
                    id="machine-model"
                    value={machineModel}
                    onChange={(e) => setMachineModel(e.target.value)}
                    placeholder="Enter model number"
                  />
                </div>
                <div>
                  <Label htmlFor="machine-serial">Serial Number</Label>
                  <Input
                    id="machine-serial"
                    value={machineSerial}
                    onChange={(e) => setMachineSerial(e.target.value)}
                    placeholder="Enter serial number"
                  />
                </div>
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
              <ServiceNoteTemplates
                selectedTemplates={serviceTemplates}
                onTemplatesChange={setServiceTemplates}
              />
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

          {/* Parts */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Parts Required
                <Button variant="outline" size="sm" onClick={addPart}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Part
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {parts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No parts added yet. Click "Add Part" to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {parts.map((part, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                      <div className="col-span-4">
                        <Label>Part Name</Label>
                        <Select
                          value={part.partId}
                          onValueChange={(value) => selectPresetPart(value, index)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select part" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom Part</SelectItem>
                            {DEFAULT_PARTS.map((preset) => (
                              <SelectItem key={preset.id} value={preset.id}>
                                {preset.name} - ${preset.price}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(!part.partId || part.partId === 'custom') && (
                          <Input
                            className="mt-1"
                            value={part.partName}
                            onChange={(e) => updatePart(index, { partName: e.target.value })}
                            placeholder="Enter part name"
                          />
                        )}
                      </div>
                      <div className="col-span-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={part.quantity}
                          onChange={(e) => updatePart(index, { quantity: parseInt(e.target.value) || 1 })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Unit Price</Label>
                        <InputCurrency
                          value={part.unitPrice}
                          onChange={(value) => updatePart(index, { unitPrice: value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>Total</Label>
                        <div className="h-10 flex items-center px-3 bg-muted rounded-md">
                          {formatCurrency(part.totalPrice)}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePart(index)}
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
              
              {labelCharge > 0 && (
                <div className="flex justify-between">
                  <span>Label Charge:</span>
                  <span>{formatCurrency(labelCharge)}</span>
                </div>
              )}
              
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}