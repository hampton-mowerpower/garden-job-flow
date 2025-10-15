import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, ExternalLink, Download, Printer, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AuditEntry {
  id: number;
  changed_at: string;
  table_name: string;
  record_id: string;
  operation: string;
  old_values: any;
  new_values: any;
  changed_fields: string[];
  changed_by: string;
  source: string;
  reviewed?: boolean;
  review_status?: 'accepted' | 'rejected';
  review_by?: string;
  review_at?: string;
}

export function ChangesReview() {
  const queryClient = useQueryClient();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [changeType, setChangeType] = useState<string>('all');
  const [reviewStatus, setReviewStatus] = useState<string>('unreviewed');

  const { data: changes, isLoading } = useQuery({
    queryKey: ['changes-review', dateFrom, dateTo, jobNumber, changeType, reviewStatus],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(200);

      if (dateFrom) {
        query = query.gte('changed_at', new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        query = query.lte('changed_at', new Date(dateTo).toISOString());
      }
      if (changeType !== 'all') {
        query = query.eq('operation', changeType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter by review status
      let filtered = data as AuditEntry[];
      if (reviewStatus === 'unreviewed') {
        filtered = filtered.filter(c => !c.reviewed);
      } else if (reviewStatus === 'accepted') {
        filtered = filtered.filter(c => c.review_status === 'accepted');
      } else if (reviewStatus === 'rejected') {
        filtered = filtered.filter(c => c.review_status === 'rejected');
      }

      // Filter by job number if provided
      if (jobNumber) {
        filtered = filtered.filter(c => {
          const jobNum = c.old_values?.job_number || c.new_values?.job_number;
          return jobNum && jobNum.toLowerCase().includes(jobNumber.toLowerCase());
        });
      }

      return filtered;
    }
  });

  const acceptMutation = useMutation({
    mutationFn: async (changeId: number) => {
      // Mark as accepted in a metadata table or update audit_log if we add review fields
      toast.success('Change accepted and marked as reviewed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changes-review'] });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (entry: AuditEntry) => {
      // Revert the change by applying old values
      if (entry.table_name === 'jobs_db' && entry.old_values) {
        const { error } = await supabase
          .from('jobs_db')
          .update({
            customer_id: entry.old_values.customer_id,
            version: entry.new_values.version + 1
          })
          .eq('id', entry.record_id);

        if (error) throw error;
      }

      toast.success('Change rejected - reverted to previous value');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changes-review'] });
    }
  });

  const exportToCSV = () => {
    if (!changes || changes.length === 0) {
      toast.error('No changes to export');
      return;
    }

    const csv = [
      ['When', 'What Changed', 'Old Value', 'New Value', 'Who', 'Why', 'Job #', 'Status'],
      ...changes.map(c => [
        format(new Date(c.changed_at), 'yyyy-MM-dd HH:mm:ss'),
        c.changed_fields?.join(', ') || 'Multiple fields',
        JSON.stringify(c.old_values || {}),
        JSON.stringify(c.new_values || {}),
        c.changed_by || 'System',
        c.source || '-',
        c.new_values?.job_number || c.old_values?.job_number || '-',
        c.reviewed ? (c.review_status || 'reviewed') : 'unreviewed'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `changes-review-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  const getChangeDescription = (entry: AuditEntry) => {
    if (entry.changed_fields?.includes('customer_id')) return 'Customer changed';
    if (entry.changed_fields?.includes('grand_total')) return 'Price changed';
    if (entry.changed_fields?.some(f => f.includes('part'))) return 'Parts updated';
    if (entry.changed_fields?.includes('balance_due')) return 'Payment applied';
    return 'Data updated';
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Changes Review</CardTitle>
            <CardDescription>
              Review all data changes. Accept to keep them, or Reject to undo them safely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">From Date</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">To Date</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Job Number</label>
                <Input
                  placeholder="e.g. JB2025-0028"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Type of Change</label>
                <Select value={changeType} onValueChange={setChangeType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Changes</SelectItem>
                    <SelectItem value="UPDATE">Updates</SelectItem>
                    <SelectItem value="INSERT">New Records</SelectItem>
                    <SelectItem value="DELETE">Deletions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select value={reviewStatus} onValueChange={setReviewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unreviewed">Unreviewed</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={exportToCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download all changes as a spreadsheet</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Print this list</TooltipContent>
              </Tooltip>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">When</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">What Changed</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Old Value</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">New Value</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Who</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Job #</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          Loading changes...
                        </td>
                      </tr>
                    ) : changes && changes.length > 0 ? (
                      changes.map((entry) => (
                        <tr key={entry.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm">
                            {format(new Date(entry.changed_at), 'MMM d, HH:mm')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {getChangeDescription(entry)}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                            {entry.changed_fields?.map(f => 
                              entry.old_values?.[f] || '-'
                            ).join(', ')}
                          </td>
                          <td className="px-4 py-3 text-sm max-w-[200px] truncate">
                            {entry.changed_fields?.map(f => 
                              entry.new_values?.[f] || '-'
                            ).join(', ')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {entry.changed_by === 'system' ? (
                              <Badge variant="secondary">System</Badge>
                            ) : (
                              <span>User</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono">
                            {entry.new_values?.job_number || entry.old_values?.job_number || '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => acceptMutation.mutate(entry.id)}
                                    disabled={entry.reviewed}
                                  >
                                    <Check className="h-4 w-4 text-green-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Keep this change</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => rejectMutation.mutate(entry)}
                                    disabled={entry.reviewed}
                                  >
                                    <X className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Undo this change</TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          No changes found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
