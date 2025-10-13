import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Building2, User } from 'lucide-react';
import { useAccounts, Account } from '@/hooks/useAccounts';
import { useContacts, Contact } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';

interface AccountContactSelectorProps {
  accountId?: string;
  contactId?: string;
  onAccountChange: (accountId: string | undefined, account?: Account) => void;
  onContactChange: (contactId: string, contact: Contact) => void;
}

export function AccountContactSelector({
  accountId,
  contactId,
  onAccountChange,
  onContactChange,
}: AccountContactSelectorProps) {
  const [isCommercial, setIsCommercial] = useState(!!accountId);
  const [newAccountName, setNewAccountName] = useState('');
  const [newContactFirstName, setNewContactFirstName] = useState('');
  const [newContactLastName, setNewContactLastName] = useState('');

  const { accounts, createAccount } = useAccounts();
  const { contacts, createContact } = useContacts(accountId);

  useEffect(() => {
    if (!isCommercial) {
      onAccountChange(undefined);
    }
  }, [isCommercial]);

  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) return;

    try {
      const account = await createAccount({ name: newAccountName.trim() });
      onAccountChange(account.id, account);
      setNewAccountName('');
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  const handleCreateContact = async () => {
    if (!newContactFirstName.trim()) return;

    try {
      const contact = await createContact({
        account_id: accountId,
        first_name: newContactFirstName.trim(),
        last_name: newContactLastName.trim() || undefined,
        customer_type: isCommercial ? 'commercial' : 'domestic',
      });
      onContactChange(contact.id, contact);
      setNewContactFirstName('');
      setNewContactLastName('');
    } catch (error) {
      console.error('Failed to create contact:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Commercial/Domestic Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="commercial"
          checked={isCommercial}
          onCheckedChange={setIsCommercial}
        />
        <Label htmlFor="commercial">Commercial/Account Customer</Label>
      </div>

      {/* Account Selection (only if commercial) */}
      {isCommercial && (
        <div className="space-y-2">
          <Label htmlFor="account" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company/Account
          </Label>
          {accounts.length > 0 ? (
            <Select
              value={accountId}
              onValueChange={(value) => {
                const account = accounts.find((a) => a.id === value);
                onAccountChange(value, account);
              }}
            >
              <SelectTrigger id="account">
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter company name"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
              />
              <Button onClick={handleCreateAccount} size="sm">
                Create
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Contact Selection */}
      <div className="space-y-2">
        <Label htmlFor="contact" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Person/Contact
        </Label>
        {contacts.length > 0 && (!isCommercial || accountId) ? (
          <Select
            value={contactId}
            onValueChange={(value) => {
              const contact = contacts.find((c) => c.id === value);
              if (contact) onContactChange(value, contact);
            }}
          >
            <SelectTrigger id="contact">
              <SelectValue placeholder="Select contact" />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.full_name || contact.first_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                placeholder="First name"
                value={newContactFirstName}
                onChange={(e) => setNewContactFirstName(e.target.value)}
              />
              <Input
                placeholder="Last name"
                value={newContactLastName}
                onChange={(e) => setNewContactLastName(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateContact} size="sm" className="w-full">
              Create Contact
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
