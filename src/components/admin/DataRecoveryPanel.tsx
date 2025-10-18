import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Download, Search, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  findDuplicateCustomers,
  scanForCorruptedJobs,
  mergeDuplicateCustomers,
  exportJobCustomerMapping,
  downloadCSV,
  type CorruptedJob
} from '@/utils/customerDataRecovery';

/**
 * Admin panel for data recovery and integrity checks
 */
export function DataRecoveryPanel() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [corruptedJobs, setCorruptedJobs] = useState<CorruptedJob[]>([]);
  const [duplicates, setDuplicates] = useState<{
    by_email: any[];
    by_phone: any[];
  } | null>(null);

  const handleScanCorruptedJobs = async () => {
    setIsScanning(true);
    try {
      const corrupted = await scanForCorruptedJobs();
      setCorruptedJobs(corrupted);
      
      if (corrupted.length === 0) {
        toast({
          title: 'All Clear',
          description: 'No corrupted job-customer mappings found.',
        });
      } else {
        toast({
          title: 'Issues Found',
          description: `Found ${corrupted.length} jobs with customer data issues.`,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Scan Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleFindDuplicates = async () => {
    setIsScanning(true);
    try {
      const dupes = await findDuplicateCustomers();
      setDuplicates(dupes);
      
      const totalDupes = dupes.by_email.length + dupes.by_phone.length;
      if (totalDupes === 0) {
        toast({
          title: 'No Duplicates',
          description: 'No duplicate customers found.',
        });
      } else {
        toast({
          title: 'Duplicates Found',
          description: `Found ${dupes.by_email.length} email duplicates and ${dupes.by_phone.length} phone duplicates.`,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Scan Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportMapping = async () => {
    try {
      const csv = await exportJobCustomerMapping();
      const timestamp = new Date().toISOString().split('T')[0];
      downloadCSV(csv, `job-customer-mapping-${timestamp}.csv`);
      
      toast({
        title: 'Export Complete',
        description: 'Job-customer mapping exported successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleMergeDuplicate = async (keeperId: string, duplicateIds: string[]) => {
    if (!confirm(`Merge ${duplicateIds.length} duplicate customers? This cannot be undone.`)) {
      return;
    }

    try {
      const result = await mergeDuplicateCustomers(keeperId, duplicateIds);
      
      if (result.success) {
        toast({
          title: 'Merge Complete',
          description: `Successfully merged ${duplicateIds.length} customers. ${result.jobs_updated} jobs updated.`,
        });
        
        // Refresh the duplicates list
        await handleFindDuplicates();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: 'Merge Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Recovery & Integrity
          </CardTitle>
          <CardDescription>
            Tools for identifying and fixing customer data issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              These tools modify customer data. Always export a backup before making changes.
              The database now has safety triggers to prevent accidental mass updates.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleExportMapping} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Current Mapping
            </Button>
            
            <Button 
              onClick={handleScanCorruptedJobs} 
              variant="outline"
              disabled={isScanning}
            >
              <Search className="h-4 w-4 mr-2" />
              Scan for Corrupted Jobs
            </Button>
            
            <Button 
              onClick={handleFindDuplicates}
              variant="outline"
              disabled={isScanning}
            >
              <Search className="h-4 w-4 mr-2" />
              Find Duplicate Customers
            </Button>
          </div>
        </CardContent>
      </Card>

      {corruptedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              Corrupted Jobs ({corruptedJobs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {corruptedJobs.map(job => (
                <div key={job.job_id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{job.job_number}</div>
                    <div className="text-sm text-muted-foreground">
                      {job.current_customer_name} - {job.current_customer_phone}
                    </div>
                  </div>
                  <Badge variant="destructive">{job.corruption_type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {duplicates && duplicates.by_email.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Email Duplicates ({duplicates.by_email.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {duplicates.by_email.map((group, idx) => (
                <div key={idx} className="border rounded p-3 space-y-2">
                  <div className="font-medium">{group.email}</div>
                  <div className="space-y-1">
                    {group.customer_names.map((name: string, nameIdx: number) => (
                      <div key={nameIdx} className="text-sm flex items-center justify-between">
                        <span>{name}</span>
                        {nameIdx === 0 && (
                          <Badge variant="outline">Primary</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMergeDuplicate(
                      group.customer_ids[0],
                      group.customer_ids.slice(1)
                    )}
                  >
                    Merge into {group.customer_names[0]}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {duplicates && duplicates.by_phone.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Phone Duplicates ({duplicates.by_phone.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {duplicates.by_phone.map((group, idx) => (
                <div key={idx} className="border rounded p-3 space-y-2">
                  <div className="font-medium">{group.phone}</div>
                  <div className="space-y-1">
                    {group.customer_names.map((name: string, nameIdx: number) => (
                      <div key={nameIdx} className="text-sm flex items-center justify-between">
                        <span>{name}</span>
                        {nameIdx === 0 && (
                          <Badge variant="outline">Primary</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMergeDuplicate(
                      group.customer_ids[0],
                      group.customer_ids.slice(1)
                    )}
                  >
                    Merge into {group.customer_names[0]}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {corruptedJobs.length === 0 && !duplicates && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Run scans to check for data issues</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
