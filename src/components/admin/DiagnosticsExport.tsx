import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileArchive, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import { useUserRoles } from '@/hooks/useUserRoles';

export const DiagnosticsExport = () => {
  const { toast } = useToast();
  const { isAdmin, isSuperAdmin } = useUserRoles();
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const exportDiagnostics = async () => {
    setIsExporting(true);
    setDownloadUrl(null);
    setSummary(null);

    try {
      toast({
        title: "Collecting diagnostics...",
        description: "This may take a moment"
      });

      // Call edge function to get Supabase diagnostics
      const { data: diagnostics, error } = await supabase.functions.invoke('export-diagnostics', {
        method: 'POST'
      });

      if (error) {
        throw new Error(`Failed to collect diagnostics: ${error.message}`);
      }

      console.log('Diagnostics received:', diagnostics?.summary);

      // Create ZIP file
      const zip = new JSZip();

      // Add Supabase diagnostics files
      if (diagnostics) {
        // Summary
        zip.file('00-SUMMARY.txt', `
Diagnostics Export
==================
Timestamp: ${diagnostics.timestamp}
Collected by: ${diagnostics.collected_by}

Summary:
--------
Views: ${diagnostics.summary?.views_count || 0}
Functions: ${diagnostics.summary?.functions_count || 0}
Tables: ${diagnostics.summary?.tables_count || 0}
Indexes: ${diagnostics.summary?.indexes_count || 0}
RLS Policies: ${diagnostics.summary?.policies_count || 0}
Broken Views: ${diagnostics.summary?.broken_views_count || 0}
`);

        // Supabase metadata
        zip.file('supabase/views.json', JSON.stringify(diagnostics.views || [], null, 2));
        zip.file('supabase/functions.json', JSON.stringify(diagnostics.functions || [], null, 2));
        zip.file('supabase/tables_columns.json', JSON.stringify(diagnostics.tables_columns || [], null, 2));
        zip.file('supabase/indexes.json', JSON.stringify(diagnostics.indexes || [], null, 2));
        zip.file('supabase/rls_policies.json', JSON.stringify(diagnostics.rls_policies || [], null, 2));
        zip.file('supabase/rls_status.json', JSON.stringify(diagnostics.rls_status || [], null, 2));
        zip.file('supabase/grants_tables.json', JSON.stringify(diagnostics.grants_tables || [], null, 2));
        zip.file('supabase/health_check.json', JSON.stringify(diagnostics.health_check || {}, null, 2));
        
        if (diagnostics.broken_views && diagnostics.broken_views.length > 0) {
          zip.file('supabase/broken_views.txt', diagnostics.broken_views.join('\n\n'));
        }

        setSummary(diagnostics.summary);
      }

      // Add app health info (client-side)
      const appHealth = {
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        online: navigator.onLine,
        language: navigator.language,
        timestamp: new Date().toISOString()
      };
      zip.file('app/client_info.json', JSON.stringify(appHealth, null, 2));

      // Add .env.example (no real secrets)
      const envExample = `# Supabase Configuration (Example - Real keys redacted)
VITE_SUPABASE_URL=https://[PROJECT_ID].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON_KEY_REDACTED]
VITE_SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY_REDACTED]

# Note: Real environment variables are not included for security
`;
      zip.file('.env.example', envExample);

      // Generate ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      setDownloadUrl(url);

      toast({
        title: "Diagnostics ready!",
        description: "Click the download button below"
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadZip = () => {
    if (!downloadUrl) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `diagnostics-${timestamp}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isAdmin && !isSuperAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Admin access required</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileArchive className="w-5 h-5" />
          Export Diagnostics Bundle
        </CardTitle>
        <CardDescription>
          Collect app code and Supabase schema/health data for troubleshooting (no secrets included)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-semibold">Bundle Contents:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Supabase schema (views, functions, tables, indexes)</li>
            <li>• RLS policies and status</li>
            <li>• Database grants and permissions</li>
            <li>• Health check results</li>
            <li>• Broken views detection</li>
            <li>• Client environment info</li>
            <li>• .env.example (keys redacted)</li>
          </ul>
        </div>

        {!downloadUrl && (
          <Button 
            onClick={exportDiagnostics} 
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Collecting diagnostics...
              </>
            ) : (
              <>
                <FileArchive className="w-4 h-4 mr-2" />
                Export Diagnostics Bundle (ZIP)
              </>
            )}
          </Button>
        )}

        {downloadUrl && summary && (
          <div className="space-y-3">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Ready to Download</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Views: <strong>{summary.views_count}</strong></div>
                <div>Functions: <strong>{summary.functions_count}</strong></div>
                <div>Tables: <strong>{summary.tables_count}</strong></div>
                <div>Indexes: <strong>{summary.indexes_count}</strong></div>
                <div>RLS Policies: <strong>{summary.policies_count}</strong></div>
                <div>Broken Views: <strong className={summary.broken_views_count > 0 ? 'text-destructive' : 'text-green-600'}>
                  {summary.broken_views_count}
                </strong></div>
              </div>
            </div>

            <Button 
              onClick={downloadZip}
              className="w-full"
              variant="default"
            >
              <Download className="w-4 h-4 mr-2" />
              Download ZIP
            </Button>

            <Button 
              onClick={() => {
                setDownloadUrl(null);
                setSummary(null);
              }}
              variant="outline"
              className="w-full"
            >
              Export Again
            </Button>
          </div>
        )}

        <div className="p-3 bg-muted rounded text-sm">
          <strong>Note:</strong> All sensitive keys and tokens are redacted. This bundle is safe to share for troubleshooting.
        </div>
      </CardContent>
    </Card>
  );
};
