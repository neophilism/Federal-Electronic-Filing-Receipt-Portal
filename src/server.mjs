import { createServer } from "node:http";
import { healthResponse } from "./health.mjs";

export function createPortalServer() {
  return createServer((req,res)=>{
    const path=new URL(req.url??"/","http://localhost").pathname;
    const response=healthResponse(path,req.method??"GET");
    res.writeHead(response.status,{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff"});
    res.end(JSON.stringify(response.body));
  });
}
if(process.argv[1] && import.meta.url===new URL("file://"+process.argv[1]).href){
  const port=Number(process.env.PORT??3000);
  if(!Number.isSafeInteger(port)||port<1||port>65535) throw new RangeError("Invalid PORT");
  createPortalServer().listen(port,"0.0.0.0");
}
