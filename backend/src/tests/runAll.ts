// backend/src/tests/runAll.ts
//
// Single entry point for `npm test`: executes pure unit tests, analysis tests,
// and live integration/security tests against the running server.

import { runAnalysisTests } from './analysisTests';

async function main() {
  console.log('=== RUNNING PURE ANALYSIS & UNIT TESTS ===');
  runAnalysisTests();

  console.log('\n=== RUNNING SECURITY & INTEGRATION TESTS ===');
  await import('./securityTests');
}

main().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
