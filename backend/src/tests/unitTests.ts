// backend/src/tests/unitTests.ts
// `npm test` -> runs everything that needs NO database or running server.
import { runAnalysisTests } from './analysisTests';
import { printSummaryAndExit } from './testHelpers';

runAnalysisTests();
printSummaryAndExit();
