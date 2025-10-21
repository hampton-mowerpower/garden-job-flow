import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export default function NewJobSimple() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    machine_category: '',
    machine_brand: '',
    machine_model: '',
    machine_serial: '',
    problem_description: ''
  });

  // Search for customers
  const searchCustomers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setCustomerResults([]);
      return;
    }

    const { data, error } = await supabase
      .from('customers_db')
      .select('id, name, phone, email')
      .or(`name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
      .limit(10);

    if (!error && data) {
      setCustomerResults(data);
      setShowCustomerDropdown(true);
    }
  };

  const handleCustomerSearch = (value: string) => {
    setCustomerSearch(value);
    searchCustomers(value);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    setIsSaving(true);
    console.log('[NewJobSimple] Creating job with data:', {
      customer_id: selectedCustomer.id,
      machine_category: formData.machine_category,
      machine_brand: formData.machine_brand || null,
      machine_model: formData.machine_model || null,
      machine_serial: formData.machine_serial || null,
      problem_description: formData.problem_description || null
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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/jobs-simple')}>
          ← Back to Jobs
        </Button>
        <h1 className="text-3xl font-bold mt-2">Create New Job</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Section */}
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Label htmlFor="customerSearch">Search Customer *</Label>
              <Input
                id="customerSearch"
                value={customerSearch}
                onChange={(e) => handleCustomerSearch(e.target.value)}
                placeholder="Search by name or phone..."
                required
              />
              
              {showCustomerDropdown && customerResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                  {customerResults.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => selectCustomer(customer)}
                      className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium">{customer.name}</div>
                      <div className="text-sm text-muted-foreground">{customer.phone}</div>
                    </div>
                  ))}
                </div>
              )}

              {selectedCustomer && (
                <div className="mt-3 p-3 bg-accent rounded-md">
                  <div className="font-medium">Selected: {selectedCustomer.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedCustomer.phone}</div>
                </div>
              )}
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
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={formData.machine_category}
                onChange={(e) => setFormData({ ...formData, machine_category: e.target.value })}
                placeholder="e.g., Lawn Mower"
                required
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.machine_brand}
                onChange={(e) => setFormData({ ...formData, machine_brand: e.target.value })}
                placeholder="e.g., Honda"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.machine_model}
                onChange={(e) => setFormData({ ...formData, machine_model: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="serial">Serial Number</Label>
              <Input
                id="serial"
                value={formData.machine_serial}
                onChange={(e) => setFormData({ ...formData, machine_serial: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="problem">Problem Description</Label>
              <Input
                id="problem"
                value={formData.problem_description}
                onChange={(e) => setFormData({ ...formData, problem_description: e.target.value })}
                placeholder="Test from clean system"
              />
            </div>
          </CardContent>
        </Card>

        {/* Create Button */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSaving || !selectedCustomer}
            className="flex-1"
          >
            {isSaving ? 'Creating...' : 'Create Job'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/jobs-simple')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
