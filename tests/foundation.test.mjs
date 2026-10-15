import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
test('upstream-first and legal authority boundaries are documented',()=> {
 const instructions=readFileSync('AGENTS.md','utf8');
 const architecture=readFileSync('docs/ARCHITECTURE.md','utf8');
 assert.match(instructions,/National Secure Ideas/);
 assert.match(instructions,/reconcile the legislative text/i);
 assert.match(architecture,/not a government recipient/i);
});
