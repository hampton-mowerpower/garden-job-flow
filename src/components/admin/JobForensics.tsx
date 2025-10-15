import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Search, Download, Clock, User, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ChangeRecord {
  change_date: string;
  change_type: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  source: string;
}

export function JobForensics() {
  const { toast } = useToast();
  const [jobNumber, setJobNumber] = useState('');
  const [history, setHistory] = useState<ChangeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    if (!jobNumber.trim()) {
      toast({
        title: "Job Number Required",
        description: "Please enter a job number to search",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_job_change_history' as any, { p_job_number: jobNumber.trim() });

      if (error) throw error;

      setHistory((data || []) as ChangeRecord[]);

      if (!data || (data as any[]).length === 0) {
        toast({
          title: "No History Found",
          description: `No change history found for job ${jobNumber}`,
        });
      } else {
        toast({
          title: "History Loaded",
          description: `Found ${(data as any[]).length} change records for job ${jobNumber}`,
        });
      }
    } catch (error: any) {
      console.error('Error loading history:', error);
      toast({
        title: "Load Failed",
        description: error.message || "Failed to load job history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportHistory = () => {
    if (history.length === 0) return;

    const report = {
      job_number: jobNumber,
      timestamp: new Date().toISOString(),
      total_changes: history.length,
      changes: history
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-${jobNumber}-forensics.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "History Exported",
      description: "Forensic report downloaded successfully"
    });
  };

  const getChangeTypeBadge = (changeType: string) => {
    const types: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      'INSERT': { variant: 'default', label: 'Created' },
      'UPDATE': { variant: 'secondary', label: 'Updated' },
      'DELETE': { variant: 'destructive', label: 'Deleted' },
      'CUSTOMER_CHANGE': { variant: 'secondary', label: 'Customer Changed' }
    };
    return types[changeType] || { variant: 'default', label: changeType };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Job Forensics - Complete Change History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="Enter job number (e.g., JB2025-0065)"
            value={jobNumber}
            onChange={(e) => setJobNumber(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && loadHistory()}
          />
          <Button onClick={loadHistory} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          {history.length > 0 && (
            <Button onClick={exportHistory} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>

        {history.length > 0 && (
          <div>
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Job: {jobNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    {history.length} change records found
                  </p>
                </div>
                <Badge variant="outline">{history.length} Changes</Badge>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Old Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((change, idx) => {
                  const badge = getChangeTypeBadge(change.change_type);
                  return (
                    <TableRow key={idx}>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {new Date(change.change_date).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{change.field_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {change.old_value || <span className="italic">null</span>}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {change.new_value || <span className="italic">null</span>}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span className="font-mono text-xs">
                            {change.changed_by.substring(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {change.source}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {history.length === 0 && !loading && jobNumber && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No change history found</p>
            <p className="text-sm mt-1">This job has no recorded changes in the audit log</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
