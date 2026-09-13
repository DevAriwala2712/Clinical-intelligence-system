// backend/src/tests/runAll.ts
//
// WHAT: the single entry point `npm test` runs. It imports and runs every
// test file in this directory, in order.
// WHY: keeps `npm test` working as ONE command instead of the developer
// needing to remember every individual test file's path.

import './securityTests';
