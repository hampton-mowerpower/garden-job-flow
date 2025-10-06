import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Mail, MessageSquare, FileText, Clock, Search } from 'lucide-react';

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

export function AccountCustomersManager() {
  const [customers, setCustomers] = useState<AccountCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<Partial<AccountCustomer> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('account_customers')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setCustomers((data || []) as AccountCustomer[]);
    } catch (error: any) {
      toast({
        title: 'Error loading account customers',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editingCustomer?.name) {
      toast({
        title: 'Name required',
        description: 'Please enter a customer name',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingCustomer.id) {
        const { error } = await supabase
          .from('account_customers')
          .update(editingCustomer)
          .eq('id', editingCustomer.id);

        if (error) throw error;
        toast({ title: 'Account customer updated' });
      } else {
        const { error } = await supabase
          .from('account_customers')
          .insert([{
            name: editingCustomer.name,
            emails: editingCustomer.emails || [],
            phone: editingCustomer.phone || null,
            default_payment_terms: editingCustomer.default_payment_terms || '30 days',
            notes: editingCustomer.notes || null,
            active: true
          }]);

        if (error) throw error;
        toast({ title: 'Account customer created' });
      }

      setDialogOpen(false);
      setEditingCustomer(null);
      loadCustomers();
    } catch (error: any) {
      toast({
        title: 'Error saving account customer',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (customer?: AccountCustomer) => {
    setEditingCustomer(customer || {
      name: '',
      emails: [],
      phone: '',
      default_payment_terms: '30 days',
      notes: '',
      active: true
    });
    setDialogOpen(true);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.emails.some(e => e.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Account Customers</h2>
          <p className="text-muted-foreground">
            Manage customers with payment terms and track service history
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openEditDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Account Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer?.id ? 'Edit Account Customer' : 'Add New Account Customer'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={editingCustomer?.name || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  placeholder="e.g., Acme Landscaping Pty Ltd"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="emails">Email Addresses (comma-separated)</Label>
                <Input
                  id="emails"
                  value={editingCustomer?.emails?.join(', ') || ''}
                  onChange={(e) => setEditingCustomer({
                    ...editingCustomer,
                    emails: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  })}
                  placeholder="billing@acme.com, accounts@acme.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={editingCustomer?.phone || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                  placeholder="(03) 9000 0000"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="terms">Default Payment Terms</Label>
                <Input
                  id="terms"
                  value={editingCustomer?.default_payment_terms || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, default_payment_terms: e.target.value })}
                  placeholder="30 days"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editingCustomer?.notes || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  placeholder="Special instructions, billing preferences, etc."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No customers match your search' : 'No account customers yet'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Payment Terms</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {customer.emails.length > 0 && (
                          <div>{customer.emails[0]}</div>
                        )}
                        {customer.phone && (
                          <div className="text-muted-foreground">{customer.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{customer.default_payment_terms}</TableCell>
                    <TableCell>
                      <Badge variant={customer.active ? 'default' : 'secondary'}>
                        {customer.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Send reminder"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Send collection notice"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Send statement"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}