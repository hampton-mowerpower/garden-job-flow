import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Download } from 'lucide-react';

interface MigrationStats {
  totalRead: number;
  inserted: number;
  updated: number;
  skippedDeleted: number;
  deduped: number;
  errors: string[];
}

interface MigrationResult {
  success: boolean;
  stats?: MigrationStats;
  samples?: Array<{ id: string; name: string; email: string; phone: string }>;
  oldCustomersExport?: number;
  newCustomersExport?: number;
  error?: string;
}

export default function MigrationAdmin() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const runMigration = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🚀 Invoking migration function...');

      const { data, error } = await supabase.functions.invoke('migrate-customers', {
        body: {},
      });

      if (error) throw error;

      console.log('✅ Migration result:', data);
      setResult(data);
    } catch (error: any) {
      console.error('❌ Migration failed:', error);
      setResult({
        success: false,
        error: error.message || 'Unknown error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;

    const report = JSON.stringify(result, null, 2);
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Customer Migration Tool</CardTitle>
          <CardDescription>
            Migrate customers from old Supabase project (kyiuojjaownbvouffqbm) to new project
            (zqujcxgnelnzxzpfykxn)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              <strong>⚠️ Important:</strong> This migration will:
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Read all active customers from the old database</li>
                <li>Skip soft-deleted customers</li>
                <li>Deduplicate by email/phone (keeping most recent)</li>
                <li>Preserve original UUIDs where possible</li>
                <li>Generate before/after CSV exports</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Button onClick={runMigration} disabled={loading} size="lg" className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Running Migration...
              </>
            ) : (
              'Run Customer Migration'
            )}
          </Button>

          {result && (
            <div className="space-y-4">
              {result.success ? (
                <>
                  <Alert className="border-green-500 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <strong>✅ Migration Completed Successfully</strong>
                    </AlertDescription>
                  </Alert>

                  {result.stats && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Migration Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Read</p>
                            <p className="text-2xl font-bold">{result.stats.totalRead}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Inserted</p>
                            <p className="text-2xl font-bold text-green-600">
                              {result.stats.inserted}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Skipped (Deleted)</p>
                            <p className="text-2xl font-bold text-amber-600">
                              {result.stats.skippedDeleted}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Deduplicated</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {result.stats.deduped}
                            </p>
                          </div>
                        </div>

                        {result.stats.errors.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-red-600 mb-2">Errors:</p>
                            <ul className="text-sm text-red-600 space-y-1">
                              {result.stats.errors.map((err, i) => (
                                <li key={i}>• {err}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {result.samples && result.samples.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Sample Customers (First 10)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {result.samples.map((sample) => (
                            <div key={sample.id} className="border-b pb-2 last:border-0">
                              <p className="font-semibold">{sample.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {sample.email || 'No email'} • {sample.phone}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <div className="flex gap-4">
                    <Button onClick={downloadReport} variant="outline" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Download Full Report
                    </Button>
                  </div>

                  <Card className="bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Export Counts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Old Database</p>
                          <p className="text-xl font-bold">{result.oldCustomersExport || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">New Database</p>
                          <p className="text-xl font-bold">{result.newCustomersExport || 0}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>❌ Migration Failed:</strong> {result.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
