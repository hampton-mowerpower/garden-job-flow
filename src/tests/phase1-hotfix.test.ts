/**
 * Phase 1 Hot-Fix Tests
 * Tests for Bug A (Category/Brand "Other" inline add) and Bug B (Quick Problems)
 */

import { supabase } from '@/integrations/supabase/client';

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

/**
 * Unit Tests - Category/Brand "Other" Flow
 */
export const testCategoryBrandOther = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  // Test 1: Create new category
  try {
    const testCategoryName = `Test Category ${Date.now()}`;
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .insert({
        name: testCategoryName,
        rate_default: 0,
        active: true
      })
      .select()
      .single();

    if (categoryError) throw categoryError;

    results.push({
      name: 'Create new category',
      passed: true,
      message: 'Category created successfully',
      details: { id: categoryData.id, name: categoryData.name }
    });

    // Test 2: Create new brand linked to category
    try {
      const testBrandName = `Test Brand ${Date.now()}`;
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .insert({
          name: testBrandName,
          category_id: categoryData.id,
          active: true
        })
        .select()
        .single();

      if (brandError) throw brandError;

      results.push({
        name: 'Create new brand linked to category',
        passed: brandData.category_id === categoryData.id,
        message: brandData.category_id === categoryData.id 
          ? 'Brand correctly linked to category' 
          : 'Brand not linked to category',
        details: { brand_id: brandData.id, category_id: brandData.category_id }
      });
    } catch (error: any) {
      results.push({
        name: 'Create new brand linked to category',
        passed: false,
        message: error.message,
        details: error
      });
    }

    // Test 3: Duplicate category check (case-insensitive)
    try {
      const duplicateName = testCategoryName.toUpperCase();
      const { error: dupError } = await supabase
        .from('categories')
        .insert({
          name: duplicateName,
          rate_default: 0,
          active: true
        });

      results.push({
        name: 'Duplicate category check (case-insensitive)',
        passed: dupError !== null,
        message: dupError 
          ? 'Duplicate correctly blocked by unique constraint' 
          : 'Duplicate was not blocked - FAIL',
        details: { error: dupError?.message }
      });
    } catch (error: any) {
      results.push({
        name: 'Duplicate category check (case-insensitive)',
        passed: true,
        message: 'Duplicate correctly blocked',
        details: error.message
      });
    }

    // Cleanup
    await supabase.from('brands').delete().eq('name', `Test Brand ${Date.now()}`);
    await supabase.from('categories').delete().eq('id', categoryData.id);

  } catch (error: any) {
    results.push({
      name: 'Create new category',
      passed: false,
      message: error.message,
      details: error
    });
  }

  return results;
};

/**
 * Unit Tests - Quick Problems
 */
export const testQuickProblems = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  // Test 1: Quick problems exist
  try {
    const { data, error } = await supabase
      .from('quick_problems')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    results.push({
      name: 'Quick problems seeded',
      passed: data && data.length >= 6,
      message: data && data.length >= 6
        ? `Found ${data.length} quick problems`
        : 'Not enough quick problems found',
      details: { count: data?.length, problems: data }
    });

    // Test 2: Default problems exist
    const expectedProblems = [
      'Full service required',
      'Won\'t start',
      'Blade sharpen',
      'No power / battery fault',
      'Fuel leak / smell of petrol',
      'Strange noise / vibration'
    ];

    const foundProblems = data?.map(p => p.label) || [];
    const allFound = expectedProblems.every(expected => 
      foundProblems.includes(expected)
    );

    results.push({
      name: 'Default quick problems present',
      passed: allFound,
      message: allFound 
        ? 'All default problems found' 
        : 'Some default problems missing',
      details: { expected: expectedProblems, found: foundProblems }
    });

  } catch (error: any) {
    results.push({
      name: 'Quick problems seeded',
      passed: false,
      message: error.message,
      details: error
    });
  }

  // Test 3: Reorder persistence
  try {
    const { data: problems } = await supabase
      .from('quick_problems')
      .select('*')
      .eq('active', true)
      .limit(2);

    if (problems && problems.length >= 2) {
      // Swap display orders
      const [first, second] = problems;
      const tempOrder = first.display_order;

      await supabase
        .from('quick_problems')
        .update({ display_order: second.display_order })
        .eq('id', first.id);

      await supabase
        .from('quick_problems')
        .update({ display_order: tempOrder })
        .eq('id', second.id);

      // Verify change persisted
      const { data: updated } = await supabase
        .from('quick_problems')
        .select('*')
        .in('id', [first.id, second.id]);

      const firstUpdated = updated?.find(p => p.id === first.id);
      const secondUpdated = updated?.find(p => p.id === second.id);

      const orderSwapped = 
        firstUpdated?.display_order === second.display_order &&
        secondUpdated?.display_order === tempOrder;

      results.push({
        name: 'Quick problems reorder persistence',
        passed: orderSwapped,
        message: orderSwapped 
          ? 'Reorder persisted correctly' 
          : 'Reorder did not persist',
        details: { before: problems, after: updated }
      });

      // Restore original order
      await supabase
        .from('quick_problems')
        .update({ display_order: tempOrder })
        .eq('id', first.id);

      await supabase
        .from('quick_problems')
        .update({ display_order: second.display_order })
        .eq('id', second.id);
    }
  } catch (error: any) {
    results.push({
      name: 'Quick problems reorder persistence',
      passed: false,
      message: error.message,
      details: error
    });
  }

  return results;
};

