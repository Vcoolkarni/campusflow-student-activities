import './sites-env.mjs';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';

const run=(command,args)=>new Promise((done)=>{
  const child=spawn(command,args,{stdio:'inherit',env:process.env});
  child.on('exit',(code,signal)=>done({code,signal}));
  child.on('error',(error)=>{console.error(error.message);done({code:1})});
});

const persistBase=resolve(process.env.CAMPUSFLOW_PERSIST_DIR||'.render-state');
process.env.CAMPUSFLOW_PERSIST_DIR=persistBase;
const setup=await run(process.execPath,['scripts/setup-local.mjs']);
if(setup.code!==0)process.exit(setup.code||1);

const required=['CAMPUSFLOW_ADMIN_PASSWORD','CAMPUSFLOW_SESSION_SECRET'];
for(const name of required){
  if(!process.env[name]){
    console.error(`${name} is required for a Render deployment.`);
    process.exit(1);
  }
}

const port=process.env.PORT||'10000';
const args=[
  '--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','dev',
  '--config','dist/server/wrangler.json','--local','--persist-to',persistBase,
  '--ip','0.0.0.0','--port',port,'--inspector-port','0',
  '--var',`CAMPUSFLOW_ADMIN_PASSWORD:${process.env.CAMPUSFLOW_ADMIN_PASSWORD}`,
  '--var',`CAMPUSFLOW_SESSION_SECRET:${process.env.CAMPUSFLOW_SESSION_SECRET}`,
  '--var',`CAMPUSFLOW_ADMIN_EMAIL:${process.env.CAMPUSFLOW_ADMIN_EMAIL||'admin@campusflow.local'}`,
  '--var',`CAMPUSFLOW_ADMIN_NAME:${process.env.CAMPUSFLOW_ADMIN_NAME||'CampusFlow Administrator'}`,
];
const server=spawn(process.execPath,args,{stdio:'inherit',env:process.env});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>server.kill(signal));
server.on('exit',(code,signal)=>{process.exitCode=code??(signal?1:0)});
server.on('error',(error)=>{console.error(error.message);process.exitCode=1});
