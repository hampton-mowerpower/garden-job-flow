import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface TestResult {
  test: string;
  status: '✅' | '❌' | '⏳';
  error?: string;
  data?: string;
  duration?: number;
}

export default function DiagnosticPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    setRunning(true);
    setResults([]);
    const testResults: TestResult[] = [];

    console.log('=== STARTING SYSTEM DIAGNOSTIC ===');

    // Test 1: get_jobs_list_simple
    try {
      const start = Date.now();
      console.log('[TEST 1] Running get_jobs_list_simple...');
      const { data, error } = await supabase.rpc('get_jobs_list_simple', {
        p_limit: 5,
        p_offset: 0,
        p_search: null,
        p_status: null
      });
      const duration = Date.now() - start;
      
      console.log('[TEST 1] Result:', { data, error, duration });
      testResults.push({
        test: 'get_jobs_list_simple',
        status: error ? '❌' : '✅',
        error: error?.message,
        data: data ? `${data.length} jobs` : 'No data',
        duration
      });
    } catch (e: any) {
      console.error('[TEST 1] Exception:', e);
      testResults.push({ 
        test: 'get_jobs_list_simple', 
        status: '❌', 
        error: e.message 
      });
    }

    // Test 2: get_job_detail_simple
    try {
      const start = Date.now();
      console.log('[TEST 2] Running get_job_detail_simple...');
      const firstJobResponse = await supabase.rpc('get_jobs_list_simple', { 
        p_limit: 1,
        p_offset: 0,
        p_search: null,
        p_status: null
      });
      
      if (firstJobResponse.data?.[0]) {
        const jobId = firstJobResponse.data[0].id;
        console.log('[TEST 2] Testing with job ID:', jobId);
        
        const { data, error } = await supabase.rpc('get_job_detail_simple', {
          p_job_id: jobId
        });
        const duration = Date.now() - start;
        
        console.log('[TEST 2] Result:', { data, error, duration });
        testResults.push({
          test: 'get_job_detail_simple',
          status: error ? '❌' : '✅',
          error: error?.message,
          data: data?.job ? `Job ${data.job.job_number}` : 'No data',
          duration
        });
      } else {
        testResults.push({
          test: 'get_job_detail_simple',
          status: '❌',
          error: 'No jobs found to test with'
        });
      }
    } catch (e: any) {
      console.error('[TEST 2] Exception:', e);
      testResults.push({ 
        test: 'get_job_detail_simple', 
        status: '❌', 
        error: e.message 
      });
    }

    // Test 3: update_job_status
    try {
      const start = Date.now();
      console.log('[TEST 3] Running update_job_status...');
      const firstJobResponse = await supabase.rpc('get_jobs_list_simple', { 
        p_limit: 1,
        p_offset: 0,
        p_search: null,
        p_status: null
      });
      
      if (firstJobResponse.data?.[0]) {
        const jobId = firstJobResponse.data[0].id;
        const currentStatus = firstJobResponse.data[0].status;
        console.log('[TEST 3] Testing with job ID:', jobId, 'current status:', currentStatus);
        
        const { data, error } = await supabase.rpc('update_job_status', {
          p_job_id: jobId,
          p_status: currentStatus // Set to same status to avoid changing data
        });
        const duration = Date.now() - start;
        
        console.log('[TEST 3] Result:', { data, error, duration });
        testResults.push({
          test: 'update_job_status',
          status: error ? '❌' : '✅',
          error: error?.message,
          data: 'Status preserved',
          duration
        });
      } else {
        testResults.push({
          test: 'update_job_status',
          status: '❌',
          error: 'No jobs found to test with'
        });
      }
    } catch (e: any) {
      console.error('[TEST 3] Exception:', e);
      testResults.push({ 
        test: 'update_job_status', 
        status: '❌', 
        error: e.message 
      });
    }

    // Test 4: update_job_simple (with patch)
    try {
      const start = Date.now();
      console.log('[TEST 4] Running update_job_simple...');
      const firstJobResponse = await supabase.rpc('get_jobs_list_simple', { 
        p_limit: 1,
        p_offset: 0,
        p_search: null,
        p_status: null
      });
      
      if (firstJobResponse.data?.[0]) {
        const jobId = firstJobResponse.data[0].id;
        const detailResult = await supabase.rpc('get_job_detail_simple', {
          p_job_id: jobId
        });
        
        if (detailResult.data?.job) {
          const version = detailResult.data.job.version;
          const currentBrand = detailResult.data.job.machine_brand;
          console.log('[TEST 4] Testing with job ID:', jobId, 'version:', version);
          
          const { data, error } = await supabase.rpc('update_job_simple', {
            p_job_id: jobId,
            p_version: version,
            p_patch: { machine_brand: currentBrand } // Set to same value to avoid changing data
          });
          const duration = Date.now() - start;
          
          console.log('[TEST 4] Result:', { data, error, duration });
          testResults.push({
            test: 'update_job_simple',
            status: error ? '❌' : '✅',
            error: error?.message,
            data: 'Brand preserved',
            duration
          });
        } else {
          testResults.push({
            test: 'update_job_simple',
            status: '❌',
            error: 'Could not load job details'
          });
        }
      } else {
        testResults.push({
          test: 'update_job_simple',
          status: '❌',
          error: 'No jobs found to test with'
        });
      }
    } catch (e: any) {
      console.error('[TEST 4] Exception:', e);
      testResults.push({ 
        test: 'update_job_simple', 
        status: '❌', 
        error: e.message 
      });
    }

    // Test 5: recalc_job_totals
    try {
      const start = Date.now();
      console.log('[TEST 5] Running recalc_job_totals...');
      const firstJobResponse = await supabase.rpc('get_jobs_list_simple', { 
        p_limit: 1,
        p_offset: 0,
        p_search: null,
        p_status: null
      });
      
      if (firstJobResponse.data?.[0]) {
        const jobId = firstJobResponse.data[0].id;
        console.log('[TEST 5] Testing with job ID:', jobId);
        
        const { error } = await supabase.rpc('recalc_job_totals', {
          p_job_id: jobId
        });
        const duration = Date.now() - start;
        
        console.log('[TEST 5] Result:', { error, duration });
        testResults.push({
          test: 'recalc_job_totals',
          status: error ? '❌' : '✅',
          error: error?.message,
          data: 'Totals recalculated',
          duration
        });
      } else {
        testResults.push({
          test: 'recalc_job_totals',
          status: '❌',
          error: 'No jobs found to test with'
        });
      }
    } catch (e: any) {
      console.error('[TEST 5] Exception:', e);
      testResults.push({ 
        test: 'recalc_job_totals', 
        status: '❌', 
        error: e.message 
      });
    }

    // Test 6: add_job_note
    try {
      const start = Date.now();
      console.log('[TEST 6] Running add_job_note...');
      const firstJobResponse = await supabase.rpc('get_jobs_list_simple', { 
        p_limit: 1,
        p_offset: 0,
        p_search: null,
        p_status: null
      });
      
      if (firstJobResponse.data?.[0]) {
        const jobId = firstJobResponse.data[0].id;
        console.log('[TEST 6] Testing with job ID:', jobId);
        
        const { data, error } = await supabase.rpc('add_job_note', {
          p_job_id: jobId,
          p_note_text: '[DIAGNOSTIC TEST] This note can be deleted'
        });
        const duration = Date.now() - start;
        
        console.log('[TEST 6] Result:', { data, error, duration });
        testResults.push({
          test: 'add_job_note',
          status: error ? '❌' : '✅',
          error: error?.message,
          data: 'Note added',
          duration
        });
      } else {
        testResults.push({
          test: 'add_job_note',
          status: '❌',
          error: 'No jobs found to test with'
        });
      }
    } catch (e: any) {
      console.error('[TEST 6] Exception:', e);
      testResults.push({ 
        test: 'add_job_note', 
        status: '❌', 
        error: e.message 
      });
    }

    // Test 7: create_job
    try {
      const start = Date.now();
      console.log('[TEST 7] Running create_job...');
      const customersResponse = await supabase.from('customers_db').select('id').limit(1).single();
      
      if (customersResponse.data?.id) {
        const customerId = customersResponse.data.id;
        console.log('[TEST 7] Testing with customer ID:', customerId);
        
        const { data, error } = await supabase.rpc('create_job', {
          p_customer_id: customerId,
          p_machine_category: 'Diagnostic Test',
          p_machine_brand: 'Test Brand',
          p_machine_model: 'Test Model',
          p_machine_serial: 'TEST-DIAG-' + Date.now(),
          p_problem_description: '[DIAGNOSTIC TEST] This job can be deleted'
        });
        const duration = Date.now() - start;
        
        console.log('[TEST 7] Result:', { data, error, duration });
        testResults.push({
          test: 'create_job',
          status: error ? '❌' : '✅',
          error: error?.message,
          data: data?.job_number || 'Job created',
          duration
        });
      } else {
        testResults.push({
          test: 'create_job',
          status: '❌',
          error: 'No customers found to test with'
        });
      }
    } catch (e: any) {
      console.error('[TEST 7] Exception:', e);
      testResults.push({ 
        test: 'create_job', 
        status: '❌', 
        error: e.message 
      });
    }

    console.log('=== DIAGNOSTIC COMPLETE ===');
    console.table(testResults);
    
    setResults(testResults);
    setRunning(false);

    const failedCount = testResults.filter(r => r.status === '❌').length;
    if (failedCount === 0) {
      toast.success('All tests passed! ✅');
    } else {
      toast.error(`${failedCount} test(s) failed`);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Diagnostic</h1>
        <p className="text-muted-foreground">
          Test all RPC functions to identify issues with the job management system.
        </p>
      </div>

      <Card className="p-6 mb-6">
        <Button 
          onClick={runTests} 
          disabled={running}
          size="lg"
          className="w-full"
        >
          {running ? '⏳ Running Tests...' : '▶️ Run All Tests'}
        </Button>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Test Results</h2>
          
          {results.map((result, idx) => (
            <Card 
              key={idx} 
              className={`p-4 ${
                result.status === '✅' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-red-500 bg-red-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{result.status}</span>
                    <span className="font-mono font-semibold">{result.test}</span>
                    {result.duration && (
                      <span className="text-sm text-muted-foreground">
                        ({result.duration}ms)
                      </span>
                    )}
                  </div>
                  
                  {result.data && (
                    <div className="text-sm text-foreground mb-1">
                      <strong>Result:</strong> {result.data}
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="text-sm text-destructive font-mono bg-white p-2 rounded">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}

          <Card className="p-6 bg-muted">
            <h3 className="font-bold mb-2">Summary</h3>
            <div className="space-y-1 text-sm">
              <div>
                ✅ Passed: {results.filter(r => r.status === '✅').length}
              </div>
              <div>
                ❌ Failed: {results.filter(r => r.status === '❌').length}
              </div>
              <div>
                Total: {results.length}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
