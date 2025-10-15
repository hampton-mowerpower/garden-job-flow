import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChangesReview } from './ChangesReview';
import { DataRecovery } from './DataRecovery';
import { ShadowAuditMonitor } from './ShadowAuditMonitor';
import { DataReviewHelp } from './DataReviewHelp';
import { JobReconciliation } from './JobReconciliation';

export function DataReviewTabs() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Data Review</h2>
        <p className="text-muted-foreground">
          Review changes, recover data, reconcile jobs, and monitor for unexpected modifications
        </p>
      </div>

      <Tabs defaultValue="changes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="changes">Changes</TabsTrigger>
          <TabsTrigger value="reconcile">Reconcile</TabsTrigger>
          <TabsTrigger value="recovery">Recovery</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>

        <TabsContent value="changes" className="space-y-4">
          <ChangesReview />
        </TabsContent>

        <TabsContent value="reconcile" className="space-y-4">
          <JobReconciliation />
        </TabsContent>

        <TabsContent value="recovery" className="space-y-4">
          <DataRecovery />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <ShadowAuditMonitor />
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <DataReviewHelp />
        </TabsContent>
      </Tabs>
    </div>
  );
}
