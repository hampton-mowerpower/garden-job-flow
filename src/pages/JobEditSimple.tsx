import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface JobDetail {
  job: any;
  customer: any;
  parts: any[];
}

export default function JobEditSimple() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [machineCategory, setMachineCategory] = useState('');
  const [machineBrand, setMachineBrand] = useState('');
  const [machineModel, setMachineModel] = useState('');
  const [machineSerial, setMachineSerial] = useState('');
  const [problemDescription, setProblemDescription] = useState('');

  // New part form
  const [newPartSku, setNewPartSku] = useState('');
  const [newPartDesc, setNewPartDesc] = useState('');
  const [newPartQty, setNewPartQty] = useState('1');
  const [newPartPrice, setNewPartPrice] = useState('0');

  useEffect(() => {
    if (id) loadJob();
  }, [id]);

  async function loadJob() {
    console.log('🔵 Fetching job for edit:', id);
    setLoading(true);

    const { data, error: rpcError } = await supabase.rpc('get_job_detail_simple', {
      p_job_id: id,
    });

    if (rpcError) {
      console.error('❌ Error fetching job:', rpcError);
      toast.error(`Failed to load job: ${rpcError.message}`);
      setLoading(false);
      return;
    }

    console.log('✅ Job data loaded for edit:', data);
    setJobData(data);
    
    // Populate form
    const { job } = data;
    setMachineCategory(job.machine_category || '');
    setMachineBrand(job.machine_brand || '');
    setMachineModel(job.machine_model || '');
    setMachineSerial(job.machine_serial || '');
    setProblemDescription(job.problem_description || '');
    
    setLoading(false);
  }

  async function saveJob() {
    console.log('🔵 Saving job changes...');
    setSaving(true);

    const { error } = await supabase
      .from('jobs_db')
      .update({
        machine_category: machineCategory,
        machine_brand: machineBrand,
        machine_model: machineModel,
        machine_serial: machineSerial,
        problem_description: problemDescription,
      })
      .eq('id', id);

    if (error) {
      console.error('❌ Error saving job:', error);
      toast.error(`Failed to save: ${error.message}`);
      setSaving(false);
      return;
    }

    console.log('✅ Job saved successfully');
    toast.success('Job updated');
    setSaving(false);
    navigate(`/jobs-simple/${id}`);
  }

  async function addPart() {
    console.log('🔵 Adding part...');
    
    const { error } = await supabase.rpc('add_job_part', {
      p_job_id: id,
      p_sku: newPartSku,
      p_desc: newPartDesc,
      p_qty: parseFloat(newPartQty),
      p_unit_price: parseFloat(newPartPrice),
    });

    if (error) {
      console.error('❌ Error adding part:', error);
      toast.error(`Failed to add part: ${error.message}`);
      return;
    }

    console.log('✅ Part added successfully');
    toast.success('Part added');
    
    // Reset form
    setNewPartSku('');
    setNewPartDesc('');
    setNewPartQty('1');
    setNewPartPrice('0');
    
    // Reload
    loadJob();
  }

  async function deletePart(partId: string) {
    console.log('🔵 Deleting part:', partId);
    
    const { error } = await supabase.rpc('delete_job_part', {
      p_part_id: partId,
    });

    if (error) {
      console.error('❌ Error deleting part:', error);
      toast.error(`Failed to delete part: ${error.message}`);
      return;
    }

    console.log('✅ Part deleted successfully');
    toast.success('Part deleted');
    loadJob();
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!jobData) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
          Job not found
        </div>
      </div>
    );
  }

  const { job, customer, parts } = jobData;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate(`/jobs-simple/${id}`)}>
          ← Back to Job
        </Button>
        <h1 className="text-3xl font-bold mt-2">Edit Job {job.job_number}</h1>
      </div>

      <div className="space-y-6">
        {/* Customer Info (Read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Customer (Read-only)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{customer?.name || 'No customer'}</p>
            {customer?.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
          </CardContent>
        </Card>

        {/* Machine Details (Editable) */}
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
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={machineBrand}
                onChange={(e) => setMachineBrand(e.target.value)}
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
              />
            </div>
          </CardContent>
        </Card>

        {/* Parts List */}
        <Card>
          <CardHeader>
            <CardTitle>Parts</CardTitle>
          </CardHeader>
          <CardContent>
            {parts && parts.length > 0 ? (
              <div className="space-y-2 mb-4">
                {parts.map((part: any) => (
                  <div key={part.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{part.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {part.sku} | Qty: {part.quantity} × ${part.unit_price}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePart(part.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mb-4">No parts added</p>
            )}

            <div className="border-t pt-4 space-y-3">
              <h4 className="font-medium">Add New Part</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="partSku">SKU</Label>
                  <Input
                    id="partSku"
                    value={newPartSku}
                    onChange={(e) => setNewPartSku(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="partDesc">Description</Label>
                  <Input
                    id="partDesc"
                    value={newPartDesc}
                    onChange={(e) => setNewPartDesc(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="partQty">Quantity</Label>
                  <Input
                    id="partQty"
                    type="number"
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="partPrice">Unit Price</Label>
                  <Input
                    id="partPrice"
                    type="number"
                    step="0.01"
                    value={newPartPrice}
                    onChange={(e) => setNewPartPrice(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={addPart} disabled={!newPartSku || !newPartDesc}>
                Add Part
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button onClick={saveJob} disabled={saving} className="flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={() => navigate(`/jobs-simple/${id}`)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
