import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, Search, Edit, Eye, Building2, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CustomerEdit } from './CustomerEdit';
import { CustomerProfile } from './CustomerProfile';
import { Badge } from '@/components/ui/badge';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
  customer_type?: 'commercial' | 'domestic';
  company_name?: string;
  created_at: string;
}

export function CustomerManagerTabs() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'commercial' | 'domestic'>('all');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers_db')
        .select('*')
        .eq('is_deleted', false)
        .order('name');

      if (error) throw error;
      setCustomers(data as any || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter customers based on active tab and search
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'commercial' && customer.customer_type === 'commercial') ||
      (activeTab === 'domestic' && (customer.customer_type === 'domestic' || !customer.customer_type));

    return matchesSearch && matchesTab;
  });

  const commercialCount = customers.filter(c => c.customer_type === 'commercial').length;
  const domesticCount = customers.filter(c => c.customer_type === 'domestic' || !c.customer_type).length;

  const handleViewProfile = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowProfileDialog(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowEditDialog(true);
  };

  const handleSendReminder = (customer: Customer) => {
    // Open reminder dialog (existing functionality)
    toast({
      title: 'Reminder',
      description: 'Reminder functionality - to be integrated with existing system'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage customer information and reminders
          </p>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All Customers ({customers.length})
              </TabsTrigger>
              <TabsTrigger value="commercial">
                <Building2 className="w-4 h-4 mr-2" />
                Commercial ({commercialCount})
              </TabsTrigger>
              <TabsTrigger value="domestic">
                <Home className="w-4 h-4 mr-2" />
                Domestic ({domesticCount})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <CustomerTable
                customers={filteredCustomers}
                onViewProfile={handleViewProfile}
                onEdit={handleEdit}
                onSendReminder={handleSendReminder}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="commercial" className="mt-4">
              <CustomerTable
                customers={filteredCustomers}
                onViewProfile={handleViewProfile}
                onEdit={handleEdit}
                onSendReminder={handleSendReminder}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="domestic" className="mt-4">
              <CustomerTable
                customers={filteredCustomers}
                onViewProfile={handleViewProfile}
                onEdit={handleEdit}
                onSendReminder={handleSendReminder}
                isLoading={isLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CustomerEdit
        customer={selectedCustomer}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSaved={loadCustomers}
      />

      <CustomerProfile
        customer={selectedCustomer}
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
      />
    </div>
  );
}

// Customer Table Component
function CustomerTable({
  customers,
  onViewProfile,
  onEdit,
  onSendReminder,
  isLoading
}: {
  customers: Customer[];
  onViewProfile: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onSendReminder: (customer: Customer) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading customers...</div>;
  }

  if (customers.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No customers found</div>;
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Address</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-medium">
                <div>
                  {customer.name}
                  {customer.company_name && (
                    <div className="text-xs text-muted-foreground">{customer.company_name}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={customer.customer_type === 'commercial' ? 'default' : 'secondary'}>
                  {customer.customer_type === 'commercial' ? (
                    <>
                      <Building2 className="w-3 h-3 mr-1" />
                      Commercial
                    </>
                  ) : (
                    <>
                      <Home className="w-3 h-3 mr-1" />
                      Domestic
                    </>
                  )}
                </Badge>
              </TableCell>
              <TableCell>{customer.phone}</TableCell>
              <TableCell>{customer.email || '-'}</TableCell>
              <TableCell className="text-sm">{customer.address}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewProfile(customer)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(customer)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSendReminder(customer)}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Send Reminder
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