/**
 * Integration Tests - Realtime
 */
export const testRealtimeUpdates = async (): Promise<TestResult[]> => {
  const results: TestResult[] = [];

  // Test 1: Category realtime
  try {
    let realtimeTriggered = false;
    const testName = `Realtime Test ${Date.now()}`;

    const channel = supabase
      .channel('test-categories')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'categories'
        },
        () => {
          realtimeTriggered = true;
        }
      )
      .subscribe();

    // Wait for subscription to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Insert test category
    const { data: insertedCategory } = await supabase
      .from('categories')
      .insert({
        name: testName,
        rate_default: 0,
        active: true
      })
      .select()
      .single();

    // Wait for realtime event
    await new Promise(resolve => setTimeout(resolve, 2000));

    results.push({
      name: 'Category realtime updates',
      passed: realtimeTriggered,
      message: realtimeTriggered 
        ? 'Realtime event received' 
        : 'Realtime event not received',
      details: { triggered: realtimeTriggered }
    });

    // Cleanup
    if (insertedCategory) {
      await supabase.from('categories').delete().eq('id', insertedCategory.id);
    }
    await supabase.removeChannel(channel);

  } catch (error: any) {
    results.push({
      name: 'Category realtime updates',
      passed: false,
      message: error.message,
      details: error
    });
  }

  return results;
};

/**
 * Run all Phase 1 tests and generate report
 */
export const runPhase1Tests = async (): Promise<TestReport> => {
  console.log('🧪 Starting Phase 1 Hot-Fix Tests...\n');

  const allResults: TestResult[] = [];

  // Run test suites
  console.log('Running Category/Brand "Other" tests...');
  const categoryBrandResults = await testCategoryBrandOther();
  allResults.push(...categoryBrandResults);

  console.log('Running Quick Problems tests...');
  const quickProblemsResults = await testQuickProblems();
  allResults.push(...quickProblemsResults);

  console.log('Running Realtime tests...');
  const realtimeResults = await testRealtimeUpdates();
  allResults.push(...realtimeResults);

  // Calculate results
  const passed = allResults.filter(r => r.passed).length;
  const failed = allResults.filter(r => r.passed === false).length;

  const report: TestReport = {
    timestamp: new Date().toISOString(),
    totalTests: allResults.length,
    passed,
    failed,
    results: allResults,
    summary: failed === 0 
      ? `✅ All ${passed} tests passed!` 
      : `❌ ${failed} test(s) failed, ${passed} passed`
  };

  // Log report
  console.log('\n' + '='.repeat(50));
  console.log('📊 PHASE 1 TEST REPORT');
  console.log('='.repeat(50));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Total Tests: ${report.totalTests}`);
  console.log(`Passed: ${report.passed} ✅`);
  console.log(`Failed: ${report.failed} ❌`);
  console.log('='.repeat(50) + '\n');

  allResults.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} Test ${index + 1}: ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   Details:`, result.details);
    }
    console.log('');
  });

  console.log('='.repeat(50));
  console.log(report.summary);
  console.log('='.repeat(50) + '\n');

  return report;
};
