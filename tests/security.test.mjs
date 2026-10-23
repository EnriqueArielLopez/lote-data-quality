import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {parseCSV,toCSV} from '../src/csv.js';
import {readBatch,validateBatch,exportRecords,exportIssues} from '../src/validator.js';

const schema=JSON.parse(readFileSync(new URL('../rules.json',import.meta.url),'utf8'));
const unsafe=['=1+1','+1+1','-1+1','@SUM(1)','＝1+1','＋1+1','－1+1','＠SUM(1)',
  ' ＝1+1','\ufeff=1+1','\ttexto','\rtexto','\ntexto',' \ttexto','=1+1";=1+1,otra celda'];
const safe=['Texto normal','MAT-100','12.50',"'=1+1",'\ufefftexto'];

test('CSV protege prefijos de fórmula y controles sin crear columnas nuevas',()=>{
  const payloads=[...unsafe,...safe];
  const result=parseCSV(toCSV(['descripcion'],payloads.map(descripcion=>({descripcion}))));
  assert.deepEqual(result.headers,['descripcion']);
  assert.deepEqual(result.rows.map(row=>row.descripcion),[...unsafe.map(value=>"'"+value),...safe]);
});

test('una descripción válida con prefijo fullwidth sale protegida de la exportación de materiales',()=>{
  const source=readBatch(readFileSync(new URL('../examples/materiales-validos.csv',import.meta.url),'utf8'),schema)[0];
  const report=validateBatch([{...source,descripcion:'＝1+1'}],schema);
  assert.equal(report.summary.accepted,1);
  assert.equal(readBatch(exportRecords(report.accepted,schema),schema)[0].descripcion,"'＝1+1");
});

test('el CSV de incidencias protege el valor de origen y conserva los límites de cada celda',()=>{
  const value='\ufeff+1+1';
  const message='Revisar "texto"; con coma, dentro de una celda';
  const result=parseCSV(exportIssues([{row:2,field:'descripcion',severity:'error',code:'PRUEBA',value,message}]));
  assert.equal(result.rows.length,1);
  assert.equal(result.rows[0].value,"'"+value);
  assert.equal(result.rows[0].message,message);
});

test('Python y JavaScript protegen los mismos prefijos ASCII, fullwidth, BOM y controles',()=>{
  const payloads=[...unsafe,...safe];
  const result=spawnSync(process.env.LOTE_PYTHON||'python',['-c',
    'import json,sys; from python.lote import safe_cell; print(json.dumps([safe_cell(value) for value in json.load(sys.stdin)]))'],{
    cwd:new URL('..',import.meta.url),input:JSON.stringify(payloads),encoding:'utf8',
    env:{...process.env,PYTHONIOENCODING:'utf-8'}
  });
  assert.equal(result.status,0,result.stderr);
  const js=parseCSV(toCSV(['value'],payloads.map(value=>({value})))).rows.map(row=>row.value);
  assert.deepEqual(JSON.parse(result.stdout),js);
});
