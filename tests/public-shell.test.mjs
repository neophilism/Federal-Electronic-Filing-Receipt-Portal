import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { createHash } from 'node:crypto';
import { createPortalServer } from '../src/server.mjs';
import { createAgencyRegistry } from '../src/policy/agency-registry.mjs';
import { shellNavigation } from '../src/public-shell.mjs';

async function serve(t, options) {
  const server = createPortalServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); });
  return { base: `http://127.0.0.1:${server.address().port}`, port: server.address().port };
}
function getRaw(port, path, method = 'GET') {
  return new Promise((resolve,reject) => {
    const req = request({host:'127.0.0.1',port,path,method},res=>{
      let body='';res.setEncoding('utf8');res.on('data',x=>body+=x);
      res.on('end',()=>resolve({status:res.statusCode,body,headers:res.headers}));
    });req.on('error',reject);req.end();
  });
}
const now = Date.parse('2026-11-02T00:24:00.000Z');
function reviewedRegistry(name = 'Synthetic agency') {
  const bytes=Buffer.from(JSON.stringify({schema:'ufr-agency-domains-v1',revision:1,authorityMode:'prototype',
    observedAt:'2026-11-02T00:00:00.000Z',expiresAt:'2026-11-03T00:00:00.000Z',
    agencies:[{agencyId:'synthetic-agency',name,domains:['agency.example.gov'],
      sourceUrl:'https://www.usa.gov/agencies/synthetic-test-fixture',verifiedAt:'2026-11-02T00:00:00.000Z'}]},null,2)+'\n');
  return createAgencyRegistry(bytes,{expectedSha256:createHash('sha256').update(bytes).digest('hex'),now});
}

test('all public pages are reachable, semantic and explicitly non-authorizing without scripts or collection',async t=>{
  const {base}=await serve(t);
  for(const page of shellNavigation){
    const response=await fetch(base+page.path),html=await response.text();
    assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/^text\/html/);
    assert.match(html,/<!doctype html><html lang="en">/);assert.equal((html.match(/<h1>/g)||[]).length,1);
    assert.match(html,/href="#main">Skip to main content/);assert.match(html,/<main id="main" tabindex="-1" data-shell-version="1">/);
    assert.match(html,/Not an official U.S. Government filing service/);
    assert.match(html,/No submissions are accepted here/);
    assert.ok(html.includes(`href="${page.path}" aria-current="page"`));
    assert.doesNotMatch(html,/<(?:form|input|textarea|script|iframe)\b/i);
    assert.doesNotMatch(html,/\bon(?:click|load|error)=/i);
    assert.equal(response.headers.get('set-cookie'),null);
    assert.equal(response.headers.get('cache-control'),'no-store');
    const policy=response.headers.get('content-security-policy');
    for(const directive of ["default-src 'none'","style-src 'self'","form-action 'none'","base-uri 'none'","frame-ancestors 'none'"]) assert.ok(policy.includes(directive));
  }
});

test('every internal link and stylesheet resolves without a rewrite fallback',async t=>{
  const {base}=await serve(t);
  for(const page of shellNavigation){
    const html=await (await fetch(base+page.path)).text();
    for(const [,target]of html.matchAll(/href="([^"#][^"]*)"/g)){
      assert.ok(target.startsWith('/'),'unconfigured shell has no external requests');
      const response=await fetch(base+target);assert.equal(response.status,200,target);
      if(target.endsWith('.css')) assert.match(response.headers.get('content-type'),/^text\/css/);
    }
  }
  assert.equal((await fetch(base+'/not-a-page')).status,404);
  assert.equal((await fetch(base+'/api/file',{method:'POST'})).status,404);
  assert.equal((await fetch(base+'/api/ready')).status,503);
});

test('public resources implement safe HEAD and reject mutation methods with accurate Allow',async t=>{
  const {base}=await serve(t);
  for(const path of [...shellNavigation.map(x=>x.path),'/assets/public-shell.v1.css']){
    const head=await fetch(base+path,{method:'HEAD'});assert.equal(head.status,200);assert.equal(await head.text(),'');
    for(const method of ['POST','PUT','PATCH','DELETE','OPTIONS']){
      const response=await fetch(base+path,{method,body:method==='OPTIONS'?undefined:'private sample'});
      assert.equal(response.status,405);assert.equal(response.headers.get('allow'),'GET, HEAD');
      assert.doesNotMatch(await response.text(),/private sample/);
    }
  }
  const apiHead=await fetch(base+'/api/agencies',{method:'HEAD'});assert.equal(apiHead.status,405);
  assert.equal(apiHead.headers.get('allow'),'GET');
});

test('raw hostile, query-bearing and aliased targets cannot reach a page or arbitrary source file',async t=>{
  const {port}=await serve(t);
  for(const target of ['/?secret=value','/help?','/help#','/x/../help','http://evil.example/help','//evil.example/help','/assets/../public-shell.v1.css','/assets/%2e%2e/src/server.mjs']){
    const response=await getRaw(port,target);assert.ok([400,404].includes(response.status),target);
    assert.doesNotMatch(response.body,/secret|Federal Filing Prototype|createPortalServer/);
  }
  for(const target of ['/src/server.mjs','/AGENTS.md','/assets/public-shell.css','/assets/public-shell.v1.css.map','/assets/%70ublic-shell.v1.css']){
    assert.equal((await getRaw(port,target)).status,404,target);
  }
});

test('directory is truthful during missing configuration, expiry, rollback and dependency failure',async t=>{
  let time=now;
  const {base}=await serve(t,{agencyRegistry:reviewedRegistry(),clock:()=>time});
  let html=await(await fetch(base+'/agencies')).text();
  assert.match(html,/agency.example.gov/);assert.match(html,/Incomplete reviewed snapshot/);
  assert.match(html,/rel="noreferrer"/);assert.doesNotMatch(html,/target="_blank"/);
  time=Date.parse('2026-11-03T00:00:00.000Z');
  html=await(await fetch(base+'/agencies')).text();assert.match(html,/No reviewed entries are available/);assert.doesNotMatch(html,/agency.example.gov/);
  time=now;
  html=await(await fetch(base+'/agencies')).text();assert.doesNotMatch(html,/agency.example.gov/);
  const {base:failure}=await serve(t,{agencyRegistry:reviewedRegistry(),clock:()=>{throw Error('secret provider path')}});
  html=await(await fetch(failure+'/agencies')).text();assert.match(html,/No reviewed entries/);assert.doesNotMatch(html,/secret provider path/);
  const {base:missing}=await serve(t);html=await(await fetch(missing+'/agencies')).text();assert.match(html,/No reviewed entries/);
});

test('configured registry text is escaped in HTML, never injected as markup or active content',async t=>{
  const name='<img src=x onerror="alert(1)"> & </h2><script>private</script>';
  const {base}=await serve(t,{agencyRegistry:reviewedRegistry(name),clock:()=>now});
  const html=await(await fetch(base+'/agencies')).text();
  assert.match(html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp;/);
  assert.doesNotMatch(html,/<img|<script|<\/h2><script/);
  assert.ok(html.includes('href="https://agency.example.gov/"'));
});
