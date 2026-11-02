import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import ts from 'typescript';
import {parseCSV,records} from '../lib/import.ts';
assert.deepEqual(parseCSV('a,b\r\n"quoted, text","two"" quotes"'),[['a','b'],['quoted, text','two" quotes']]);assert.throws(()=>parseCSV('a\n"unclosed'));assert.throws(()=>records([['name','name'],['A','B']],['name']));assert.throws(()=>records([['name','prn'],['A']],['name','prn']));
let blob;const old=URL.createObjectURL;URL.createObjectURL=b=>{blob=b;return 'blob:test'};URL.revokeObjectURL=()=>{};globalThis.document={createElement:()=>({click(){}})};
const source=readFileSync('lib/export.ts','utf8').replace("export {parseCSV} from './import';",'');const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;const {exportCSV,exportExcel}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
exportCSV([{Name:'  =HYPERLINK("https://example.invalid")',Count:3}],'test.csv');assert.match(await blob.text(),/"'  =HYPERLINK/);exportExcel([{Title:'A & B <Test>',Count:12,Rate:66.7,Control:'text\u0001clean'}],'test.xlsx');mkdirSync('.sites-runtime',{recursive:true});writeFileSync('.sites-runtime/export-verification.xlsx',Buffer.from(await blob.arrayBuffer()));URL.createObjectURL=old;console.log('PASS CSV quoting, malformed input, duplicate headers, formula escaping, and XLSX generation');
