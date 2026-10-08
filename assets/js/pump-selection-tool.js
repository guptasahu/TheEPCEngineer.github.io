document.addEventListener('DOMContentLoaded',()=>{
const form=document.getElementById('selector-form'),result=document.getElementById('result'),placeholder=document.getElementById('placeholder');
const num=(d,n)=>Number(d.get(n)||0), yes=(d,n)=>d.get(n)==='on';
function add(a,x){if(x&&!a.includes(x))a.push(x)}
function selectPump(d){
 const service=d.get('service'), installation=d.get('installation'), hazard=d.get('hazard');
 const P=num(d,'power'), ps=num(d,'suctionPressure'), pd=num(d,'dischargePressure'), tmin=num(d,'minTemp'), tmax=num(d,'maxTemp'), vp=num(d,'vaporPressure'), lift=num(d,'suctionLift'), visc=num(d,'viscosity'), solids=num(d,'solids'), h2s=num(d,'h2s');
 const vertical=yes(d,'horizontalProhibited')||yes(d,'spaceLimited'), highHaz=hazard==='highly'||['acid','caustic','hypo','rich_amine'].includes(service)||h2s>500||yes(d,'autoIgnition');
 const apiTriggers=pd>1900||ps>520||tmin<0||tmax>120||vp>=205||P>112||yes(d,'betweenBearing');
 let type='',standard='',family='',basis=[],checks=[],flags=[];
 add(checks,'Confirm rated and normal flow against the vendor BEP and allowable operating region.');
 add(checks,'Verify NPSHA from minimum suction pressure and vapor pressure at maximum pumping temperature.');
 add(checks,'Check material and mechanical-seal selection separately; this tool does not finalize metallurgy or seal plan.');
 if(service==='firewater'){
   family='Main firewater pump'; standard='NFPA 20 plus applicable SAES-B-017 / SAES-B-009 / SAES-B-060 / SAES-M-100';
   type=vertical?'Vertical suspended firewater pump':'Horizontal firewater pump';
   basis.push('Main firewater service governs before normal process-pump selection.','Maximum main firewater pump speed is 1,800 rpm.');
   checks.push('Confirm one of the NFPA 20 rated capacities and performance through 150% of rated flow.','Check NPSH or minimum submergence at 150% of rated flow.');
 } else if(service==='jockey'){
   family='Firewater jockey pump';
   if(installation==='open_sump'||vertical){type='Vertical suspended jockey pump';standard='Manufacturer standard design for qualifying vertical-suspended/non-industrial jockey service';}
   else {type=vertical?'Vertical in-line jockey pump':'Horizontal end-suction jockey pump';standard=vertical?'ASME B73.2 or ISO 2858 + ISO 5199':'ASME B73.1 or ISO 2858 + ISO 5199';}
   basis.push('Jockey pumps maintain firewater-header pressure and use the dedicated jockey-pump branch.');
 } else if(service==='sewage'&&P<=37){
   family='Domestic sewage/community-water pump';type=installation==='open_sump'?'Vendor-standard sewage or self-priming pump':'Manufacturer standard centrifugal pump';standard='Manufacturer standard design; SAES-G-005 compliance not required within stated scope';
   basis.push('Driver rating is at or below 37 kW for domestic sewage or community-water service.');
   if(installation==='open_sump'&&lift>6)flags.push('Suction lift exceeds 6 m; do not use the self-priming exception. Select a vertical-suspended arrangement.');
 } else if(installation==='open_sump'||['storm','oily_sump'].includes(service)){
   family='Open-sump pump';
   const flammable=hazard==='flammable'||service==='hydrocarbon';
   const selfOK=!flammable&&lift<=6&&yes(d,'selfPrimingFeasible')&&P<=112;
   if(selfOK){type='Horizontal direct-drive self-priming pump';standard='Vendor standard design plus SAES-G-005 self-priming requirements';basis.push('Non-flammable open-sump service, suction lift not above 6 m, and vendor confirms hydraulic/NPSH capability.');checks.push('Provide an integral priming chamber and automatic air release/continuous bleed upstream of the discharge check valve.');}
   else {type='Vertical suspended, discharge-through-column pump (typically VS1/VS2)';standard=(service==='storm'&&P<225&&!flammable)?'Vendor standard design with SAES-G-005 requirements':'API 610 / 31-SAMSS-004';basis.push(flammable?'Self-priming pumps are not permitted for flammable hydrocarbon service.':'Self-priming criteria are not fully satisfied.');checks.push('Do not use separate side-discharge VS4/VS5 for hydrocarbon or oily-water sump service.');}
 } else if(['acid','caustic','hypo'].includes(service)){
   family='Highly hazardous chemical-service pump';
   if(P<=225){type=vertical?'Vertical in-line sealless pump':'Horizontal sealless pump';standard=apiTriggers?'API 685 / 31-SAMSS-685':'ASME B73.3 or ISO 15783';basis.push('Acid, caustic and sodium hypochlorite services require sealless selection within the stated power range.');}
   else {type='Pump with dual pressurized mechanical seals (Arrangement 3)';standard='API 610 / 31-SAMSS-004 plus API 682 / 31-SAMSS-012';flags.push('Estimated driver exceeds 225 kW sealless limit; confirm sealed-pump design with the project pump specialist.');}
 } else if(highHaz){
   family='Highly hazardous liquid pump';
   const seallessFeasible=P<=225&&solids<=0.25&&visc>=0.3&&visc<=200&&!(yes(d,'magneticParticles')&&!yes(d,'magneticFiltration'));
   if(seallessFeasible){type=vertical?'Vertical in-line sealless/canned-motor pump':'Horizontal sealless pump (canned motor or magnetic drive)';standard=apiTriggers||P>112?'API 685 / 31-SAMSS-685':'ASME B73.3 or ISO 15783';basis.push('Service is highly hazardous and the entered solids, viscosity and magnetic-particle conditions do not preclude preliminary sealless selection.');}
   else {type='API process pump with dual pressurized seals, Arrangement 3';standard='API 610 / 31-SAMSS-004 plus API 682 / 31-SAMSS-012';basis.push('One or more entered conditions are outside the normal preliminary sealless selection envelope.');flags.push('Vendor experience and Pump Group review are required if a sealless pump is proposed outside the stated solids, viscosity, magnetic-particle or power limits.');}
 } else if(service==='cooling'&&P<=225&&!apiTriggers){
   family='Cooling/utility-water pump';type=vertical?'Vertical in-line centrifugal pump':'Vendor-standard horizontal centrifugal pump';standard=vertical?'ASME B73.2 or ISO 5199':'Manufacturer standard design';basis.push('Cooling/utility-water service is within the preliminary 225 kW limit and no API escalation trigger was entered.');
 } else if(service==='sulfur'){
   family='Molten-sulfur pump';type=vertical?'Vertical suspended sulfur pump':'Horizontal sulfur-service pump';standard=apiTriggers?'API 610 / 31-SAMSS-004':'Project-approved sulfur pump design with SAES-G-005 requirements';basis.push('Sulfur service requires dedicated materials, heating and seal review.');checks.push('Vertically suspended sulfur pumps shall use closed impellers.');
 } else if(['lean_amine','rich_amine','teg'].includes(service)){
   family='Amine/glycol process pump';
   if(service==='rich_amine'||highHaz){type=vertical?'Vertical in-line API process pump with suitable containment':'Horizontal API process pump with suitable containment';standard='API 610 / 31-SAMSS-004 plus API 682 / 31-SAMSS-012';basis.push('Rich-amine/high-hazard service requires API process-pump and containment review.');}
   else {type=vertical?'Vertical in-line process pump':'Horizontal end-suction process pump';standard=apiTriggers?'API 610 / 31-SAMSS-004':'ASME B73.1/B73.2 or ISO 2858 + ISO 5199';basis.push('Lean amine/TEG follows the normal service and API escalation checks.');}
 } else {
   family='General process centrifugal pump';
   if(apiTriggers){type=vertical?(yes(d,'betweenBearing')?'Vertical suspended/double-casing API pump':'Vertical in-line API pump'):(yes(d,'betweenBearing')?'Between-bearing API pump':'Horizontal API process pump');standard='API 610 / 31-SAMSS-004';basis.push('At least one Appendix A API escalation trigger is present: pressure, temperature, vapor pressure, driver rating, or pump configuration.');}
   else {type=vertical?'Vertical in-line process pump':'Horizontal end-suction process pump';standard=vertical?'ASME B73.2 or ISO 5199':'ASME B73.1 or ISO 2858 + ISO 5199';basis.push('Entered limits remain within the preliminary ASME/ISO branch and horizontal arrangement is feasible unless otherwise selected.');}
 }
 if(yes(d,'parallel'))checks.push('For parallel pumps, match rated and shutoff heads within 3% and provide at least 10% head rise to shutoff.');
 if(yes(d,'variableDuty'))checks.push('Evaluate variable speed or an alternate pump configuration where normal flow/head varies significantly.');
 if(P>225&&type.toLowerCase().includes('overhung'))flags.push('Horizontal single-stage overhung pumps are not acceptable above 225 kW.');
 if(num(d,'flow')>600&&type.toLowerCase().includes('overhung'))flags.push('Horizontal single-stage overhung pumps are not acceptable above 600 m³/h rated flow.');
 if(tmax<tmin)flags.push('Maximum temperature is below minimum temperature. Correct the input data.');
 return {family,type,standard,basis,checks,flags,summary:{service,installation,flow:num(d,'flow'),head:num(d,'head'),power:P,ps,pd,tmin,tmax,vp,visc,solids,h2s}};
}
function esc(x){return String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function render(r){result.innerHTML=`<p class="result-kicker">Preliminary recommendation</p><h2>${esc(r.family)}</h2><div class="selection-banner"><span>Recommended pump arrangement</span><strong>${esc(r.type)}</strong></div><div class="standard-box"><span>Governing pump standard</span><br><strong>${esc(r.standard)}</strong></div><div class="result-section"><h3>Selection basis</h3><ul>${r.basis.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div class="result-section"><h3>Mandatory next checks</h3><ul>${r.checks.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>${r.flags.map(x=>`<div class="flag critical">${esc(x)}</div>`).join('')}<div class="result-section"><h3>Entered duty</h3><ul><li>${esc(r.summary.flow)} m³/h at ${esc(r.summary.head)} m differential head</li><li>Estimated driver: ${esc(r.summary.power)} kW</li><li>Suction/discharge: ${esc(r.summary.ps)} / ${esc(r.summary.pd)} kPa(g)</li><li>Temperature range: ${esc(r.summary.tmin)} to ${esc(r.summary.tmax)} °C</li></ul></div><button class="print-btn" type="button" onclick="window.print()">Print / Save Preliminary Report</button><p class="fine-print">Reference basis: SAES-G-005, Appendix A and related clauses. This output is preliminary and must be checked against the latest approved standard and project requirements.</p>`;placeholder.hidden=true;result.hidden=false;}
form.addEventListener('submit',e=>{e.preventDefault();render(selectPump(new FormData(form)));result.scrollIntoView({behavior:'smooth',block:'start'})});form.addEventListener('reset',()=>setTimeout(()=>{result.hidden=true;placeholder.hidden=false},0));
});