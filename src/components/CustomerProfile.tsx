import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  User, 
  Wrench, 
  FileText, 
  CreditCard, 
  Bell,
  Package
} from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  suburb?: string;
  postcode?: string;
  notes?: string;
  created_at: string;
}

interface CustomerProfileProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customer,
  open,
  onOpenChange
}) => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalSpent: 0,
    lastVisit: null as Date | null
  });

  useEffect(() => {
    if (customer && open) {
      loadCustomerHistory();
    }
  }, [customer, open]);

  const loadCustomerHistory = async () => {
    if (!customer) return;
    
    setLoading(true);
    try {
      // Load jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs_db')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      // Calculate stats
      const totalSpent = jobsData?.reduce((sum, job) => sum + (job.grand_total || 0), 0) || 0;
      const lastVisit = jobsData?.[0]?.created_at ? new Date(jobsData[0].created_at) : null;
      
      setStats({
        totalJobs: jobsData?.length || 0,
        totalSpent,
        lastVisit
      });

      // Extract unique machines from jobs
      const uniqueMachines = new Map();
      jobsData?.forEach(job => {
        const key = `${job.machine_brand}-${job.machine_model}-${job.machine_serial}`;
        if (!uniqueMachines.has(key)) {
          uniqueMachines.set(key, {
            category: job.machine_category,
            brand: job.machine_brand,
            model: job.machine_model,
            serial: job.machine_serial,
            firstSeen: job.created_at,
            lastSeen: job.created_at,
            serviceCount: 1
          });
        } else {
          const machine = uniqueMachines.get(key);
          machine.serviceCount++;
          machine.lastSeen = job.created_at;
        }
      });
      setMachines(Array.from(uniqueMachines.values()));

      // Load invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      setInvoices(invoicesData || []);

      // Load payments for this customer's jobs
      const jobIds = jobsData?.map(j => j.id) || [];
      if (jobIds.length > 0) {
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .in('job_id', jobIds)
          .order('paid_at', { ascending: false });
        setPayments(paymentsData || []);
      } else {
        setPayments([]);
      }

      // Load reminders
      const { data: remindersData } = await supabase
        .from('service_reminders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      setReminders(remindersData || []);

    } catch (error) {
      console.error('Error loading customer history:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customer history',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {customer.name}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Overview Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold">{stats.totalJobs}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">
                    ${stats.totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Visit</p>
                <p className="font-medium">
                  {stats.lastVisit ? format(stats.lastVisit, 'PP') : 'Never'}
                </p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium">{customer.phone}</p>
                {customer.email && <p className="text-sm">{customer.email}</p>}
              </div>
              {customer.address && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">{customer.address}</p>
                  {customer.suburb && <p className="text-sm">{customer.suburb} {customer.postcode}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs for History */}
          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="jobs">
                <Wrench className="w-4 h-4 mr-2" />
                Jobs
              </TabsTrigger>
              <TabsTrigger value="machines">
                <Package className="w-4 h-4 mr-2" />
                Machines
              </TabsTrigger>
              <TabsTrigger value="invoices">
                <FileText className="w-4 h-4 mr-2" />
                Invoices
              </TabsTrigger>
              <TabsTrigger value="reminders">
                <Bell className="w-4 h-4 mr-2" />
                Reminders
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jobs" className="space-y-3">
              {loading ? (
                <p className="text-center py-4">Loading...</p>
              ) : jobs.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No jobs found</p>
              ) : (
                jobs.map(job => (
                  <Card key={job.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{job.job_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {job.machine_category} - {job.machine_brand} {job.machine_model}
                          </p>
                          <p className="text-xs mt-1">{job.problem_description}</p>
                        </div>
                        <Badge variant={
                          job.status === 'completed' ? 'default' :
                          job.status === 'in-progress' ? 'secondary' : 'outline'
                        }>
                          {job.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(job.created_at), 'PP')}
                        </span>
                        <span className="font-medium">${job.grand_total?.toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="machines" className="space-y-3">
              {machines.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No machines found</p>
              ) : (
                machines.map((machine, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <p className="font-medium">{machine.brand} {machine.model}</p>
                          <Badge>{machine.serviceCount} services</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{machine.category}</p>
                        {machine.serial && (
                          <p className="text-xs">Serial: {machine.serial}</p>
                        )}
                        <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                          <span>First: {format(new Date(machine.firstSeen), 'PP')}</span>
                          <span>Last: {format(new Date(machine.lastSeen), 'PP')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="invoices" className="space-y-3">
              {invoices.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No invoices found</p>
              ) : (
                invoices.map(invoice => (
                  <Card key={invoice.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{invoice.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(invoice.created_at), 'PP')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${invoice.total?.toFixed(2)}</p>
                          <Badge variant={invoice.status === 'PAID' ? 'default' : 'secondary'}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="reminders" className="space-y-3">
              {reminders.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">No reminders found</p>
              ) : (
                reminders.map(reminder => {
                  const reminderDate = new Date(reminder.reminder_date);
                  const today = new Date();
                  const daysRemaining = Math.ceil((reminderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <Card key={reminder.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">
                                {reminder.machine_category && `${reminder.machine_category} - `}
                                {reminder.machine_brand} {reminder.machine_model}
                              </p>
                              {reminder.machine_serial && (
                                <span className="text-xs text-muted-foreground">
                                  S/N: {reminder.machine_serial}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Next Service: {format(reminderDate, 'PP')}
                            </p>
                            {reminder.status === 'pending' && daysRemaining > 0 && (
                              <p className="text-sm font-medium text-primary mt-1">
                                📅 {daysRemaining} days remaining
                              </p>
                            )}
                            {reminder.status === 'pending' && daysRemaining <= 0 && (
                              <p className="text-sm font-medium text-red-600 mt-1">
                                ⚠️ Service overdue by {Math.abs(daysRemaining)} days
                              </p>
                            )}
                            {reminder.status === 'sent' && reminder.sent_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Sent: {format(new Date(reminder.sent_at), 'PP')}
                              </p>
                            )}
                            {reminder.error_message && (
                              <p className="text-xs text-red-600 mt-1">
                                Error: {reminder.error_message}
                              </p>
                            )}
                          </div>
                          <Badge variant={
                            reminder.status === 'sent' ? 'default' :
                            reminder.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {reminder.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};
