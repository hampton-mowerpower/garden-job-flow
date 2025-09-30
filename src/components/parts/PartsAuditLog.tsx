import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { History } from 'lucide-react';

interface AuditLog {
  id: string;
  action: 'created' | 'updated' | 'deleted';
  changed_at: string;
  changed_by: string;
  old_data?: any;
  new_data?: any;
  user_email?: string;
}

interface PartsAuditLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partId?: string;
}

export function PartsAuditLog({ open, onOpenChange, partId }: PartsAuditLogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadAuditLogs();
    }
  }, [open, partId]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('parts_audit_log')
        .select('*')
        .order('changed_at', { ascending: false });

      if (partId) {
        query = query.eq('part_id', partId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      // Fetch user emails separately
      const userIds = [...new Set(data?.map(log => log.changed_by).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, email')
        .in('user_id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);

      const userMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);

      setLogs(data?.map(log => ({
        ...log as any,
        user_email: userMap.get(log.changed_by)
      })) || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const variants = {
      created: 'default',
      updated: 'secondary',
      deleted: 'destructive'
    };
    return (
      <Badge variant={variants[action as keyof typeof variants] as any}>
        {action}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Audit Log {partId && '- Part History'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh]">
          {loading ? (
            <div className="flex justify-center p-8">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">No audit logs found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">
                      {format(new Date(log.changed_at), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{log.user_email || 'System'}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {log.action === 'created' && log.new_data && (
                          <div>
                            <strong>Created:</strong> {log.new_data.name} (SKU: {log.new_data.sku})
                          </div>
                        )}
                        {log.action === 'updated' && log.old_data && log.new_data && (
                          <div className="space-y-1">
                            {Object.keys(log.new_data).map(key => {
                              if (log.old_data[key] !== log.new_data[key] && key !== 'updated_at') {
                                return (
                                  <div key={key}>
                                    <strong>{key}:</strong> {String(log.old_data[key])} → {String(log.new_data[key])}
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        )}
                        {log.action === 'deleted' && log.old_data && (
                          <div>
                            <strong>Deleted:</strong> {log.old_data.name} (SKU: {log.old_data.sku})
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
