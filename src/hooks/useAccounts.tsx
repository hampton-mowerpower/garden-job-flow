import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Account {
  id: string;
  name: string;
  name_norm?: string;
  abn?: string;
  billing_address?: string;
  phone?: string;
  email?: string;
  notes?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useAccounts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as Account[];
    },
  });

  const createAccount = useMutation({
    mutationFn: async (account: Partial<Account>) => {
      const { data, error } = await supabase
        .from('accounts')
        .insert([account])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({
        title: 'Success',
        description: 'Account created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Account> & { id: string }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({
        title: 'Success',
        description: 'Account updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update account',
        variant: 'destructive',
      });
    },
  });

  return {
    accounts,
    isLoading,
    createAccount: createAccount.mutateAsync,
    updateAccount: updateAccount.mutateAsync,
  };
};
