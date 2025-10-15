import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Clock, Download, RefreshCw, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface NullOverwrite {
  table_name: string;
  record_id: string;
  fields_nullified: string[];
  changed_at: string;
  changed_by: string;
  job_number: string;
}

interface RapidChange {
  table_name: string;
  record_id: string;
  change_count: number;
  first_change: string;
  last_change: string;
  time_span: string;
  job_number: string;
}

interface AuditEntry {
  operation: string;
  changed_at: string;
  changed_by: string;
  changed_fields: string[];
  old_values: any;
  new_values: any;
}

export function DataLossForensics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [nullOverwrites, setNullOverwrites] = useState<NullOverwrite[]>([]);
  const [rapidChanges, setRapidChanges] = useState<RapidChange[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobAuditTrail, setJobAuditTrail] = useState<AuditEntry[]>([]);

  const loadNullOverwrites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_null_overwrites', { days: 30 });
      
      if (error) throw error;
      setNullOverwrites(data || []);
      
      if ((data || []).length > 0) {
        toast({
          title: 'Data Loss Alerts Found',
          description: `Found ${data.length} NULL overwrite incidents in the last 30 days`,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error loading NULL overwrites:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRapidChanges = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('find_rapid_changes', { 
        minutes: 5, 
        threshold: 5 
      });
      
      if (error) throw error;
      setRapidChanges((data || []).map(item => ({
        ...item,
        time_span: String(item.time_span || '')
      })));
    } catch (error: any) {
      console.error('Error loading rapid changes:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadJobAuditTrail = async (jobId: string) => {
    if (!jobId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_job_audit_trail', { 
        p_job_id: jobId 
      });
      
      if (error) throw error;
      setJobAuditTrail(data || []);
    } catch (error: any) {
      console.error('Error loading audit trail:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportForensicsReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      null_overwrites: nullOverwrites,
      rapid_changes: rapidChanges,
      job_audit_trail: selectedJobId ? {
        job_id: selectedJobId,
        entries: jobAuditTrail
      } : null
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forensics-report-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Report Exported',
      description: 'Forensics report downloaded successfully'
    });
  };

  useEffect(() => {
    loadNullOverwrites();
    loadRapidChanges();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Data Loss Forensics
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                loadNullOverwrites();
                loadRapidChanges();
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportForensicsReport}>
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="alerts">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="alerts">
              NULL Overwrites ({nullOverwrites.length})
            </TabsTrigger>
            <TabsTrigger value="race">
              Race Conditions ({rapidChanges.length})
            </TabsTrigger>
            <TabsTrigger value="audit">
              Job Audit Trail
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="alerts" className="space-y-4">
            {nullOverwrites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ✅ No NULL overwrite alerts found in the last 30 days
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Number</TableHead>
                      <TableHead>Fields Lost</TableHead>
                      <TableHead>When</TableHead>
                      <TableHead>Changed By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nullOverwrites.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{item.job_number}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.fields_nullified.map(field => (
                              <Badge key={field} variant="destructive">{field}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(item.changed_at), 'dd/MM/yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell className="text-sm">{item.changed_by}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedJobId(item.record_id);
                              loadJobAuditTrail(item.record_id);
                            }}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="race" className="space-y-4">
            {rapidChanges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                ✅ No rapid changes detected (potential race conditions)
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Number</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead>Time Span</TableHead>
                      <TableHead>First Change</TableHead>
                      <TableHead>Last Change</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rapidChanges.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono">{item.job_number || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.change_count} changes</Badge>
                        </TableCell>
                        <TableCell>{item.time_span}</TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(item.first_change), 'HH:mm:ss')}
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(item.last_change), 'HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedJobId(item.record_id);
                              loadJobAuditTrail(item.record_id);
                            }}
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </TabsContent>
          
          <TabsContent value="audit" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Enter Job ID (UUID)"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
              />
              <Button onClick={() => loadJobAuditTrail(selectedJobId)} disabled={!selectedJobId}>
                <Search className="h-4 w-4 mr-2" />
                Load Audit Trail
              </Button>
            </div>
            
            {jobAuditTrail.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Enter a job ID to view its complete audit trail
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {jobAuditTrail.map((entry, idx) => (
                    <Card key={idx}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge>{entry.operation}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(entry.changed_at), 'dd/MM/yyyy HH:mm:ss')}
                          </span>
                        </div>
                        <div className="text-sm">
                          Changed by: <code>{entry.changed_by}</code>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {entry.changed_fields && entry.changed_fields.length > 0 && (
                          <div className="mb-3">
                            <strong>Changed Fields:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {entry.changed_fields.map(field => (
                                <Badge key={field} variant="secondary">{field}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          {entry.old_values && (
                            <div>
                              <strong>Old Values:</strong>
                              <pre className="mt-1 p-2 bg-muted rounded overflow-auto max-h-40">
                                {JSON.stringify(entry.old_values, null, 2)}
                              </pre>
                            </div>
                          )}
                          {entry.new_values && (
                            <div>
                              <strong>New Values:</strong>
                              <pre className="mt-1 p-2 bg-muted rounded overflow-auto max-h-40">
                                {JSON.stringify(entry.new_values, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
