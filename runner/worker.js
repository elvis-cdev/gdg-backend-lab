// Isolated runner API. Deploy on a dedicated host, never inside the web process.
// For each request, launches a disposable Docker container with no network,
// read-only root filesystem, memory/CPU/PID limits, and a hard timeout.
const http = require("node:http");
const {createHmac,timingSafeEqual}=require("node:crypto");
const {spawn}=require("node:child_process");
const PORT=Number(process.env.PORT||8787),TOKEN=process.env.RUNNER_TOKEN;
const MAX_BODY=65000,MAX_FILE=30000;
function send(res,status,data){res.writeHead(status,{"content-type":"application/json","cache-control":"no-store"});res.end(JSON.stringify(data))}
function safeEq(a,b){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)}
function read(req){return new Promise((resolve,reject)=>{let s="";req.on("data",c=>{s+=c;if(s.length>MAX_BODY)reject(Error("large"))});req.on("end",()=>{try{resolve(s)}catch(e){reject(e)}});req.on("error",reject)})}
function run(files){return new Promise(resolve=>{
 const started=Date.now();let stdout="",stderr="",finished=false;const dockerArgs=["run","--rm","--network=none","--memory=96m","--cpus=0.50","--pids-limit=32","--read-only","--tmpfs","/tmp:rw,noexec,nosuid,size=8m","--cap-drop=ALL","--security-opt=no-new-privileges","--user","10001:10001","--mount",`type=bind,src=${process.env.RUNNER_WORK_DIR||"/var/lib/gdg-runner"}/job-${process.pid}-${Date.now()},dst=/work,readonly`,"node:22-alpine","node","/work/server.js"];
 // This mount-based draft is intentionally guarded: the production orchestrator
 // should create the per-job directory safely before invoking Docker.
 const jobDir=`${process.env.RUNNER_WORK_DIR||"/var/lib/gdg-runner"}/job-${process.pid}-${Date.now()}`;
 const fs=require("node:fs"),path=require("node:path");
 try{fs.mkdirSync(jobDir,{recursive:false,mode:0o700});for(const [name,content] of Object.entries(files)){if(!/^[a-zA-Z0-9._-]{1,80}$/.test(name)||name===".."||name.startsWith(".")){throw Error("Invalid filename")}fs.writeFileSync(path.join(jobDir,name),content,{mode:0o400,flag:"wx"})}}
 catch(e){try{fs.rmSync(jobDir,{recursive:true,force:true})}catch{}return resolve({exitCode:null,stdout:"",stderr:"Runner workspace setup failed: "+e.message,durationMs:Date.now()-started})}
 const idx=dockerArgs.indexOf("--mount");dockerArgs[idx+1]=`type=bind,src=${jobDir},dst=/work,readonly`;
 const child=spawn("docker",dockerArgs,{stdio:["ignore","pipe","pipe"]});
 const timer=setTimeout(()=>{child.kill("SIGKILL");},5000);
 child.stdout.on("data",d=>{if(stdout.length<12000)stdout+=d.toString().slice(0,12000-stdout.length)});
 child.stderr.on("data",d=>{if(stderr.length<12000)stderr+=d.toString().slice(0,12000-stderr.length)});
 child.on("error",e=>finish(null,stderr+"Runner launch error: "+e.message));
 child.on("close",code=>finish(code,stderr));
 function finish(code,err){if(finished)return;finished=true;clearTimeout(timer);try{fs.rmSync(jobDir,{recursive:true,force:true})}catch{}resolve({exitCode:code,stdout,stderr:err,durationMs:Date.now()-started})}
})}
http.createServer(async(req,res)=>{
 if(req.method!=="POST"||req.url!=="/run")return send(res,404,{error:"Not found"});
 if(!TOKEN)return send(res,503,{error:"Runner token not configured"});
 let raw;try{raw=await read(req)}catch{return send(res,413,{error:"Request too large"})}
 const ts=req.headers["x-runner-timestamp"],sig=req.headers["x-runner-signature"];
 if(typeof ts!=="string"||Math.abs(Date.now()-Number(ts))>60000||typeof sig!=="string")return send(res,401,{error:"Invalid signature timestamp"});
 const expected=createHmac("sha256",TOKEN).update(ts+"."+raw).digest("hex");if(!safeEq(sig,expected))return send(res,401,{error:"Invalid signature"});
 let data;try{data=JSON.parse(raw)}catch{return send(res,400,{error:"Invalid JSON"})}
 if(!data.files||typeof data.files!=="object"||Array.isArray(data.files)||typeof data.files["server.js"]!=="string")return send(res,400,{error:"A server.js file is required"});
 const entries=Object.entries(data.files);if(entries.length>5||entries.some(([k,v])=>!/^[a-zA-Z0-9._-]{1,80}$/.test(k)||k.startsWith(".")||typeof v!=="string"||v.length>MAX_FILE)||entries.reduce((n,[,v])=>n+v.length,0)>60000)return send(res,400,{error:"Workspace files exceed policy"});
 const result=await run(data.files);return send(res,200,result);
}).listen(PORT,"127.0.0.1",()=>console.log("Runner API listening on 127.0.0.1:"+PORT));
