
(function(){
const D=window.CALCULATOR_DATA||{}; const cat=document.body.dataset.category; const items=D[cat]||[];
const nav=document.getElementById('calc-nav'), main=document.getElementById('calc-main');
function inputHTML(f){const [id,label,unit,val]=f;if(String(unit).startsWith('select:')){const opts=unit.slice(7).split('|');return `<div class="calc-field"><label for="${id}">${label}</label><select id="${id}" name="${id}">${opts.map(o=>`<option value="${o}">${o}</option>`).join('')}</select></div>`}return `<div class="calc-field"><label for="${id}">${label} <span>(${unit})</span></label><input id="${id}" name="${id}" type="number" step="any" value="${val??''}" required></div>`}
items.forEach((it,i)=>{const [id,title,formula,desc,fields,fn]=it;const b=document.createElement('button');b.textContent=title;b.dataset.target=id;if(i===0)b.className='active';nav.appendChild(b);const p=document.createElement('section');p.className='calc-panel'+(i===0?' active':'');p.id=id;p.innerHTML=`<h2>${title}</h2><p>${desc}</p><div class="formula">${formula}</div><form data-fn="${fn}" data-calculator-id="${id}" data-calculator-title="${title}"><div class="calc-fields">${fields.map(inputHTML).join('')}</div><div class="calc-actions"><button class="calc-btn" type="submit">Calculate</button><button class="calc-btn secondary" type="reset">Reset</button></div><div class="calc-error" role="alert"></div><div class="calc-result" aria-live="polite"></div></form>${cat==='chemical'?`<section class="calc-history" data-history-for="${id}"><div class="calc-history-head"><div><p class="history-kicker">Saved in this browser</p><h3>Calculation History</h3></div><button class="clear-history-btn" type="button" data-clear-history="${id}">Clear History</button></div><div class="calc-history-list"></div></section>`:''}`;main.appendChild(p)});
nav.addEventListener('click',e=>{if(e.target.tagName!=='BUTTON')return;nav.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===e.target));main.querySelectorAll('.calc-panel').forEach(x=>x.classList.toggle('active',x.id===e.target.dataset.target));history.replaceState(null,'','#'+e.target.dataset.target)});

