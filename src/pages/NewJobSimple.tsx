import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CustomerAutocomplete } from '@/components/booking/CustomerAutocomplete';
import { DraggableQuickProblems } from '@/components/booking/DraggableQuickProblems';
import { MultiToolAttachments } from '@/components/booking/MultiToolAttachments';
import { RequestedFinishDatePicker } from '@/components/booking/RequestedFinishDatePicker';
import { SearchableCategorySelect } from '@/components/machinery/SearchableCategorySelect';
import { SearchableBrandSelect } from '@/components/machinery/SearchableBrandSelect';
import { SearchableModelSelect } from '@/components/machinery/SearchableModelSelect';
import { Customer } from '@/types/job';

export default function NewJobSimple() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Partial<Customer> | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    machine_category: '',
    machine_brand: '',
    machine_model: '',
    machine_serial: '',
    problem_description: ''
  });

  // Phase 2 features matching original JobForm
  const [requestedFinishDate, setRequestedFinishDate] = useState<Date | undefined>(undefined);
  const [attachments, setAttachments] = useState<Array<{ name: string; problemDescription: string }>>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer?.id) {
      toast.error("Please select a customer");
      return;
    }

    if (!formData.machine_category) {
      toast.error("Please enter a machine category");
      return;
    }

    setIsSaving(true);
    console.log('[NewJobSimple] Creating job with data:', {
      customer_id: selectedCustomer.id,
      machine_category: formData.machine_category,
      machine_brand: formData.machine_brand || null,
      machine_model: formData.machine_model || null,
      machine_serial: formData.machine_serial || null,
      problem_description: formData.problem_description || null,
      requested_finish_date: requestedFinishDate?.toISOString() || null,
      attachments: attachments.length > 0 ? attachments : null
    });

    try {
      const { data, error } = await supabase.rpc('create_job', {
        p_customer_id: selectedCustomer.id,
        p_machine_category: formData.machine_category,
        p_machine_brand: formData.machine_brand || null,
        p_machine_model: formData.machine_model || null,
        p_machine_serial: formData.machine_serial || null,
        p_problem_description: formData.problem_description || null
      });

      console.log('[NewJobSimple] RPC response:', { data, error });

      if (error) {
        console.error('[NewJobSimple] RPC error:', error);
        toast.error(`Failed to create job: ${error.message}`);
        return;
      }

      if (!data) {
        console.error('[NewJobSimple] No data returned from RPC');
        toast.error('Failed to create job: No data returned');
        return;
      }

      // If we have requested finish date or attachments, update the job
      if (requestedFinishDate || attachments.length > 0) {
        const updatePatch: any = {};
        if (requestedFinishDate) {
          updatePatch.requested_finish_date = requestedFinishDate.toISOString();
        }
        if (attachments.length > 0) {
          updatePatch.attachments = attachments;
        }

        const { error: updateError } = await supabase.rpc('update_job_simple', {
          p_job_id: data.id,
          p_version: 1,
          p_patch: updatePatch
        });

        if (updateError) {
          console.error('[NewJobSimple] Update error:', updateError);
          // Don't fail - job was created, just additional data didn't save
        }
      }

      console.log('[NewJobSimple] Job created successfully:', data);
      toast.success(`Job ${data.job_number} created successfully!`);
      navigate(`/jobs-simple/${data.id}`);
    } catch (err) {
      console.error('[NewJobSimple] Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/jobs-simple')}>
          ← Back to Jobs
        </Button>
        <h1 className="text-3xl font-bold text-primary mt-2">Create New Job</h1>
        <p className="text-muted-foreground">Enter customer and machine details to create a new service job</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Section - Using CustomerAutocomplete from original */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerAutocomplete
              customer={selectedCustomer || { name: '', phone: '', address: '', email: '' }}
              onCustomerChange={setSelectedCustomer}
            />
          </CardContent>
        </Card>

        {/* Machine Section - Using searchable selects from original */}
        <Card>
          <CardHeader>
            <CardTitle>Machine Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <SearchableCategorySelect
                value={formData.machine_category}
                onValueChange={(value) => setFormData({ ...formData, machine_category: value })}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <SearchableBrandSelect
                  value={formData.machine_brand}
                  onValueChange={(value) => setFormData({ ...formData, machine_brand: value })}
                  categoryName={formData.machine_category}
                />
              </div>
              <div>
                <Label htmlFor="model">Model</Label>
                <SearchableModelSelect
                  value={formData.machine_model}
                  onValueChange={(value) => setFormData({ ...formData, machine_model: value })}
                  brandName={formData.machine_brand}
                  categoryName={formData.machine_category}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="serial">Serial Number</Label>
              <Input
                id="serial"
                value={formData.machine_serial}
                onChange={(e) => setFormData({ ...formData, machine_serial: e.target.value })}
                placeholder="Enter serial number"
              />
            </div>
          </CardContent>
        </Card>

        {/* Problem Description Section - With Quick Problems from original */}
        <Card>
          <CardHeader>
            <CardTitle>Problem Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DraggableQuickProblems
              onSelect={(description) => setFormData({ 
                ...formData, 
                problem_description: formData.problem_description 
                  ? `${formData.problem_description}${formData.problem_description.endsWith('.') ? '' : '.'} ${description}`
                  : description 
              })}
            />
            
            <div>
              <Label htmlFor="problem">Problem Details</Label>
              <Textarea
                id="problem"
                value={formData.problem_description}
                onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                placeholder="Describe the problem or service required..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Multi-Tool Attachments - From original JobForm Phase 2 */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Tools/Attachments (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiToolAttachments
              attachments={attachments}
              onChange={setAttachments}
            />
          </CardContent>
        </Card>

        {/* Requested Finish Date - From original JobForm Phase 2 */}
        <Card>
          <CardHeader>
            <CardTitle>Requested Finish Date (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestedFinishDatePicker
              date={requestedFinishDate}
              onChange={setRequestedFinishDate}
            />
          </CardContent>
        </Card>

        {/* Create Button */}
        <div className="flex gap-3 sticky bottom-0 bg-background p-4 border-t">
          <Button
            type="submit"
            disabled={isSaving || !selectedCustomer?.id || !formData.machine_category}
            className="flex-1"
            size="lg"
          >
            {isSaving ? 'Creating Job...' : 'Create Job'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/jobs-simple')}
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
