import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function NewJobSimple() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Customer fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  // Machine fields
  const [machineCategory, setMachineCategory] = useState('');
  const [machineBrand, setMachineBrand] = useState('');
  const [machineModel, setMachineModel] = useState('');
  const [machineSerial, setMachineSerial] = useState('');
  const [problemDescription, setProblemDescription] = useState('');

  async function createJob() {
    console.log('🔵 Creating new job...');
    
    if (!customerName || !customerPhone) {
      toast.error('Customer name and phone are required');
      return;
    }

    setSaving(true);

    // Step 1: Create or find customer
    console.log('🔵 Creating/finding customer...');
    const { data: customerData, error: customerError } = await supabase
      .from('customers_db')
      .upsert({
        name: customerName,
        phone: customerPhone,
        email: customerEmail || null,
      })
      .select()
      .single();

    if (customerError) {
      console.error('❌ Error with customer:', customerError);
      toast.error(`Customer error: ${customerError.message}`);
      setSaving(false);
      return;
    }

    console.log('✅ Customer ready:', customerData);

    // Step 2: Create job using RPC
    console.log('🔵 Calling create_job RPC with params:', {
      p_customer_id: customerData.id,
      p_machine_category: machineCategory || null,
      p_machine_brand: machineBrand || null,
      p_machine_model: machineModel || null,
      p_machine_serial: machineSerial || null,
      p_problem_description: problemDescription || null,
    });

    const { data: jobData, error: jobError } = await supabase.rpc('create_job', {
      p_customer_id: customerData.id,
      p_machine_category: machineCategory || null,
      p_machine_brand: machineBrand || null,
      p_machine_model: machineModel || null,
      p_machine_serial: machineSerial || null,
      p_problem_description: problemDescription || null,
    });

    if (jobError) {
      console.error('❌ Error creating job via RPC:', jobError);
      toast.error(`Job creation failed: ${jobError.message}`);
      setSaving(false);
      return;
    }

    console.log('✅ Job created successfully via RPC:', jobData);
    toast.success(`Job ${jobData.job_number} created`);
    
    setSaving(false);
    navigate(`/jobs-simple/${jobData.id}`);
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/jobs-simple')}>
          ← Back to Jobs
        </Button>
        <h1 className="text-3xl font-bold mt-2">Create New Job</h1>
      </div>

      <div className="space-y-6">
        {/* Customer Section */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customerName">Name *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone *</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Machine Section */}
        <Card>
          <CardHeader>
            <CardTitle>Machine Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={machineCategory}
                onChange={(e) => setMachineCategory(e.target.value)}
                placeholder="e.g., Mower, Chainsaw"
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={machineBrand}
                onChange={(e) => setMachineBrand(e.target.value)}
                placeholder="e.g., Honda, Stihl"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={machineModel}
                onChange={(e) => setMachineModel(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="serial">Serial Number</Label>
              <Input
                id="serial"
                value={machineSerial}
                onChange={(e) => setMachineSerial(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="problem">Problem Description</Label>
              <Input
                id="problem"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="What's wrong with the machine?"
              />
            </div>
          </CardContent>
        </Card>

        {/* Create Button */}
        <div className="flex gap-3">
          <Button
            onClick={createJob}
            disabled={saving || !customerName || !customerPhone}
            className="flex-1"
          >
            {saving ? 'Creating Job...' : 'Create Job'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/jobs-simple')}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
