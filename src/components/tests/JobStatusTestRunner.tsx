import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testJobStatusUpdate } from '@/tests/job-status-update.test';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function JobStatusTestRunner() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runTests = async () => {
    setRunning(true);
    setResults(null);
    
    try {
      const testResults = await testJobStatusUpdate();
      setResults(testResults);
    } catch (error) {
      console.error('Test suite error:', error);
      setResults({ error: String(error) });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Status Update Test Suite</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This test suite verifies that job status updates work correctly,
            including version conflict handling and error scenarios.
          </p>
          
          <Button 
            onClick={runTests} 
            disabled={running}
            size="lg"
          >
            {running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {running ? 'Running Tests...' : 'Run Test Suite'}
          </Button>

          {results && !results.error && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold">Total Tests: {results.total}</div>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">{results.passed} Passed</span>
                </div>
                {results.failed > 0 && (
                  <div className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <span className="font-semibold">{results.failed} Failed</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {results.results.map((result: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      result.passed
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.passed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{result.test}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {result.message}
                        </div>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                              Show details
                            </summary>
                            <pre className="mt-2 p-2 bg-background rounded text-xs overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-muted rounded-lg text-sm">
                <div className="font-medium mb-2">✅ What was fixed:</div>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Changed .single() to .maybeSingle() to handle version conflicts</li>
                  <li>• Added proper error messages for user-friendly feedback</li>
                  <li>• Enhanced optimistic updates with rollback on error</li>
                  <li>• Added validation to prevent no-op status changes</li>
                  <li>• Added debugging logs for troubleshooting</li>
                </ul>
              </div>
            </div>
          )}

          {results?.error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
              <div className="font-semibold text-destructive mb-2">Test Suite Error</div>
              <pre className="text-sm text-muted-foreground overflow-auto">
                {results.error}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-medium mb-1">1. Navigate to Job Search</div>
              <p className="text-muted-foreground">Go to the main job list page</p>
            </div>
            
            <div>
              <div className="font-medium mb-1">2. Change Job Status</div>
              <p className="text-muted-foreground">
                Click the status dropdown on any job and select a different status
              </p>
            </div>
            
            <div>
              <div className="font-medium mb-1">3. Verify Success</div>
              <p className="text-muted-foreground">
                ✅ Status updates immediately<br />
                ✅ Green success toast appears<br />
                ✅ Job list remains visible<br />
                ✅ No red error toasts<br />
                ✅ No console errors
              </p>
            </div>

            <div>
              <div className="font-medium mb-1">4. Test Multiple Changes</div>
              <p className="text-muted-foreground">
                Try changing status on 3-5 different jobs to ensure consistency
              </p>
            </div>

            <div>
              <div className="font-medium mb-1">5. Check Browser Console</div>
              <p className="text-muted-foreground">
                Open DevTools (F12) → Console tab<br />
                Look for: "✓ Status updated successfully"<br />
                Should see NO "PGRST116" errors
              </p>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="font-medium text-yellow-900 mb-1">
              📋 Expected Console Output
            </div>
            <pre className="text-xs text-yellow-800 mt-2 overflow-auto">
{`Updating job JB2025-0071 status: pending → in-progress (v1)
✓ Status updated successfully to in-progress (v2)`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
