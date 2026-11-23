// backend/src/tests/testHelpers.ts
//
// A tiny hand-rolled test helper - no Jest/Mocha, matching the project's
// "avoid unnecessary third-party packages" principle.
// Counts are shared across every test file in one run so `npm test` prints a
// single summary.

let passCount = 0;
let failCount = 0;

/** Records a passing/failing check by comparing actual vs expected. */
export function assertEqual(actual: unknown, expected: unknown, label: string) {
  const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
  if (isEqual) {
    passCount++;
    console.log(`  PASS: ${label}`);
  } else {
    failCount++;
    console.log(`  FAIL: ${label} - expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

/** Records a passing check when `condition` is true, a failing one otherwise. */
export function assertTrue(condition: boolean, label: string) {
  assertEqual(condition, true, label);
}

/** Groups output under a heading. */
export function section(title: string) {
  console.log(`\n${title}`);
}

/** Prints the final pass/fail totals and exits with a non-zero code on any failure. */
export function printSummaryAndExit() {
  console.log(`\n${passCount} passed, ${failCount} failed`);
  process.exit(failCount > 0 ? 1 : 0);
}
