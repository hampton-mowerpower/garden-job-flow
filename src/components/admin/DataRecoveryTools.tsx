import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, RefreshCw, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RecoveryTask {
  id: string;
  type: 'customer' | 'job' | 'data_link';
  status: 'pending' | 'completed' | 'failed';
  description: string;
  details?: any;
}

export function DataRecoveryTools() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [recoveryTasks, setRecoveryTasks] = useState<RecoveryTask[]>([]);
  const [loading, setLoading] = useState(false);

  const searchForMissingData = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search Term Required",
        description: "Enter a customer name, phone number, or job number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    const tasks: RecoveryTask[] = [];

    try {
      // Search in customer_change_audit for historical references
      const { data: auditData, error: auditError } = await supabase
        .from('customer_change_audit')
        .select('*')
        .or(`old_customer_name.ilike.%${searchTerm}%,new_customer_name.ilike.%${searchTerm}%,old_customer_phone.ilike.%${searchTerm}%,new_customer_phone.ilike.%${searchTerm}%,job_number.ilike.%${searchTerm}%`)
        .order('changed_at', { ascending: false })
        .limit(50);

      if (!auditError && auditData && auditData.length > 0) {
        auditData.forEach(audit => {
          // Check if the customer still exists
          tasks.push({
            id: audit.id,
            type: 'customer',
            status: 'pending',
            description: `Customer reference found in audit: ${audit.new_customer_name || audit.old_customer_name}`,
            details: audit
          });
        });
      }

      // Search for jobs with deleted customers
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs_db')
        .select(`
          id,
          job_number,
          customer_id,
          status,
          customers_db!inner(id, name, is_deleted)
        `)
        .eq('customers_db.is_deleted', true)
        .ilike('job_number', `%${searchTerm}%`)
        .is('deleted_at', null);

      if (!jobsError && jobsData && jobsData.length > 0) {
        jobsData.forEach((job: any) => {
          tasks.push({
            id: job.id,
            type: 'job',
            status: 'pending',
            description: `Job ${job.job_number} references deleted customer`,
            details: job
          });
        });
      }

      setRecoveryTasks(tasks);

      if (tasks.length === 0) {
        toast({
          title: "No Issues Found",
          description: `No data recovery tasks found for "${searchTerm}"`,
        });
      } else {
        toast({
          title: "Recovery Tasks Found",
          description: `Found ${tasks.length} potential recovery tasks`,
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search for missing data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const recoverLindsayJames = async () => {
    setLoading(true);
    try {
      // Check if Lindsay James already exists
      const { data: existing, error: searchError } = await supabase
        .from('customers_db')
        .select('id, name, phone')
        .or('name.ilike.%lindsay%james%,phone.like.%0403164291%')
        .eq('is_deleted', false)
        .limit(1);

      if (searchError) throw searchError;

      if (existing && existing.length > 0) {
        toast({
          title: "Customer Already Exists",
          description: `Lindsay James already exists in the database`,
        });
        return;
      }

      // Create Lindsay James customer
      const { data: newCustomer, error: createError } = await supabase
        .from('customers_db')
        .insert({
          name: 'Lindsay James',
          phone: '0403164291',
          address: '',
          is_deleted: false
        })
        .select()
        .single();

      if (createError) throw createError;

      // Now find Job 0065 and optionally link it
      const { data: job0065, error: jobError } = await supabase
        .from('jobs_db')
        .select('id, job_number, customer_id')
        .eq('job_number', 'JB2025-0065')
        .single();

      if (!jobError && job0065) {
        toast({
          title: "Customer Recovered Successfully",
          description: `Lindsay James has been recreated. Job ${job0065.job_number} can now be manually linked if needed.`,
        });
      } else {
        toast({
          title: "Customer Recovered",
          description: "Lindsay James customer has been recreated",
        });
      }

      // Refresh recovery tasks
      searchForMissingData();
    } catch (error: any) {
      console.error('Recovery error:', error);
      toast({
        title: "Recovery Failed",
        description: error.message || "Failed to recover Lindsay James customer",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Data Recovery Tools</span>
            <Badge variant="destructive">Admin Only</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These tools search for and recover missing or corrupted data. Use with caution and verify results before applying changes.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Quick Recovery Actions</h3>
              <Button onClick={recoverLindsayJames} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Recover Lindsay James (Job 0065)
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Search for Missing Data</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Customer name, phone, or job number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchForMissingData()}
                />
                <Button onClick={searchForMissingData} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {recoveryTasks.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-3">Recovery Tasks ({recoveryTasks.length})</h3>
                <div className="space-y-2">
                  {recoveryTasks.map(task => (
                    <Card key={task.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{task.type}</Badge>
                              {task.status === 'pending' && <Badge variant="secondary">Pending</Badge>}
                              {task.status === 'completed' && (
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              {task.status === 'failed' && <Badge variant="destructive">Failed</Badge>}
                            </div>
                            <p className="text-sm">{task.description}</p>
                            {task.details && (
                              <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                                {JSON.stringify(task.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
