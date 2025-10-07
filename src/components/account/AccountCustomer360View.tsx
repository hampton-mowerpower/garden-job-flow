import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  User, 
  Wrench, 
  FileText, 
  CreditCard, 
  Bell,
  Package,
  Edit2,
  Save,
  X,
  Mail,
  Clock,
  Archive,
  Trash2
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface AccountCustomer {
  id: string;
  name: string;
  emails: string[];
  phone: string | null;
  default_payment_terms: string;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface AccountCustomer360ViewProps {
  customer: AccountCustomer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export const AccountCustomer360View: React.FC<AccountCustomer360ViewProps> = ({
  customer,
  open,
  onOpenChange,
  onUpdated
}) => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedCustomer, setEditedCustomer] = useState<Partial<AccountCustomer>>({});
  
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalSpent: 0,
    openBalance: 0,
    lastVisit: null as Date | null
  });

  useEffect(() => {
    if (customer && open) {
      loadCustomerData();
      setEditedCustomer(customer);
    }
  }, [customer, open]);

  const loadCustomerData = async () => {
    if (!customer) return;
    
    setLoading(true);
    try {
      // Load jobs linked to this account customer
      const { data: jobsData } = await supabase
        .from('jobs_db')
        .select('*')
        .eq('account_customer_id', customer.id)
        .order('created_at', { ascending: false });

      setJobs(jobsData || []);

      // Calculate stats
      const totalSpent = jobsData?.reduce((sum, job) => sum + (job.grand_total || 0), 0) || 0;
      const openBalance = jobsData?.reduce((sum, job) => sum + (job.balance_due || 0), 0) || 0;
      const lastVisit = jobsData?.[0]?.created_at ? new Date(jobsData[0].created_at) : null;
      
      setStats({
        totalJobs: jobsData?.length || 0,
        totalSpent,
        openBalance,
        lastVisit
      });

      // Extract unique machines
      const uniqueMachines = new Map();
      jobsData?.forEach(job => {
        const key = `${job.machine_brand}-${job.machine_model}-${job.machine_serial || 'no-serial'}`;
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

      // Load payments
      const jobIds = jobsData?.map(j => j.id) || [];
      if (jobIds.length > 0) {
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .in('job_id', jobIds)
          .order('paid_at', { ascending: false });
        setPayments(paymentsData || []);
      }

      // Load reminders
      const { data: remindersData } = await supabase
        .from('service_reminders')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      setReminders(remindersData || []);

      // Quotes would be loaded here if we had a quotes table
      setQuotes([]);

    } catch (error) {
      console.error('Error loading customer data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customer data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!customer || !editedCustomer.name) return;

    try {
      const { error } = await supabase
        .from('account_customers')
        .update({
          name: editedCustomer.name,
          emails: editedCustomer.emails || [],
          phone: editedCustomer.phone,
          default_payment_terms: editedCustomer.default_payment_terms,
          notes: editedCustomer.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id);

      if (error) throw error;

      toast({ title: 'Customer updated successfully' });
      setEditing(false);
      onUpdated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleArchive = async () => {
    if (!customer) return;

    try {
      const { error } = await supabase
        .from('account_customers')
        .update({ active: false })
        .eq('id', customer.id);

      if (error) throw error;

      toast({ title: 'Customer archived' });
      onOpenChange(false);
      onUpdated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    if (!customer) return;

    // Check if customer has linked records
    if (stats.totalJobs > 0) {
      toast({
        title: 'Cannot delete',
        description: 'Customer has linked jobs. Archive instead.',
        variant: 'destructive'
      });
      setShowDeleteDialog(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('account_customers')
        .delete()
        .eq('id', customer.id);

      if (error) throw error;

      toast({ title: 'Customer deleted' });
      setShowDeleteDialog(false);
      onOpenChange(false);
      onUpdated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (!customer) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {editing ? 'Edit Customer' : customer.name}
              </div>
              <div className="flex gap-2">
                {editing ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Overview / Edit Form */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing ? (
                  <>
                    <div>
                      <Label>Business Name *</Label>
                      <Input
                        value={editedCustomer.name || ''}
                        onChange={(e) => setEditedCustomer({ ...editedCustomer, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Email Addresses (comma-separated)</Label>
                      <Input
                        value={editedCustomer.emails?.join(', ') || ''}
                        onChange={(e) => setEditedCustomer({
                          ...editedCustomer,
                          emails: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={editedCustomer.phone || ''}
                        onChange={(e) => setEditedCustomer({ ...editedCustomer, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Payment Terms</Label>
                      <Input
                        value={editedCustomer.default_payment_terms || ''}
                        onChange={(e) => setEditedCustomer({ ...editedCustomer, default_payment_terms: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        value={editedCustomer.notes || ''}
                        onChange={(e) => setEditedCustomer({ ...editedCustomer, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Jobs</p>
                        <p className="text-2xl font-bold">{stats.totalJobs}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                        <p className="text-2xl font-bold">${stats.totalSpent.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Open Balance</p>
                        <p className="text-2xl font-bold text-orange-600">${stats.openBalance.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Visit</p>
                        <p className="font-medium">
                          {stats.lastVisit ? format(stats.lastVisit, 'PP') : 'Never'}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Contact</p>
                        {customer.emails.length > 0 && (
                          <p className="font-medium">{customer.emails.join(', ')}</p>
                        )}
                        {customer.phone && <p className="text-sm">{customer.phone}</p>}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Terms</p>
                        <p className="font-medium">{customer.default_payment_terms}</p>
                      </div>
                      {customer.notes && (
                        <div>
                          <p className="text-sm text-muted-foreground">Notes</p>
                          <p className="text-sm">{customer.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={handleArchive}>
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Tabs for History */}
            <Tabs defaultValue="jobs" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
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
                <TabsTrigger value="payments">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payments
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

              <TabsContent value="payments" className="space-y-3">
                {payments.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">No payments found</p>
                ) : (
                  payments.map(payment => (
                    <Card key={payment.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{payment.payment_method}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(payment.paid_at), 'PP')}
                            </p>
                            {payment.reference && (
                              <p className="text-xs">Ref: {payment.reference}</p>
                            )}
                          </div>
                          <p className="font-medium">${payment.amount?.toFixed(2)}</p>
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
                  reminders.map(reminder => (
                    <Card key={reminder.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium capitalize">{reminder.reminder_type.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(reminder.reminder_date), 'PP')}
                            </p>
                            {reminder.message && (
                              <p className="text-xs mt-1">{reminder.message}</p>
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
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              {stats.totalJobs > 0
                ? 'This customer has linked jobs and cannot be deleted. Archive instead to hide from new selections while preserving history.'
                : 'This will permanently delete the customer. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {stats.totalJobs === 0 && (
              <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                Delete
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
