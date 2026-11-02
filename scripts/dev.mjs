import {spawn} from 'node:child_process';
const args=process.argv.slice(2),test=args.includes('--role-tests');if(test)process.env.CAMPUSFLOW_ROLE_TESTS='1';
const run=(file,args=[])=>new Promise(resolve=>{const p=spawn(process.execPath,[file,...args],{stdio:'inherit',env:process.env});p.on('exit',(code,signal)=>resolve({code,signal}));p.on('error',e=>{console.error(e.message);resolve({code:1})})});
const setup=await run('scripts/setup-local.mjs');if(setup.code!==0)process.exit(setup.code||1);
const dev=await run('scripts/run-framework.mjs',['dev',...args.filter(a=>a!=='--role-tests')]);process.exitCode=dev.code||0;