const HISTORY_PREFIX='epcChemicalHistory:';
const HISTORY_LIMIT=30;
function historyKey(id){return HISTORY_PREFIX+id}
function loadHistory(id){try{const value=JSON.parse(localStorage.getItem(historyKey(id))||'[]');return Array.isArray(value)?value:[]}catch{return[]}}
function saveHistory(id,entry){const rows=loadHistory(id);rows.unshift(entry);localStorage.setItem(historyKey(id),JSON.stringify(rows.slice(0,HISTORY_LIMIT)));renderHistory(id)}
function inputSnapshot(form){return Array.from(form.elements).filter(el=>el.name&&['INPUT','SELECT'].includes(el.tagName)).map(el=>{const label=form.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent.trim()||el.name;return{label,value:el.value}})}
function escapeHistory(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderHistory(id){const section=main.querySelector(`[data-history-for="${id}"]`);if(!section)return;const list=section.querySelector('.calc-history-list'),rows=loadHistory(id);section.querySelector('.clear-history-btn').disabled=rows.length===0;if(!rows.length){list.innerHTML='<p class="history-empty">No saved calculations yet. Each successful result will appear here for comparison.</p>';return}list.innerHTML=rows.map((row,index)=>`<article class="history-card"><div class="history-card-top"><span>Run ${rows.length-index}</span><time datetime="${escapeHistory(row.iso)}">${escapeHistory(row.displayTime)}</time></div><div class="history-result"><small>Result</small><strong>${escapeHistory(row.result)}</strong></div><details><summary>View inputs</summary><div class="history-inputs">${row.inputs.map(item=>`<div><b>${escapeHistory(item.label)}</b><span>${escapeHistory(item.value)}</span></div>`).join('')}</div></details></article>`).join('')}
function clearHistory(id){localStorage.removeItem(historyKey(id));renderHistory(id)}
main.addEventListener('click',event=>{const button=event.target.closest('[data-clear-history]');if(!button)return;const id=button.dataset.clearHistory;if(window.confirm('Clear all saved calculations for this calculator?'))clearHistory(id)});
if(cat==='chemical')items.forEach(item=>renderHistory(item[0]));
function v(form,id){const e=form.elements[id];const n=Number(e.value);if(!Number.isFinite(n))throw new Error(`Enter a valid value for ${id}.`);return n} const g=9.80665;

const U={
 flowToM3h:(x,u)=>x*({'m3/h':1,'m3/d':1/24,'L/s':3.6,'US gpm':0.227124707,'bbl/d':0.0066244706,'L/h':0.001,'L/d':0.001/24,'US gph':0.0037854118,'US gpd':0.0037854118/24}[u]),
 flowFromM3h:(x,u)=>x/({'m3/h':1,'m3/d':1/24,'L/s':3.6,'US gpm':0.227124707,'bbl/d':0.0066244706,'L/h':0.001,'L/d':0.001/24,'US gph':0.0037854118,'US gpd':0.0037854118/24}[u]),
 rho:(x,u)=>x*({'kg/m3':1,'kg/L':1000,'lb/ft3':16.0184634,'lb/galUS':119.826427}[u]),
 massFromKgh:(x,u)=>x/({'kg/h':1,'kg/d':1/24,'g/h':0.001,'lb/h':0.45359237,'lb/d':0.45359237/24}[u]),
 volToL:(x,u)=>x*({'mL':0.001,'L':1,'m3':1000,'US gal':3.785411784}[u]),
 volFromL:(x,u)=>x/({'mL':0.001,'L':1,'m3':1000,'US gal':3.785411784}[u]),
 timeH:(x,u)=>x*({'s':1/3600,'min':1/60,'h':1,'d':24}[u]),
 Pa:(x,u)=>x*({bar:1e5,kPa:1e3,MPa:1e6,psi:6894.757293}[u]),
 fromPa:(x,u)=>x/({bar:1e5,kPa:1e3,MPa:1e6,psi:6894.757293}[u])};
function sv(form,id){return form.elements[id].value}

const f={

chemDoseSolution:x=>{let q=U.flowToM3h(v(x,'flow'),sv(x,'flowUnit')),ma=v(x,'dose')*q*U.rho(v(x,'procRho'),sv(x,'procRhoUnit'))/1e6,qs=ma/(U.rho(v(x,'solRho'),sv(x,'solRhoUnit'))*v(x,'conc')/100),u=sv(x,'outUnit');return[U.flowFromM3h(qs,u),u]},
chemMassFlexible:x=>{let m=v(x,'dose')*U.flowToM3h(v(x,'flow'),sv(x,'flowUnit'))*U.rho(v(x,'rho'),sv(x,'rhoUnit'))/1e6,u=sv(x,'outUnit');return[U.massFromKgh(m,u),u]},
chemAchievedDose:x=>{let ma=U.flowToM3h(v(x,'inj'),sv(x,'injUnit'))*U.rho(v(x,'solRho'),sv(x,'solRhoUnit'))*v(x,'conc')/100,mp=U.flowToM3h(v(x,'procFlow'),sv(x,'procFlowUnit'))*U.rho(v(x,'procRho'),sv(x,'procRhoUnit'));return[ma/mp*1e6,'ppm(wt)']},
chemPumpCapacity:x=>{let q=U.flowToM3h(v(x,'normal'),sv(x,'normalUnit'))*(1+v(x,'margin')/100),u=sv(x,'outUnit');return[U.flowFromM3h(q,u),u]},
chemTurndown:x=>{let r=U.flowToM3h(v(x,'rated'),sv(x,'ratedUnit')),mn=U.flowToM3h(v(x,'minimum'),sv(x,'minUnit')),n=U.flowToM3h(v(x,'normal'),sv(x,'normalUnit')),ms=mn/r*100;return[`${(r/mn).toFixed(2)}:1; normal setting ${(n/r*100).toFixed(2)}%; minimum setting ${ms.toFixed(2)}% (${ms>=v(x,'vendorMin')?'acceptable':'below vendor minimum'})`,'']},
chemTankVolume:x=>{let L=U.flowToM3h(v(x,'q'),sv(x,'qUnit'))*U.timeH(v(x,'time'),sv(x,'timeUnit'))*1000/(v(x,'usable')/100),u=sv(x,'outUnit');return[U.volFromL(L,u),u]},
chemTankAutonomy:x=>{let h=U.volToL(v(x,'volume'),sv(x,'volumeUnit'))*v(x,'usable')/100/(U.flowToM3h(v(x,'q'),sv(x,'qUnit'))*1000),u=sv(x,'outUnit');return[u==='d'?h/24:h,u]},
chemDilution:x=>{let L=U.volToL(v(x,'final'),sv(x,'volUnit'));if(v(x,'c2')>v(x,'c1'))throw new Error('Final strength cannot exceed concentrate strength.');let c=L*v(x,'c2')/v(x,'c1'),u=sv(x,'volUnit');return[`Concentrate ${U.volFromL(c,u).toFixed(3)} ${u}; diluent ${U.volFromL(L-c,u).toFixed(3)} ${u}`,'']},
chemCalibration:x=>{let L=U.volToL(v(x,'vol'),sv(x,'volUnit')),h=U.timeH(v(x,'time'),sv(x,'timeUnit')),u=sv(x,'outUnit');if(u==='mL/min')return[L/(h*60),u];return[U.flowFromM3h(L/1000/h,u),u]},
chemStroke:x=>{let p=U.flowToM3h(v(x,'required'),sv(x,'requiredUnit'))/U.flowToM3h(v(x,'rated'),sv(x,'ratedUnit'))*100;if(p>100)throw new Error('Required flow exceeds rated flow.');return[p,'% setting']},
chemPressure:x=>{let h=v(x,'staticH')*(sv(x,'staticUnit')==='ft'?0.3048:1),pa=U.Pa(v(x,'lineP'),sv(x,'linePUnit'))+U.rho(v(x,'rho'),sv(x,'rhoUnit'))*g*h+U.Pa(v(x,'lineLoss'),sv(x,'lossUnit'))+U.Pa(v(x,'deviceLoss'),sv(x,'deviceUnit'))+U.Pa(v(x,'margin'),sv(x,'marginUnit')),u=sv(x,'outUnit');return[U.fromPa(pa,u),u]},
chemPower:x=>{let W=U.Pa(v(x,'dp'),sv(x,'dpUnit'))*U.flowToM3h(v(x,'q'),sv(x,'qUnit'))/3600/(v(x,'eff')/100),u=sv(x,'outUnit');return[u==='kW'?W/1000:u==='hp'?W/745.699872:W,u]},
chemInventory:x=>{let kg=U.volToL(v(x,'volume'),sv(x,'volumeUnit'))*U.rho(v(x,'rho'),sv(x,'rhoUnit'))/1000,u=sv(x,'outUnit');return[u==='tonne'?kg/1000:u==='lb'?kg/0.45359237:kg,u]},
chemRefill:x=>{let q=U.flowToM3h(v(x,'q'),sv(x,'qUnit'))*1000,L=U.volToL(v(x,'usable'),sv(x,'volumeUnit')),ph=U.timeH(v(x,'period'),sv(x,'periodUnit')),ih=L/q;return[`interval ${(ih/24).toFixed(2)} d (${ih.toFixed(1)} h); about ${Math.ceil(ph/ih)} refills; period consumption ${(q*ph).toFixed(1)} L`,'']},

head:x=>[(((v(x,'p2')-v(x,'p1'))*1e5)/(v(x,'rho')*g)+v(x,'dz')),'m'],hydPower:x=>[v(x,'rho')*g*(v(x,'q')/3600)*v(x,'h')/1000,'kW'],shaftPower:x=>[v(x,'rho')*g*(v(x,'q')/3600)*v(x,'h')/1000/(v(x,'eff')/100),'kW'],motorPower:x=>[v(x,'shaft')*v(x,'sf')/(v(x,'meff')/100),'kW'],npsha:x=>[((v(x,'ps')-v(x,'pv'))*1e5/(v(x,'rho')*g)+v(x,'static')-v(x,'loss')),'m'],affinity:x=>{let r=v(x,'n2')/v(x,'n1');return [`Q₂ ${(v(x,'q1')*r).toFixed(3)} m³/h; H₂ ${(v(x,'h1')*r*r).toFixed(3)} m; P₂ ${(v(x,'pwr1')*r*r*r).toFixed(3)} kW`,'']},specificSpeed:x=>[v(x,'n')*Math.sqrt(v(x,'q')/3600)/Math.pow(v(x,'h'),.75),'metric Ns'],velocity:x=>[(v(x,'q')/3600)/(Math.PI*Math.pow(v(x,'d')/1000,2)/4),'m/s'],reynolds:x=>{let r=v(x,'rho')*v(x,'v')*(v(x,'d')/1000)/(v(x,'mu')/1000);return [`${r.toFixed(0)} (${r<2300?'laminar':r<4000?'transitional':'turbulent'})`,'']},friction:x=>[.25/Math.pow(Math.log10((v(x,'rough')/1000)/(3.7*(v(x,'d')/1000))+5.74/Math.pow(v(x,'re'),.9)),2),'Darcy f'],darcy:x=>[v(x,'f')*(v(x,'l')/(v(x,'d')/1000))*(v(x,'rho')*v(x,'v')**2/2)/1e5,'bar'],flowFromVelocity:x=>[v(x,'v')*Math.PI*Math.pow(v(x,'d')/1000,2)/4*3600,'m³/h'],pipeVolume:x=>[Math.PI*Math.pow(v(x,'d')/1000,2)/4*v(x,'l'),'m³'],gasDensity:x=>[v(x,'p')*1e5*v(x,'mw')/(v(x,'z')*8314.462618*(v(x,'t')+273.15)),'kg/m³'],actualFlow:x=>[v(x,'qs')*(v(x,'ps')/v(x,'pa'))*((v(x,'ta')+273.15)/(v(x,'ts')+273.15))*(v(x,'za')/v(x,'zs')),'actual m³/h'],ratio:x=>[v(x,'p2')/v(x,'p1'),'-'],compTemp:x=>{let T=v(x,'t1')+273.15,r=v(x,'p2')/v(x,'p1'),k=v(x,'k'),tis=T*Math.pow(r,(k-1)/k),ta=T+(tis-T)/(v(x,'eff')/100);return [`Ideal ${(tis-273.15).toFixed(2)} °C; actual ${(ta-273.15).toFixed(2)} °C`,'']},compPower:x=>{let k=v(x,'k'),R=8314.462618/v(x,'mw'),T=v(x,'t1')+273.15,r=v(x,'p2')/v(x,'p1');return [v(x,'m')*(k/(k-1))*R*T*(Math.pow(r,(k-1)/k)-1)/(v(x,'eff')/100)/1000,'kW']},stages:x=>[Math.ceil(Math.log(v(x,'p2')/v(x,'p1'))/Math.log(v(x,'rmax'))),'stages'],chemMass:x=>[v(x,'dose')*v(x,'flow')*v(x,'rho')/1e6,'kg/h active'],injectFlow:x=>[v(x,'mass')/(v(x,'rho')*(v(x,'conc')/100)),'L/h'],pumpCapacity:x=>[v(x,'normal')*(1+v(x,'margin')/100),'L/h'],tankAutonomy:x=>[v(x,'q')*v(x,'hours')/(v(x,'usable')/100),'L'],calPot:x=>[v(x,'vol')/1000/(v(x,'time')/3600),'L/h'],dilution:x=>{let vc=v(x,'final')*v(x,'c2')/v(x,'c1');return [`Concentrate ${vc.toFixed(3)} L; diluent ${(v(x,'final')-vc).toFixed(3)} L`,'']},verticalTank:x=>[Math.PI*v(x,'d')**2/4*v(x,'h'),'m³'],workingVolume:x=>[v(x,'gross')*v(x,'usable')/100,'m³'],retention:x=>[v(x,'v')/v(x,'q'),'h'],fillTime:x=>[v(x,'v')/(v(x,'qin')-v(x,'qout')),'h'],bund:x=>[v(x,'l')*v(x,'w')*v(x,'h')-v(x,'disp'),'m³ net'],inventoryMass:x=>[v(x,'rho')*v(x,'v')/1000,'tonnes'],sensible:x=>[v(x,'m')*v(x,'cp')*(v(x,'tout')-v(x,'tin')),'kW'],lmtd:x=>{let a=v(x,'th_in')-v(x,'tc_out'),b=v(x,'th_out')-v(x,'tc_in');return [Math.abs(a-b)<1e-9?a:(a-b)/Math.log(a/b),'K']},hxArea:x=>[v(x,'q')*1000/(v(x,'u')*v(x,'f')*v(x,'lmtd')),'m²'],utilityFlow:x=>[v(x,'q')/(v(x,'cp')*v(x,'dt')),'kg/s'],latentFlow:x=>[v(x,'q')/v(x,'latent'),'kg/s'],effectiveness:x=>[v(x,'q')/(Math.min(v(x,'ch'),v(x,'cc'))*(v(x,'th')-v(x,'tc')))*100,'%'],maScale:x=>[v(x,'lrv')+(v(x,'ma')-4)/16*(v(x,'urv')-v(x,'lrv')),'engineering units'],euMa:x=>[4+16*(v(x,'pv')-v(x,'lrv'))/(v(x,'urv')-v(x,'lrv')),'mA'],dpLevel:x=>[v(x,'dp')*100/(v(x,'rho')*g),'m'],gaugeAbs:x=>[v(x,'pg')+v(x,'patm'),'bar(a)'],rangePct:x=>[(v(x,'pv')-v(x,'lrv'))/(v(x,'urv')-v(x,'lrv'))*100,'% span'],sqrtFlow:x=>[v(x,'qmax')*Math.sqrt(v(x,'dp')/v(x,'dpmax')),'m³/h'],
pressureConvert:x=>convert(x,{bar:1e5,kPa:1e3,MPa:1e6,psi:6894.757293,'kgf/cm2':98066.5,mH2O:9806.65}),flowConvert:x=>convert(x,{'m3/h':1/3600,'L/s':.001,'L/min':1/60000,'US gpm':0.0000630901964,'ft3/min':0.00047194745}),powerConvert:x=>convert(x,{kW:1000,MW:1e6,hp:745.699872,'BTU/h':.29307107}),massFlowConvert:x=>convert(x,{'kg/h':1/3600,'kg/s':1,'t/h':1000/3600,'lb/h':.45359237/3600}),viscConvert:x=>convert(x,{cP:.001,'mPa.s':.001,'Pa.s':1,'lb/ft.s':1.48816394}),tempConvert:x=>{let z=v(x,'value'),a=x.elements.from.value,b=x.elements.to.value;let K=a==='C'?z+273.15:a==='F'?(z-32)*5/9+273.15:z;let o=b==='C'?K-273.15:b==='F'?(K-273.15)*9/5+32:K;return[o,b]}
};
function convert(x,map){let a=x.elements.from.value,b=x.elements.to.value;return[v(x,'value')*map[a]/map[b],b]}
main.addEventListener('submit',e=>{e.preventDefault();const form=e.target,res=form.querySelector('.calc-result'),err=form.querySelector('.calc-error');try{const fn=form.dataset.fn;if(!f[fn])throw new Error('Calculator function is unavailable.');let [val,unit]=f[fn](form);if(typeof val==='number'&&!Number.isFinite(val))throw new Error('Inputs produce an undefined result. Check zero, negative or incompatible values.');const shown=typeof val==='number'?Number(val.toPrecision(8)).toLocaleString(undefined,{maximumFractionDigits:6}):val;res.innerHTML=`<span>Calculated result</span><strong>${shown} ${unit}</strong>`;res.classList.add('show');err.classList.remove('show');if(cat==='chemical'){const now=new Date();saveHistory(form.dataset.calculatorId,{iso:now.toISOString(),displayTime:now.toLocaleString(),result:`${shown} ${unit}`.trim(),inputs:inputSnapshot(form)})}}catch(ex){err.textContent=ex.message;err.classList.add('show');res.classList.remove('show')}});
main.addEventListener('reset',e=>{setTimeout(()=>{e.target.querySelector('.calc-result').classList.remove('show');e.target.querySelector('.calc-error').classList.remove('show')},0)});

const pageTabs=document.querySelectorAll('[data-page-tab]');
function showPageTab(target){
  pageTabs.forEach(btn=>btn.classList.toggle('active',btn.dataset.pageTab===target));
  document.querySelectorAll('[data-tab-panel]').forEach(panel=>{panel.hidden=panel.dataset.tabPanel!==target});
}
function openCalculator(calculatorId,updateHistory=true){
  const button=nav.querySelector(`[data-target="${calculatorId}"]`);
  const panel=document.getElementById(calculatorId);
  if(!button||!panel)return false;
  showPageTab('calculators');
  nav.querySelectorAll('button').forEach(item=>item.classList.toggle('active',item===button));
  main.querySelectorAll('.calc-panel').forEach(item=>item.classList.toggle('active',item.id===calculatorId));
  if(updateHistory)history.replaceState(null,'',`#${calculatorId}`);
  requestAnimationFrame(()=>panel.scrollIntoView({behavior:'smooth',block:'start'}));
  return true;
}
pageTabs.forEach(btn=>btn.addEventListener('click',()=>showPageTab(btn.dataset.pageTab)));
document.addEventListener('click',event=>{
  const link=event.target.closest('[data-tab-panel="steps"] a[href^="#"]');
  if(!link)return;
  const calculatorId=decodeURIComponent(link.getAttribute('href').slice(1));
  if(openCalculator(calculatorId,true))event.preventDefault();
});
window.addEventListener('hashchange',()=>{
  const calculatorId=location.hash.slice(1);
  if(calculatorId)openCalculator(calculatorId,false);
});
const hash=location.hash.slice(1);if(hash)openCalculator(hash,false);
})();
