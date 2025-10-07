import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputTranslated } from '@/components/ui/input-translated';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Mail, Calendar, Trash2, Edit, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import { CustomerEdit } from './CustomerEdit';
import { CustomerProfile } from './CustomerProfile';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
  created_at: string;
}

interface Reminder {
  id: string;
  reminder_type: 'service_due' | 'collection_ready';
  reminder_date: string;
  status: string;
  message?: string;
}

export function CustomerManager() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [reminderType, setReminderType] = useState<'service_due' | 'collection_ready'>('service_due');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers_db')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: t('msg.error'),
        description: 'Failed to load customers',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSendReminder = async () => {
    if (!selectedCustomer) return;

    if (!reminderDate) {
      toast({
        title: t('msg.validation'),
        description: t('reminder.date.required'),
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('service_reminders')
        .insert({
          customer_id: selectedCustomer.id,
          reminder_type: reminderType,
          reminder_date: reminderDate,
          contact_email: selectedCustomer.email,
          contact_phone: selectedCustomer.phone,
          message: reminderMessage,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Send email reminder immediately if email exists
      if (selectedCustomer.email) {
        const { error: emailError } = await supabase.functions.invoke('send-reminder', {
          body: {
            reminderId: data.id,
            customerEmail: selectedCustomer.email,
            customerName: selectedCustomer.name,
            reminderType,
            message: reminderMessage
          }
        });

        if (emailError) {
          console.error('Email sending error:', emailError);
        }
      }

      toast({
        title: t('msg.success'),
        description: t('reminder.scheduled')
      });

      setShowReminderDialog(false);
      setReminderMessage('');
      setReminderDate('');
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: t('msg.error'),
        description: t('reminder.failed'),
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('customer.management')}</h2>
          <p className="text-muted-foreground">{t('customer.manage')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p>{t('common.loading')}</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{t('customer.none')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('customer.name')}</TableHead>
                  <TableHead>{t('customer.phone')}</TableHead>
                  <TableHead>{t('customer.email')}</TableHead>
                  <TableHead>{t('customer.address')}</TableHead>
                  <TableHead>{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate">{customer.address}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowProfileDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowReminderDialog(true);
                          }}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          {t('reminder.send')}
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

      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('reminder.schedule')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('customer.name')}</Label>
              <Input value={selectedCustomer?.name || ''} disabled />
            </div>
            <div>
              <Label>{t('reminder.type')}</Label>
              <select
                className="w-full px-3 py-2 border rounded-md"
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value as any)}
              >
                <option value="service_due">{t('reminder.service')}</option>
                <option value="collection_ready">{t('reminder.collection')}</option>
              </select>
            </div>
            <div>
              <Label>{t('reminder.date')}</Label>
              <Input
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
            </div>
            <div>
              <Label>{t('reminder.message')}</Label>
              <InputTranslated
                value={reminderMessage}
                onChange={setReminderMessage}
                placeholder={t('reminder.message.placeholder')}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReminderDialog(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSendReminder}>
                <Calendar className="w-4 h-4 mr-2" />
                {t('reminder.schedule')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CustomerEdit
        customer={selectedCustomer}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSaved={() => {
          loadCustomers();
          setShowEditDialog(false);
        }}
      />

      <CustomerProfile
        customer={selectedCustomer}
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
      />
    </div>
  );
}
