/**
 * Job Status Update Tests
 * Tests the status update functionality including version conflicts and error handling
 */

import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

async function runTest(
  testName: string, 
  testFn: () => Promise<{ passed: boolean; message: string; details?: any }>
): Promise<void> {
  console.log(`\n🧪 Running: ${testName}`);
  try {
    const result = await testFn();
    results.push({ test: testName, ...result });
    console.log(result.passed ? '✅ PASS' : '❌ FAIL', result.message);
    if (result.details) {
      console.log('Details:', result.details);
    }
  } catch (error: any) {
    results.push({
      test: testName,
      passed: false,
      message: `Test threw error: ${error.message}`,
      details: error
    });
    console.error('❌ FAIL - Test threw error:', error);
  }
}

export async function testJobStatusUpdate() {
  console.log('\n========================================');
  console.log('🚀 JOB STATUS UPDATE TEST SUITE');
  console.log('========================================');

  // Test 1: Can connect to database
  await runTest('Database Connection', async () => {
    const { data, error } = await supabase
      .from('jobs_db')
      .select('id')
      .limit(1);
    
    if (error) {
      return { 
        passed: false, 
        message: `Cannot connect to database: ${error.message}`,
        details: error
      };
    }
    
    return { 
      passed: true, 
      message: 'Successfully connected to Supabase' 
    };
  });

  // Test 2: Can query jobs with status
  await runTest('Query Jobs with Status', async () => {
    const { data, error } = await supabase
      .from('jobs_db')
      .select('id, job_number, status, version')
      .eq('deleted_at', null)
      .limit(5);
    
    if (error) {
      return { 
        passed: false, 
        message: `Query failed: ${error.message}`,
        details: error
      };
    }
    
    if (!data || data.length === 0) {
      return { 
        passed: false, 
        message: 'No jobs found in database'
      };
    }
    
    return { 
      passed: true, 
      message: `Found ${data.length} jobs`,
      details: data.map(j => ({ jobNumber: j.job_number, status: j.status, version: j.version }))
    };
  });

  // Test 3: Status update with version check (success case)
  await runTest('Status Update - Success Case', async () => {
    // Get a job
    const { data: jobs, error: queryError } = await supabase
      .from('jobs_db')
      .select('id, job_number, status, version')
      .eq('deleted_at', null)
      .limit(1)
      .maybeSingle();
    
    if (queryError || !jobs) {
      return { 
        passed: false, 
        message: 'Cannot find a test job',
        details: queryError
      };
    }

    const originalStatus = jobs.status;
    const originalVersion = jobs.version || 1;
    const testStatus = originalStatus === 'pending' ? 'in-progress' : 'pending';

    // Try to update status
    const { data: updateResult, error: updateError } = await supabase
      .from('jobs_db')
      .update({ 
        status: testStatus,
        version: originalVersion + 1
      })
      .eq('id', jobs.id)
      .eq('version', originalVersion)
      .select('id, status, version')
      .maybeSingle();
    
    if (updateError) {
      return { 
        passed: false, 
        message: `Update failed: ${updateError.message}`,
        details: updateError
      };
    }

    if (!updateResult) {
      return { 
        passed: false, 
        message: 'Update returned no data (version conflict?)'
      };
    }

    // Restore original status
    await supabase
      .from('jobs_db')
      .update({ 
        status: originalStatus,
        version: updateResult.version + 1
      })
      .eq('id', jobs.id)
      .eq('version', updateResult.version);

    return { 
      passed: true, 
      message: `Successfully updated job ${jobs.job_number} status`,
      details: { 
        jobNumber: jobs.job_number,
        oldStatus: originalStatus, 
        newStatus: updateResult.status,
        oldVersion: originalVersion,
        newVersion: updateResult.version
      }
    };
  });

  // Test 4: Status update with wrong version (conflict case)
  await runTest('Status Update - Version Conflict', async () => {
    // Get a job
    const { data: jobs, error: queryError } = await supabase
      .from('jobs_db')
      .select('id, job_number, status, version')
      .eq('deleted_at', null)
      .limit(1)
      .maybeSingle();
    
    if (queryError || !jobs) {
      return { 
        passed: false, 
        message: 'Cannot find a test job',
        details: queryError
      };
    }

    const wrongVersion = (jobs.version || 1) + 999; // Intentionally wrong version

    // Try to update with wrong version
    const { data: updateResult, error: updateError } = await supabase
      .from('jobs_db')
      .update({ 
        status: 'pending',
        version: wrongVersion + 1
      })
      .eq('id', jobs.id)
      .eq('version', wrongVersion) // This won't match
      .select('id, status, version')
      .maybeSingle();
    
    if (updateError) {
      return { 
        passed: false, 
        message: `Unexpected error: ${updateError.message}`,
        details: updateError
      };
    }

    // With maybeSingle(), we should get null when no rows match
    if (updateResult === null) {
      return { 
        passed: true, 
        message: 'Version conflict correctly handled (returned null)',
        details: { 
          jobNumber: jobs.job_number,
          actualVersion: jobs.version,
          attemptedVersion: wrongVersion
        }
      };
    }

    return { 
      passed: false, 
      message: 'Version conflict not detected - update should have failed'
    };
  });

  // Test 5: Verify RLS policies allow updates
  await runTest('RLS Policy Check - Update Permission', async () => {
    const { data: jobs, error: queryError } = await supabase
      .from('jobs_db')
      .select('id, job_number, status, version')
      .eq('deleted_at', null)
      .limit(1)
      .maybeSingle();
    
    if (queryError || !jobs) {
      return { 
        passed: false, 
        message: 'Cannot find a test job',
        details: queryError
      };
    }

    // Try a no-op update (same status, just increment version)
    const { data: updateResult, error: updateError } = await supabase
      .from('jobs_db')
      .update({ version: (jobs.version || 1) + 1 })
      .eq('id', jobs.id)
      .eq('version', jobs.version || 1)
      .select('id')
      .maybeSingle();
    
    if (updateError && updateError.code === '42501') {
      return { 
        passed: false, 
        message: 'RLS policy blocks updates',
        details: updateError
      };
    }

    if (updateError) {
      return { 
        passed: false, 
        message: `Update error: ${updateError.message}`,
        details: updateError
      };
    }

    return { 
      passed: true, 
      message: 'RLS policies allow status updates'
    };
  });

  // Print summary
  console.log('\n========================================');
  console.log('📊 TEST SUMMARY');
  console.log('========================================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.test}: ${r.message}`);
      });
  }

  console.log('\n========================================\n');

  return {
    total: results.length,
    passed,
    failed,
    results
  };
}

// Auto-run if in test mode
if (typeof window !== 'undefined' && window.location.search.includes('runTests=jobStatus')) {
  testJobStatusUpdate().then(summary => {
    console.log('Test suite completed:', summary);
  });
}
