import './sites-env.mjs';
import {existsSync,readdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {getPlatformProxy} from 'wrangler';
const config=resolve('dist/server/wrangler.json');
if(!existsSync(config)){const built=spawnSync(process.execPath,['scripts/run-framework.mjs','build'],{stdio:'inherit'});if(built.status!==0)process.exit(built.status||1)}
const proxy=await getPlatformProxy({configPath:config,persist:{path:resolve('.wrangler/state/v3')}});
try{const db=proxy.env.DB;if(!db)throw Error('Local DB binding is missing.');let applied=0;
 const definitions=(await db.prepare("SELECT name,type,sql FROM sqlite_master WHERE type IN ('table','index')").all()).results;const names=new Set(definitions.map(d=>d.name)),columns=new Map();for(const d of definitions.filter(d=>d.type==='table'&&!d.name.startsWith('_cf_')&&!d.name.startsWith('sqlite_'))){columns.set(d.name,new Set((await db.prepare(`PRAGMA table_info(${JSON.stringify(d.name)})`).all()).results.map(c=>c.name)))}
 for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort()){const statements=readFileSync(resolve('drizzle',file),'utf8').replace(/--> statement-breakpoint/g,'').split(';').map(s=>s.trim()).filter(Boolean),pending=[];
 for(const statement of statements){const create=statement.match(/^CREATE\s+(?:UNIQUE\s+)?(?:TABLE|INDEX)\s+[`"]?([\w]+)[`"]?/i),alter=statement.match(/^ALTER\s+TABLE\s+[`"]?([\w]+)[`"]?\s+ADD\s+[`"]?([\w]+)[`"]?/i);if(create){if(names.has(create[1]))continue;pending.push(statement);names.add(create[1]);}else if(alter){const set=columns.get(alter[1])||new Set();if(set.has(alter[2]))continue;pending.push(statement);set.add(alter[2]);columns.set(alter[1],set)}else throw Error('Review unsupported local migration statement in '+file);}
 if(pending.length){await db.batch(pending.map(sql=>db.prepare(sql)));applied+=pending.length;console.log(`Applied ${pending.length} pending schema statements from ${file}.`)} }
 console.log(applied?`Local database is ready (${applied} schema statements).`:'Local database is ready; existing records were preserved.');
}finally{await proxy.dispose()}
