import test from "node:test";
import assert from "node:assert/strict";
import { healthResponse } from "../src/health.mjs";
import { createPortalServer } from "../src/server.mjs";
test("health explicitly disclaims filing authority",()=>{
 const response=healthResponse("/api/health","GET");
 assert.equal(response.status,200);assert.equal(response.body.filingsAccepted,false);
 assert.equal(response.body.authority,"prototype-only");
});
test("unknown routes and unsafe methods fail closed",()=>{
 assert.equal(healthResponse("/api/file","POST").status,404);
 assert.equal(healthResponse("/api/health","POST").status,405);
});
test("server serves no-cache health and no filing endpoint",async()=>{
 const server=createPortalServer();await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 try {const address=server.address();const base="http://127.0.0.1:"+address.port;
 const live=await fetch(base+"/api/health");assert.equal(live.status,200);assert.equal(live.headers.get("cache-control"),"no-store");
 assert.equal((await live.json()).filingsAccepted,false);
 assert.equal((await fetch(base+"/api/file",{method:"POST"})).status,404);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
