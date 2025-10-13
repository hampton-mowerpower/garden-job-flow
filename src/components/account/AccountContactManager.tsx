import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, User, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Account {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  account_id: string | null;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
}

export function AccountContactManager() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // New contact form state
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccountId) {
      loadContacts(selectedAccountId);
    }
  }, [selectedAccountId]);

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      console.error('Error loading accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load accounts',
        variant: 'destructive',
      });
    }
  };

  const loadContacts = async (accountId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('account_id', accountId)
        .eq('active', true)
        .order('full_name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error('Error loading contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contacts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!selectedAccountId || !newContact.firstName) {
      toast({
        title: 'Validation Error',
        description: 'Please select an account and enter at least a first name',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const fullName = `${newContact.firstName} ${newContact.lastName}`.trim();
      
      const { error } = await supabase
        .from('contacts')
        .insert({
          account_id: selectedAccountId,
          first_name: newContact.firstName,
          last_name: newContact.lastName,
          full_name: fullName,
          phone: newContact.phone || null,
          email: newContact.email || null,
          active: true,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Contact ${fullName} added successfully`,
      });

      // Reset form and reload
      setNewContact({ firstName: '', lastName: '', phone: '', email: '' });
      setShowAddContactDialog(false);
      loadContacts(selectedAccountId);
    } catch (error: any) {
      console.error('Error adding contact:', error);
      toast({
        title: 'Error',
        description: 'Failed to add contact',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Account Contact Manager
          </CardTitle>
          <CardDescription>
            Manage contacts for commercial accounts. Each account can have multiple contacts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Selector */}
          <div className="space-y-2">
            <Label>Select Account</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an account..." />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contacts List */}
          {selectedAccountId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base">Contacts</Label>
                <Button
                  size="sm"
                  onClick={() => setShowAddContactDialog(true)}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Contact
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No contacts yet. Add one above.
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map(contact => (
                    <Card key={contact.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">{contact.full_name}</p>
                            {contact.phone && (
                              <p className="text-sm text-muted-foreground">{contact.phone}</p>
                            )}
                            {contact.email && (
                              <p className="text-sm text-muted-foreground">{contact.email}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Contact Dialog */}
      <Dialog open={showAddContactDialog} onOpenChange={setShowAddContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Add a new person to {accounts.find(a => a.id === selectedAccountId)?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={newContact.firstName}
                onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                placeholder="John"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={newContact.lastName}
                onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                placeholder="Smith"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="0400 000 000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddContactDialog(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button onClick={handleAddContact} disabled={loading}>
              {loading ? 'Adding...' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
