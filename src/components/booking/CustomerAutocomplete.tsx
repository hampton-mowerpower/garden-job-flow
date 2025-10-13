import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, User, Loader2 } from 'lucide-react';
import { cn, toTitleCase } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
  customerType?: 'commercial' | 'domestic';
  companyName?: string;
  customer_type?: 'commercial' | 'domestic'; // DB field name
  company_name?: string; // DB field name
}

interface CustomerAutocompleteProps {
  customer: Partial<Customer>;
  onCustomerChange: (customer: Partial<Customer>) => void;
  onCustomerSelect?: (customer: Customer) => void;
}

export const CustomerAutocomplete: React.FC<CustomerAutocompleteProps> = ({
  customer,
  onCustomerChange,
  onCustomerSelect
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [duplicates, setDuplicates] = useState<Customer[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [pendingCustomer, setPendingCustomer] = useState<Partial<Customer> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 250);

  // Search customers using the database function
  const searchCustomers = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('fn_search_customers', {
        search_query: query,
        limit_count: 50,
        offset_count: 0
      });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error searching customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to search customers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load customers on mount and when search changes
  useEffect(() => {
    searchCustomers(debouncedSearch);
  }, [debouncedSearch, searchCustomers]);

  // Detect duplicates when customer data changes
  useEffect(() => {
    if (customer.name || customer.phone || customer.email) {
      checkForDuplicates(customer);
    }
  }, [customer.name, customer.phone, customer.email]);

  const checkForDuplicates = (customerData: Partial<Customer>) => {
    const matches = customers.filter(c => {
      // Exact phone or email match
      if (customerData.phone && c.phone === customerData.phone) return true;
      if (customerData.email && c.email === customerData.email) return true;
      
      // High similarity name + address
      if (customerData.name && customerData.address) {
        const nameSimilar = c.name.toLowerCase().includes(customerData.name.toLowerCase()) ||
                           customerData.name.toLowerCase().includes(c.name.toLowerCase());
        const addressSimilar = c.address.toLowerCase().includes(customerData.address.toLowerCase()) ||
                              customerData.address.toLowerCase().includes(c.address.toLowerCase());
        if (nameSimilar && addressSimilar) return true;
      }
      
      return false;
    });

    if (matches.length > 0) {
      setDuplicates(matches);
    } else {
      setDuplicates([]);
    }
  };

  const handleCustomerSelect = (selectedCustomer: Customer) => {
    // Use data directly from search results which now includes customer_type and company_name
    onCustomerChange({
      id: selectedCustomer.id,
      name: selectedCustomer.name,
      phone: selectedCustomer.phone,
      email: selectedCustomer.email || '',
      address: selectedCustomer.address,
      notes: selectedCustomer.notes || '',
      customerType: selectedCustomer.customer_type || selectedCustomer.customerType || 'domestic',
      companyName: selectedCustomer.company_name || selectedCustomer.companyName || ''
    });
    
    if (onCustomerSelect) {
      onCustomerSelect(selectedCustomer);
    }
    
    setOpen(false);
  };

  const handleUseExisting = async (existingCustomer: Customer) => {
    try {
      // Log audit action
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('customer_audit').insert([{
        action: 'USE_EXISTING',
        old_customer_id: existingCustomer.id,
        performed_by: user?.id,
        details: { customer: pendingCustomer } as any
      }]);

      handleCustomerSelect(existingCustomer);
      setShowDuplicateDialog(false);
      toast({
        title: "Using Existing Customer",
        description: `Selected ${existingCustomer.name}`
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  };

  const handleKeepNew = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('customer_audit').insert([{
        action: 'KEEP_NEW',
        performed_by: user?.id,
        details: { customer: pendingCustomer, duplicates } as any
      }]);

      setShowDuplicateDialog(false);
      toast({
        title: "Keeping New Customer",
        description: "New customer record will be created"
      });
    } catch (error) {
      console.error('Error logging audit:', error);
    }
  };

  const handleSaveWithDuplicateCheck = () => {
    if (duplicates.length > 0 && !customer.id) {
      setPendingCustomer(customer);
      setShowDuplicateDialog(true);
    }
  };

  // Use searched customers directly
  const displayCustomers = customers;

  return (
    <>
      <div className="space-y-4">
        {/* Customer Autocomplete Selector */}
        <div className="space-y-2">
          <Label>Quick Select Existing Customer</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                <User className="mr-2 h-4 w-4" />
                {customer.id && customer.name ? customer.name : "Select customer..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search customers..." 
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  {loading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Searching...</span>
                    </div>
                  ) : displayCustomers.length === 0 ? (
                    <CommandEmpty>No customers found.</CommandEmpty>
                  ) : null}
                  <CommandGroup>
                    {displayCustomers.map((c) => (
                      <CommandItem
                        key={c.id}
                        value={c.name}
                        onSelect={() => handleCustomerSelect(c)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            customer.id === c.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{c.name}</span>
                            {(c.customer_type === 'commercial' || c.customerType === 'commercial') && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">🏢</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{c.phone}</span>
                          {(c.company_name || c.companyName) && (
                            <span className="text-xs text-muted-foreground italic">{c.company_name || c.companyName}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Duplicate Warning */}
        {duplicates.length > 0 && !customer.id && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm font-medium text-yellow-800">
              ⚠️ Possible duplicate customer detected
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              {duplicates.length} similar customer(s) found. Review on save.
            </p>
          </div>
        )}

        {/* Manual Entry Fields */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="customer-name">Customer Name *</Label>
            <Input
              id="customer-name"
              value={customer.name || ''}
              onChange={(e) => onCustomerChange({ ...customer, name: e.target.value })}
              onBlur={(e) => {
                const formatted = toTitleCase(e.target.value);
                if (formatted !== e.target.value) {
                  onCustomerChange({ ...customer, name: formatted });
                }
                handleSaveWithDuplicateCheck();
              }}
              required
            />
          </div>

          <div>
            <Label htmlFor="customer-phone">Phone *</Label>
            <Input
              id="customer-phone"
              type="tel"
              value={customer.phone || ''}
              onChange={(e) => onCustomerChange({ ...customer, phone: e.target.value })}
              onBlur={handleSaveWithDuplicateCheck}
              required
            />
          </div>

          <div>
            <Label htmlFor="customer-email">Email</Label>
            <Input
              id="customer-email"
              type="email"
              value={customer.email || ''}
              onChange={(e) => onCustomerChange({ ...customer, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="customer-address">Address</Label>
            <Input
              id="customer-address"
              value={customer.address || ''}
              onChange={(e) => onCustomerChange({ ...customer, address: e.target.value })}
              onBlur={(e) => {
                const formatted = toTitleCase(e.target.value);
                if (formatted !== e.target.value) {
                  onCustomerChange({ ...customer, address: formatted });
                }
              }}
            />
          </div>

          <div>
            <Label htmlFor="customer-notes">Notes</Label>
            <Input
              id="customer-notes"
              value={customer.notes || ''}
              onChange={(e) => onCustomerChange({ ...customer, notes: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Duplicate Detection Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate Customer Detected</AlertDialogTitle>
            <AlertDialogDescription>
              We found {duplicates.length} similar customer(s). What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {duplicates.map((dup) => (
              <div key={dup.id} className="border rounded p-2 space-y-1">
                <p className="font-medium">{dup.name}</p>
                <p className="text-sm text-muted-foreground">{dup.phone}</p>
                {dup.email && <p className="text-xs">{dup.email}</p>}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUseExisting(dup)}
                  className="mt-1"
                >
                  Use This Customer
                </Button>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepNew}>
              Keep New Customer
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
