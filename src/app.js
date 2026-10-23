import { readBatch,validateBatch,exportRecords,exportIssues } from './validator.js';
import { errorSample,validSample } from './sample.js';
const $=selector=>document.querySelector(selector);
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let schema,rows=[],report,filter='all',page=1,history=[],editIndex,origin;
const PAGE_SIZE=8;
// El perfil llega por HTTP. Ninguna acción de datos debe adelantarse a esa carga.
const controls=[...document.querySelectorAll('button,input')];
controls.forEach(control=>control.disabled=true);
$('#file-label').textContent='Cargando perfil de validación…';
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('visible'),4500);}
function updateReport(){report=validateBatch(rows,schema,$('#normalize').checked);render();}
function loadText(text,name){const next=readBatch(text,schema);rows=next;history=[];page=1;filter='all';$('#search').value='';$('#file-label').textContent=`${name} · ${rows.length} filas`;updateReport();}
function filteredIssues(){const needle=$('#search').value.trim().toLocaleLowerCase('es');return report.issues.filter(issue=>(filter==='all'||issue.severity===filter)&&(!needle||`${issue.field} ${issue.value} ${issue.code} ${issue.message} ${issue.row}`.toLocaleLowerCase('es').includes(needle)));}
function render(){
  const {summary}=report;const score=summary.rows?Math.round(summary.accepted/summary.rows*100):0;
  $('#score').textContent=score+'%';$('#score-bar').style.width=score+'%';$('#score-description').textContent=`${summary.accepted} de ${summary.rows} filas no tienen errores bloqueantes.`;
  $('#accepted').textContent=summary.accepted;$('#rejected').textContent=summary.rejected;$('#warnings').textContent=summary.warnings;$('#all-count').textContent=report.issues.length;
  $('#undo').disabled=!history.length;$('#export-accepted').disabled=!summary.accepted;$('#export-issues').disabled=!report.issues.length;
  document.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===filter)));
  const list=filteredIssues();const pages=Math.max(1,Math.ceil(list.length/PAGE_SIZE));page=Math.min(page,pages);
  $('#issues').innerHTML=list.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE).map(issue=>`<tr><td>${issue.row}</td><td>${escape(issue.field)}<small>${escape(issue.code)}</small></td><td><span class="bad-value" title="${escape(issue.value)}">${issue.value?escape(issue.value):'— vacío —'}</span></td><td class="issue-description">${escape(issue.message)}</td><td><span class="badge ${issue.severity}">${issue.severity==='error'?'Error':'Advertencia'}</span></td><td><button class="edit-row" data-row="${issue.row}" aria-label="Revisar fila ${issue.row}, ${escape(issue.field)}">↗</button></td></tr>`).join('');
  $('#empty').hidden=!!list.length;$('#empty-title').textContent=report.issues.length?'Sin coincidencias':'El lote está listo para continuar.';
  $('#empty-text').textContent=report.issues.length?'Cambiá el filtro o la búsqueda.':'No se encontraron incidencias con el perfil actual. El sistema destino puede aplicar otras reglas.';
  $('#page-label').textContent=list.length?`${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,list.length)} de ${list.length} incidencias`:'0 incidencias';
  $('#previous').disabled=page===1;$('#next').disabled=page===pages;
}
function openDialog(dialog){origin=document.activeElement;dialog.showModal();document.documentElement.style.overflow='hidden';}
function closeDialog(dialog){dialog.close();}
for(const dialog of document.querySelectorAll('dialog')){
  dialog.addEventListener('close',()=>{document.documentElement.style.overflow='';if(origin?.isConnected)origin.focus({preventScroll:true});});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
}
$('#issues').addEventListener('click',event=>{
  const button=event.target.closest('[data-row]');if(!button)return;
  editIndex=Number(button.dataset.row)-2;
  $('#editor-title').textContent=`Revisar fila ${editIndex+2}`;
  $('#editor-fields').innerHTML='<div class="field-group">'+schema.fields.map(field=>`<label>${escape(field.label)}<input aria-label="${escape(field.label)}" aria-describedby="hint-${field.key}" name="${field.key}" value="${escape(rows[editIndex][field.key])}" autocomplete="off" maxlength="2000"><small id="hint-${field.key}">${escape(field.hint)}</small></label>`).join('')+'</div>';
  openDialog($('#editor'));
});
$('#editor-form').addEventListener('submit',event=>{
  event.preventDefault();history.push(structuredClone(rows));if(history.length>20)history.shift();
  rows[editIndex]=Object.fromEntries(schema.fields.map(field=>[field.key,event.target.elements[field.key].value]));
  updateReport();closeDialog($('#editor'));toast('Fila actualizada. Se revisó el lote completo, incluidas sus claves duplicadas.');
});
$('#undo').addEventListener('click',()=>{if(history.length){rows=history.pop();updateReport();toast('Se deshizo la última corrección.');}});
$('#close-editor').addEventListener('click',()=>closeDialog($('#editor')));$('#cancel-edit').addEventListener('click',()=>closeDialog($('#editor')));
$('#show-rules').addEventListener('click',()=>openDialog($('#rules-dialog')));$('#close-rules').addEventListener('click',()=>closeDialog($('#rules-dialog')));
$('#normalize').addEventListener('change',()=>{page=1;updateReport();toast($('#normalize').checked?'Normalización activada. Los cambios se identifican como advertencias.':'Normalización desactivada. Se revisan los valores de origen.');});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;page=1;render();}));
$('#search').addEventListener('input',()=>{page=1;render();});$('#previous').addEventListener('click',()=>{page--;render();});$('#next').addEventListener('click',()=>{page++;render();});
$('#sample-errors').addEventListener('click',()=>{loadText(errorSample,'Ejemplo con errores');toast('Ejemplo con errores cargado.');});
$('#sample-valid').addEventListener('click',()=>{loadText(validSample,'Ejemplo válido');toast('Ejemplo válido cargado.');});
async function importFile(file){if(!file)return;try{if(file.size>2_000_000)throw new Error('El archivo supera 2 MB.');loadText(await file.text(),file.name);toast('Archivo revisado en este navegador.');}catch(error){toast(error.message);}}
$('#file').addEventListener('change',async event=>{await importFile(event.target.files[0]);event.target.value='';});
$('#drop-zone').addEventListener('dragover',event=>{event.preventDefault();$('#drop-zone').classList.add('dragging');});
$('#drop-zone').addEventListener('dragleave',()=>$('#drop-zone').classList.remove('dragging'));
$('#drop-zone').addEventListener('drop',async event=>{event.preventDefault();$('#drop-zone').classList.remove('dragging');await importFile(event.dataTransfer.files[0]);});
function download(contents,name,type='text/csv;charset=utf-8'){const url=URL.createObjectURL(new Blob([contents],{type}));const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#export-accepted').addEventListener('click',()=>{download(exportRecords(report.accepted,schema),'lote-materiales-validos.csv');toast(`${report.accepted.length} filas exportadas. Revisá las advertencias antes de la carga.`);});
$('#export-issues').addEventListener('click',()=>download(exportIssues(report.issues),'lote-incidencias.csv'));
$('#export-json').addEventListener('click',()=>download(JSON.stringify({createdAt:new Date().toISOString(),profile:schema.name,normalized:$('#normalize').checked,...report},null,2),'lote-reporte.json','application/json'));
try{
  const response=await fetch('rules.json');if(!response.ok)throw new Error('No se pudo cargar el perfil.');schema=await response.json();
  $('#rules-list').innerHTML=schema.fields.map(field=>`<article class="rule"><strong>${escape(field.label)}</strong><small>${field.key}</small><p>${escape(field.hint)}</p></article>`).join('');
  controls.forEach(control=>control.disabled=false);
  loadText(errorSample,'Ejemplo con errores');
}catch(error){toast(error.message);$('#results-title').textContent='No se pudo iniciar la revisión';document.querySelectorAll('button').forEach(button=>button.disabled=true);}
