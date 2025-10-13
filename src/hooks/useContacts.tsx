import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Contact {
  id: string;
  account_id?: string;
  first_name: string;
  last_name?: string;
  full_name?: string;
  name_norm?: string;
  email?: string;
  email_lower?: string;
  phone?: string;
  phone_e164?: string;
  address?: string;
  suburb?: string;
  postcode?: string;
  notes?: string;
  customer_type?: 'domestic' | 'commercial';
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useContacts = (accountId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', accountId],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('active', true);

      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query.order('first_name');

      if (error) throw error;
      return data as Contact[];
    },
  });

  const createContact = useMutation({
    mutationFn: async (contact: Partial<Contact>) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert([contact])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', data.account_id] });
      toast({
        title: 'Success',
        description: 'Contact created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create contact',
        variant: 'destructive',
      });
    },
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contact> & { id: string }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', data.account_id] });
      toast({
        title: 'Success',
        description: 'Contact updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update contact',
        variant: 'destructive',
      });
    },
  });

  return {
    contacts,
    isLoading,
    createContact: createContact.mutateAsync,
    updateContact: updateContact.mutateAsync,
  };
};
