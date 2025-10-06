/**
 * Test Runner Page
 * Accessible at /test-runner for running Phase 1 tests
 */

import { Phase1TestRunner } from '@/tests/run-phase1-tests';

export default function TestRunner() {
  return (
    <div className="min-h-screen bg-background">
      <Phase1TestRunner />
    </div>
  );
}
