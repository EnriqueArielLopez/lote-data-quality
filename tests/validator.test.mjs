import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {readBatch,validateBatch,exportRecords} from '../src/validator.js';
import {errorSample,validSample} from '../src/sample.js';
const schema=JSON.parse(readFileSync(new URL('../rules.json',import.meta.url),'utf8'));
const valid=()=>readBatch(validSample,schema);
test('el lote válido conserva los ceros iniciales del grupo',()=>{const result=validateBatch(valid(),schema);assert.equal(result.summary.errors,0);assert.equal(result.accepted[0].grupo,'010');assert.equal(result.summary.accepted,6);});
test('duplica la incidencia en ambas filas de una clave repetida',()=>{const rows=valid();rows.push({...rows[0]});const result=validateBatch(rows,schema);assert.equal(result.issues.filter(issue=>issue.code==='DUPLICATE').length,2);assert.equal(result.summary.rejected,2);});
test('el mismo material en centros distintos es válido',()=>{const rows=valid();rows.push({...rows[0],centro:'2000'});assert.equal(validateBatch(rows,schema).summary.errors,0);});
test('normalización es optativa y se informa por campo',()=>{const rows=valid();rows[0].material=' mat-100 ';const raw=validateBatch(rows,schema);const clean=validateBatch(rows,schema,true);assert.ok(raw.summary.errors>0);assert.equal(clean.summary.errors,0);assert.ok(clean.issues.some(issue=>issue.code==='NORMALIZED'));assert.equal(rows[0].material,' mat-100 ');});
test('normalizar también detecta claves que pasan a duplicarse',()=>{const rows=valid();rows.push({...rows[0],material:'mat-100'});assert.equal(validateBatch(rows,schema,true).summary.rejected,2);});
test('precio cero advierte pero no bloquea; negativo bloquea',()=>{const rows=valid();rows[0].precio='0';rows[1].precio='-1';const r=validateBatch(rows,schema);assert.equal(r.summary.rejected,1);assert.ok(r.issues.some(i=>i.code==='ZERO_PRICE'));});
test('errores por fila y cantidad de incidencias se contabilizan distinto',()=>{const rows=valid();rows[0].material='';rows[0].descripcion='';const r=validateBatch(rows,schema);assert.equal(r.summary.rejected,1);assert.equal(r.summary.errors,2);});
test('exportación de filas válidas puede volverse a validar',()=>{const report=validateBatch(readBatch(errorSample,schema),schema,true);const round=validateBatch(readBatch(exportRecords(report.accepted,schema),schema),schema);assert.equal(round.summary.errors,0);assert.equal(round.summary.rows,report.summary.accepted);});
test('cabeceras extra o faltantes no se ignoran',()=>{assert.throws(()=>readBatch(validSample.replace('moneda','divisa'),schema),/Cabecera/);});
test('no acepta saltos de línea escondidos en claves ni precios',()=>{const rows=valid();rows[0].material='MAT-100\n';rows[0].precio='1\n';const r=validateBatch(rows,schema);assert.ok(r.issues.some(i=>i.code==='PATTERN'));assert.ok(r.issues.some(i=>i.code==='PRICE'));});
test('JavaScript y CLI Python coinciden en la muestra normalizada y original',()=>{
  const python=process.env.LOTE_PYTHON||'python';
  for(const normalize of [false,true]){
    const args=['python/lote.py','examples/materiales-errores.csv','--format','json',...(normalize?['--normalize']:[])];
    const result=spawnSync(python,args,{cwd:new URL('..',import.meta.url),encoding:'utf8',env:{...process.env,PYTHONIOENCODING:'utf-8'}});
    assert.equal(result.status,1,result.stderr);const py=JSON.parse(result.stdout);const js=validateBatch(readBatch(errorSample,schema),schema,normalize);
    assert.deepEqual(py.summary,js.summary);assert.deepEqual(py.accepted,js.accepted);
    const codes=r=>r.issues.map(i=>`${i.row}|${i.field}|${i.severity}|${i.code}`).sort();assert.deepEqual(codes(py),codes(js));
  }
});
