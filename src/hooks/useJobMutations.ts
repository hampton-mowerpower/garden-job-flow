import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  updateJobStatus, 
  addJobPart, 
  updateJobPart, 
  deleteJobPart,
  addJobNote,
  upsertCustomer,
  deleteCustomer
} from '@/lib/api';
import { toast } from 'sonner';

// Job Status Mutation
export function useUpdateJobStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: string }) =>
      updateJobStatus(jobId, status),
    onSuccess: (data, variables) => {
      toast.success('Job status updated');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['job-detail', variables.jobId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update status: ${error.message}`);
      console.error('[useUpdateJobStatus] Error:', error);
    }
  });
}

// Add Job Part Mutation
export function useAddJobPart(jobId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (part: { sku: string; desc: string; qty: number; unit_price: number; part_id?: string }) =>
      addJobPart(jobId, part),
    onSuccess: () => {
      toast.success('Part added successfully');
      queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-detail', jobId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add part: ${error.message}`);
      console.error('[useAddJobPart] Error:', error);
    }
  });
}

// Update Job Part Mutation
export function useUpdateJobPart(jobId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ partId, part }: { 
      partId: string; 
      part: { sku: string; desc: string; qty: number; unit_price: number } 
    }) => updateJobPart(partId, part),
    onSuccess: () => {
      toast.success('Part updated successfully');
      queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-detail', jobId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update part: ${error.message}`);
      console.error('[useUpdateJobPart] Error:', error);
    }
  });
}

// Delete Job Part Mutation
export function useDeleteJobPart(jobId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (partId: string) => deleteJobPart(partId),
    onSuccess: () => {
      toast.success('Part deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-detail', jobId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete part: ${error.message}`);
      console.error('[useDeleteJobPart] Error:', error);
    }
  });
}

// Add Job Note Mutation
export function useAddJobNote(jobId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ noteText, userId }: { noteText: string; userId: string }) =>
      addJobNote(jobId, noteText, userId),
    onSuccess: () => {
      toast.success('Note added successfully');
      queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-detail', jobId] });
      queryClient.invalidateQueries({ queryKey: ['job-notes', jobId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add note: ${error.message}`);
      console.error('[useAddJobNote] Error:', error);
    }
  });
}

// Customer Mutations
export function useUpsertCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (customer: {
      id?: string;
      name: string;
      phone: string;
      email?: string;
      address?: string;
      suburb?: string;
      postcode?: string;
      company_name?: string;
      customer_type?: string;
    }) => upsertCustomer(customer),
    onSuccess: () => {
      toast.success('Customer saved successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to save customer: ${error.message}`);
      console.error('[useUpsertCustomer] Error:', error);
    }
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (customerId: string) => deleteCustomer(customerId),
    onSuccess: () => {
      toast.success('Customer deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete customer: ${error.message}`);
      console.error('[useDeleteCustomer] Error:', error);
    }
  });
}
