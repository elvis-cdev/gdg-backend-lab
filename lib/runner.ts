import { createHmac, timingSafeEqual } from "node:crypto";
const runnerUrl = process.env.RUNNER_URL;
const token = process.env.RUNNER_TOKEN;
export async function runCode(files: Record<string,string>) {
  if(!runnerUrl || !token) throw new Error("Runner is not configured. Set RUNNER_URL and RUNNER_TOKEN.");
  const body=JSON.stringify({files});
  const timestamp=String(Date.now());
  const signature=createHmac("sha256",token).update(timestamp+"."+body).digest("hex");
  const response=await fetch(new URL("/run",runnerUrl),{method:"POST",headers:{"content-type":"application/json","x-runner-timestamp":timestamp,"x-runner-signature":signature},body,signal:AbortSignal.timeout(12000),cache:"no-store"});
  const data=await response.json().catch(()=>({error:"Runner returned invalid JSON"}));
  if(!response.ok)throw new Error(typeof data.error==="string"?data.error:"Runner request failed");
  return data as {exitCode:number|null;stdout:string;stderr:string;durationMs:number};
}
