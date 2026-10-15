import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const threatModel = readFileSync('docs/THREAT_MODEL.md', 'utf8');

test('authority and implementation ownership stay separate', () => {
  assert.match(threatModel, /not an official United States Government recipient/i);
  assert.match(threatModel, /does not create legal filing authority/i);
  assert.match(threatModel, /National Secure Ideas Submission/);
  assert.match(threatModel, /released, pinned, versioned upstream contract/i);
  assert.match(threatModel, /Verification proves only the stated cryptographic facts, not legal sufficiency or government receipt/i);
});

test('threat model covers protected assets and trust domains', () => {
  for (const heading of [
    '## Protected assets',
    '## Trust boundaries',
    '## Threat actors',
    '## Required abuse and failure behavior',
    '## Security invariants',
    '## Required verification evidence',
    '## Review triggers',
  ]) {
    assert.ok(threatModel.includes(heading), `missing threat-model section: ${heading}`);
  }
  assert.match(threatModel, /tracking number alone grants no access/i);
  assert.match(threatModel, /Classified information must not enter the unclassified portal/i);
});

test('negative paths fail closed without false receipt claims', () => {
  for (const requiredCase of [
    /Identifier enumeration or cross-claimant lookup/,
    /Duplicate, replayed, or concurrent submission/,
    /Downstream timeout or ambiguous response/,
    /Identity or authorization dependency outage/,
    /Time or signing service failure/,
    /Audit sink failure/,
  ]) {
    assert.match(threatModel, requiredCase);
  }
  assert.match(threatModel, /Do not report accepted or transmitted/i);
  assert.match(threatModel, /Deny protected operations/i);
  assert.match(threatModel, /Do not fabricate a trusted timestamp or signature/i);
});

test('portable evidence cannot imply external acceptance', () => {
  assert.match(threatModel, /Portable tests do not establish government authorization/i);
  assert.match(threatModel, /independent security review/i);
});
