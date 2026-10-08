document.addEventListener('DOMContentLoaded',()=>{
const form=document.getElementById('selector-form'),res=document.getElementById('result'),ph=document.getElementById('placeholder');
const number=(d,k)=>Number(d.get(k)||0), has=(d,k)=>d.get(k)==='on', optional=(d,k)=>d.get(k)===''?null:Number(d.get(k));
const escapeHTML=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function evaluate(d){
 const service=d.get('service'),installation=d.get('installation'),declaredFlam=d.get('flammability'),revision=d.get('revision');
 const flow=number(d,'flow'),head=number(d,'head'),lift=number(d,'lift'),ps=number(d,'ps'),pd=number(d,'pd'),tmin=number(d,'tmin'),tmax=number(d,'tmax'),vp=number(d,'vp'),power=number(d,'power');
 const flash=optional(d,'flashPoint'),gasoline=d.get('gasoline'),h2s=number(d,'h2s'),ait=optional(d,'ait'),solids=number(d,'solids'),viscosity=number(d,'viscosity'),aromatics=number(d,'aromatics'),benzene=number(d,'benzene');
 const npsha120=optional(d,'npsha120'),npsh3Rated=optional(d,'npsh3Rated'),npsh3120=optional(d,'npsh3120');
 const derivedFlammable=flash!==null&&(flash<=54||tmax>=flash-8);
 const flammable=declaredFlam==='flammable'||derivedFlammable;
 const nonFlammable=declaredFlam==='nonflammable'&&!derivedFlammable;
 const revisionUncertain=false;
 const aromaticTrigger=gasoline==='no'&&aromatics>25;
 const benzeneTrigger=(gasoline==='no'&&benzene>1)||(gasoline==='yes'&&benzene>5);
 const h2sTrigger=service!=='lean_amine'&&h2s>500;
 const autoIgnitionTrigger=ait!==null&&tmax>ait;
 const api682Trigger=d.get('api682')==='arr3';
 const licensorTrigger=['sealless','arr3'].includes(d.get('licensor'));
 const automaticChemical=['acid','caustic','hypo'].includes(service);
 const consequence=['personnel','environment','fire'].includes(d.get('leak'));
 const unknownHazard=d.get('projectClass')==='unknown'||d.get('toxicity')==='unknown'||d.get('leak')==='unknown'||d.get('api682')==='unknown'||d.get('licensor')==='unknown'||declaredFlam==='unknown';
 const confirmedHazard=d.get('projectClass')==='confirmed'||automaticChemical||aromaticTrigger||benzeneTrigger||h2sTrigger||autoIgnitionTrigger||api682Trigger||licensorTrigger||consequence;
 let hazard=confirmedHazard?'confirmed':(d.get('projectClass')==='potential'||d.get('toxicity')==='toxic'||unknownHazard?'potential':'normal');
 const verticalBlocked=has(d,'horizontalProhibited')||has(d,'spaceLimited');
 const generalAsme=pd<=1900&&ps<=520&&tmin>=0&&tmax<=120&&vp<207&&power<=112;
 const hydrocarbonAsme=pd<=1900&&ps<=520&&tmin>=0&&tmax<=65&&vp<172&&power<=112;
 const apiRequired=has(d,'betweenBearing')||(service==='hydrocarbon'?!hydrocarbonAsme:!generalAsme);
 let family='',type='',standard='',basis=[],checks=[],warnings=[];

 if(declaredFlam==='nonflammable'&&derivedFlammable) warnings.push('The declared non-flammable status conflicts with the flash-point/temperature screening. Treat the liquid as flammable until Process/HSE confirms otherwise.');
 // Hydraulic arrangement first: storm water is always vertical; oily-water self-priming is a dedicated exception.
 if(service==='storm'){
   family='Storm-water sump pump'; type='Vertical suspended, discharge-through-column pump, typically VS1 or VS2';
   standard=power<225?'Vendor standard design meeting SAES-G-005 requirements':'API 610 / 31-SAMSS-004';
   basis.push('The attached revision requires storm-water sump pumps to be vertically suspended discharge-through-column designs.');
 } else if(service==='oily_sump'&&installation==='open_sump'){
   const hydraulicRange=has(d,'selfPriming');
   const horizontalAllowed=nonFlammable&&lift<=6&&hydraulicRange&&!verticalBlocked;
   family='Oily-water open-sump pump';
   if(horizontalAllowed){
     type='Horizontal direct-drive self-priming centrifugal pump'; standard='Vendor standard design plus SAES-G-005 self-priming requirements';
     basis.push('Oily-water open-sump service.','Liquid is non-flammable under the entered/derived classification.','Suction lift does not exceed 6 m.','Vendor flow, pressure and NPSH operating-range feasibility is confirmed.');
     checks.push('Priming chamber shall be an integral one-piece part of the pump casing; do not use an external conversion tank/chamber.');
     checks.push('Provide the required external-water priming system, solenoid valve and startup permissive.');
     if(has(d,'pressurizedDischarge')) checks.push('Provide an automatic air-release valve or continuous bleed with orifice upstream of the discharge check valve.');
     if(has(d,'extendedStandby')) checks.push('Provide continuous priming provisions so the suction chamber cannot lose priming fluid during extended standby.');
     if(has(d,'frequentDuty')) checks.push('Provide the required operating-to-standby priming connection upstream of the check valves.');
     if(!has(d,'integralChamber')) warnings.push('Integral one-piece priming chamber has not been confirmed.');
     if(!has(d,'externalWaterPriming')) warnings.push('External-water priming permissive/solenoid arrangement has not been confirmed.');
   } else {
     type='Vertical suspended, discharge-through-column pump, VS1 or VS2'; standard='API 610 / 31-SAMSS-004';
     if(flammable) basis.push('Flammable hydrocarbon/oily-water service excludes the horizontal self-priming branch.');
     if(lift>6) basis.push('Suction lift exceeds 6 m.');
     if(!hydraulicRange) basis.push('Flow, discharge pressure or NPSH is outside or not confirmed within the self-priming pump operating range.');
     if(verticalBlocked) basis.push('Suction conditions or space prohibit horizontal installation.');
     checks.push('Do not use VS4 or VS5 separate-discharge designs for hydrocarbon or oily-water open-sump service.');
   }
 } else if(service==='firewater'){
   family='Main firewater pump'; type=verticalBlocked?'Vertical suspended firewater pump':'Horizontal firewater pump'; standard='NFPA 20 plus applicable project firewater requirements';
 } else if(installation==='open_sump'){
   family='Other open-sump service'; type=verticalBlocked?'Vertical suspended pump':'Service-specific pump arrangement requires project review'; standard=apiRequired?'API 610 / 31-SAMSS-004':'Project-approved vendor standard';
   warnings.push('The attached horizontal self-priming mandate is specific to qualifying oily-water open-sump service; do not apply it automatically to every open sump.');
 } else if(hazard==='confirmed'){
   family='Appendix D highly hazardous liquid pump';
   const seallessFeasible=power<=225&&solids<=0.25&&viscosity>=0.3&&viscosity<=200&&!(has(d,'magneticParticles')&&!has(d,'magneticControl'))&&!has(d,'crystallizing')&&!has(d,'poorLubricity');
   if(seallessFeasible){type=verticalBlocked?'Vertical in-line sealless/canned-motor pump':'Horizontal sealless pump';standard=apiRequired?'API 685 / 31-SAMSS-685':'ASME B73.3 or ISO 15783';}
   else {type='API process pump with dual pressurized seals, Arrangement 3';standard='API 610 / 31-SAMSS-004 plus API 682 / 31-SAMSS-012';warnings.push('Entered duty/fluid conditions do not support automatic preliminary sealless selection.');}
 } else if(hazard==='potential'){
   family='Potentially highly hazardous service'; type='Do not finalize sealed versus sealless containment'; standard='Apply Appendix A provisionally, then obtain Process/HSE/Materials/Pump Specialist confirmation';
 } else if(apiRequired){
   family='General process centrifugal pump'; type=verticalBlocked?'Vertical API process pump':has(d,'betweenBearing')?'Between-bearing API pump':'Horizontal API process pump'; standard='API 610 / 31-SAMSS-004';
 } else {
   family='General process centrifugal pump'; type=verticalBlocked?'Vertical in-line process pump':'Horizontal end-suction process pump'; standard=verticalBlocked?'ASME B73.2 or ISO 5199':'ASME B73.1 or ISO 2858 + ISO 5199';
 }
 // NPSH compliance checks from attached revision.
 checks.push('Determine NPSHA at 120% of rated flow using minimum suction pressure, vapor pressure at maximum pumping temperature, and permanent-strainer pressure drop.');
 if(npsha120!==null&&npsh3Rated!==null&&npsha120-npsh3Rated<1) warnings.push('Entered NPSH margin at rated flow is below 1 m.');
 if(npsha120!==null&&npsh3120!==null&&npsh3120>npsha120) warnings.push('Vendor NPSH3 at 120% flow exceeds entered NPSHA at 120% flow.');
 if(d.get('strainerIncluded')==='no'||d.get('strainerIncluded')==='unknown') warnings.push('Permanent-strainer pressure drop is not confirmed in the NPSHA calculation.');
 checks.push('Confirm normal/rated duty relative to BEP, POR/AOR, minimum continuous stable flow, materials and sealing.');
 if(has(d,'parallel')) checks.push('Verify matched parallel curves, shutoff heads and stable combined operation.');
 return{hazard,family,type,standard,basis,checks,warnings,derivedFlammable,aromaticTrigger,benzeneTrigger,h2sTrigger,autoIgnitionTrigger,api682Trigger,licensorTrigger};
}
function render(r){const label=r.hazard==='confirmed'?'Appendix D screening: highly hazardous':r.hazard==='potential'?'Appendix D screening: specialist confirmation required':'Appendix D screening: no trigger entered';res.innerHTML=`<p class="kicker">Preliminary recommendation</p><div class="status ${r.hazard}">${escapeHTML(label)}</div><h2>${escapeHTML(r.family)}</h2><div class="decision">Recommended arrangement<strong>${escapeHTML(r.type)}</strong></div><div class="standard">Governing standard<br><strong>${escapeHTML(r.standard)}</strong></div><div class="result-section"><h3>Selection basis</h3><ul>${r.basis.map(x=>`<li>${escapeHTML(x)}</li>`).join('')||'<li>Normal Appendix A screening branch applied.</li>'}</ul></div><div class="result-section"><h3>Mandatory next checks</h3><ul>${r.checks.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</ul></div>${r.warnings.map(x=>`<div class="warning">${escapeHTML(x)}</div>`).join('')}<button type="button" class="print" onclick="window.print()">Print / Save report</button>`;ph.hidden=true;res.hidden=false;}
form.addEventListener('submit',ev=>{ev.preventDefault();render(evaluate(new FormData(form)));res.scrollIntoView({behavior:'smooth',block:'start'})});
form.addEventListener('reset',()=>setTimeout(()=>{res.hidden=true;ph.hidden=false},0));
});