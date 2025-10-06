/**
 * Component to run Phase 1 tests with UI feedback
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Play } from 'lucide-react';
import { runPhase1Tests } from './phase1-hotfix.test';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  results: TestResult[];
  summary: string;
}

export const Phase1TestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<TestReport | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    setReport(null);

    try {
      const testReport = await runPhase1Tests();
      setReport(testReport);
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Phase 1 Hot-Fix Test Suite</CardTitle>
          <CardDescription>
            Tests for Bug A (Category/Brand "Other" inline add) and Bug B (Quick Problems)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleRunTests} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Run All Tests
              </>
            )}
          </Button>

          {report && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <h3 className="font-semibold">Test Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(report.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-4">
                  <Badge variant={report.failed === 0 ? "default" : "destructive"}>
                    {report.passed} / {report.totalTests} Passed
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                {report.results.map((result, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {result.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{result.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {result.message}
                          </p>
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer">
                                View details
                              </summary>
                              <pre className="text-xs mt-2 p-2 bg-secondary rounded overflow-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className={report.failed === 0 ? "border-green-600" : "border-red-600"}>
                <CardContent className="p-4">
                  <p className="font-semibold text-center">
                    {report.summary}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
