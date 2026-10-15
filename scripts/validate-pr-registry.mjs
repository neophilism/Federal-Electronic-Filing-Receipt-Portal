#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
const p = JSON.parse(readFileSync(new URL('../registry/prs.json',import.meta.url),'utf8'));
assert.equal(p.schemaVersion,1);
assert.equal(p.repository,'neophilism/Federal-Electronic-Filing-Receipt-Portal');
assert.equal(p.planVerified,true);
assert.equal(p.plannedPrCount,p.units.length);
assert.equal(p.units.length,60);
assert.ok(Number.isInteger(p.roadmapVersion)&&p.roadmapVersion>0);
assert.ok(!Number.isNaN(Date.parse(p.observedAt)));
assert.ok(Array.isArray(p.pullRequests));
const ids = new Set();
for (const u of p.units) {
 assert.match(u.id,/^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/);
 assert.ok(!ids.has(u.id),'duplicate unit ID');ids.add(u.id);
 assert.ok(u.title && (u.origin==='original'||u.origin==='addition'));
 assert.ok(Array.isArray(u.prs)&&u.prs.every(n=>Number.isInteger(n)&&n>0));
 assert.ok(Array.isArray(u.dependsOn)&&Array.isArray(u.externalDependencies)&&Array.isArray(u.externalPrerequisites));
}
const byId = new Map(p.units.map(u=>[u.id,u]));
const complete = new Set(); let progress=true;
while(progress){progress=false;for(const u of p.units){if(!complete.has(u.id)&&u.dependsOn.every(d=>complete.has(d))){complete.add(u.id);progress=true}}}
assert.equal(complete.size,p.units.length,'unknown/cyclic dependencies');
console.log('Validated',p.units.length,'work units, no dependency cycles.');
