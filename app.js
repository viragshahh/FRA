(() => {
'use strict';
const D=window.FRA_DATA;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
if(!D){document.body.innerHTML='<p>Project data could not be loaded.</p>';return;}
const titles={overview:'Executive Summary',data:'Data and Universe',selection:'Risk Scoring',regimes:'Market Regimes',backtest:'VaR Backtesting',optimization:'Markowitz Optimization','time-travel':'Time Travel Analysis',findings:'Findings and Limits'};
const views=['overview','data','selection','regimes','backtest','optimization','time-travel','findings'];
let presentationMode=false;
const regimeLabel={2020:'Stress period 2020',2023:'Calmer period 2023','18M':'Rolling 18 month TTM'};
let activePortfolio='High Risk';
function fmtPct(v,d=2){return Number.isFinite(Number(v))?(100*Number(v)).toFixed(d)+'%':'Not available';}
function fmtNum(v,d=3){return Number.isFinite(Number(v))?Number(v).toFixed(d):'Not available';}
function money(v){return Number.isFinite(Number(v))?'₹'+Math.round(Number(v)).toLocaleString('en-IN'):'Not available';}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function nav(view){$$('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+view));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.go===view));$('#crumb-title').textContent=titles[view]||titles.overview;if(view==='data')renderUniverse($('#universe-search').value);window.scrollTo({top:0,behavior:'smooth'});if(location.hash!=='#'+view)history.replaceState(null,'','#'+view);if(presentationMode)updatePresentationStatus();}
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>nav(b.dataset.go)));
function initTheme(){const saved=localStorage.getItem('fra-theme');if(saved==='dark')document.body.classList.add('theme-dark');$('#theme-toggle').textContent=document.body.classList.contains('theme-dark')?'Light mode':'Dark mode';$('#theme-toggle').setAttribute('aria-pressed',String(document.body.classList.contains('theme-dark')));}
initTheme();
const sidebarToggle=$('#sidebar-toggle');
function setSidebarCollapsed(collapsed){
 document.body.classList.toggle('sidebar-collapsed',collapsed);
 if(sidebarToggle){
  sidebarToggle.setAttribute('aria-expanded',String(!collapsed));
  sidebarToggle.setAttribute('aria-label',collapsed?'Expand navigation':'Collapse navigation');
  sidebarToggle.textContent=collapsed?'›':'‹';
 }
 try{localStorage.setItem('fra-sidebar-collapsed',collapsed?'true':'false');}catch(e){}
}
let savedSidebarState=null;
try{savedSidebarState=localStorage.getItem('fra-sidebar-collapsed');}catch(e){}
setSidebarCollapsed(savedSidebarState==='true');
sidebarToggle?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setSidebarCollapsed(!document.body.classList.contains('sidebar-collapsed'));});
$('#theme-toggle').addEventListener('click',()=>{document.body.classList.toggle('theme-dark');const dark=document.body.classList.contains('theme-dark');localStorage.setItem('fra-theme',dark?'dark':'light');$('#theme-toggle').textContent=dark?'Light mode':'Dark mode';$('#theme-toggle').setAttribute('aria-pressed',String(dark));});
$('#present-toggle').addEventListener('click',()=>{presentationMode=!presentationMode;document.body.classList.toggle('presentation-mode',presentationMode);$('#present-toggle').textContent=presentationMode?'Exit presentation':'Presentation mode';$('#present-toggle').setAttribute('aria-pressed',String(presentationMode));const s=$('#presentation-status');s.hidden=!presentationMode;if(presentationMode){s.innerHTML='<button type="button" id="present-prev" class="next-btn">← Previous section</button><span id="present-counter"></span><button type="button" id="present-next" class="next-btn">Next section →</button>';$('#present-prev').addEventListener('click',()=>movePresentation(-1));$('#present-next').addEventListener('click',()=>movePresentation(1));updatePresentationStatus();}});
function movePresentation(delta){const current=Math.max(0,views.findIndex(v=>$('#view-'+v)?.classList.contains('active')));const next=Math.max(0,Math.min(views.length-1,current+delta));nav(views[next]);updatePresentationStatus();}
function updatePresentationStatus(){const s=$('#presentation-status');if(!s||s.hidden)return;const current=Math.max(0,views.findIndex(v=>$('#view-'+v)?.classList.contains('active')));const label=views[current];$('#presentation-status').querySelector('#present-counter').textContent=(current+1)+' / '+views.length+' · '+titles[label];const prev=$('#present-prev'),next=$('#present-next');if(prev)prev.disabled=current===0;if(next)next.disabled=current===views.length-1;}
document.addEventListener('keydown',e=>{if(!presentationMode||['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();movePresentation(1);}if(e.key==='ArrowLeft'){e.preventDefault();movePresentation(-1);}});
function renderUniverse(query=''){const rows=D.risk.filter(r=>r.company.toLowerCase().includes(query.toLowerCase())).map(r=>'<tr><td><b>'+esc(r.company)+'</b></td><td>'+fmtNum(r.beta,2)+'</td><td>'+fmtPct(r.volatility)+'</td><td>'+fmtPct(r.drawdown)+'</td><td>'+esc(r.rank)+'</td></tr>').join('');$('#universe-table').innerHTML=rows||'<tr><td colspan="5">No companies match the search.</td></tr>';const ranked=[...D.risk].filter(r=>Number.isFinite(Number(r.rank))).sort((a,b)=>Number(a.rank)-Number(b.rank));if(ranked.length&&$('#universe-interpretation'))$('#universe-interpretation').textContent='Within our selected universe, '+ranked[0].company+' ranks first on the composite risk screen, while '+ranked[ranked.length-1].company+' ranks last. These are relative rankings within the 45 stocks we reviewed, not market-wide risk labels.';}
$('#universe-search').addEventListener('input',e=>renderUniverse(e.target.value));
function renderSelection(portfolio){activePortfolio=portfolio;$$('#selection-toggle button').forEach(b=>b.classList.toggle('selected',b.dataset.portfolio===portfolio));const holdings=D.portfolios[portfolio]||[];$('#selection-summary').textContent=portfolio+' contains ten selected holdings. Each baseline holding starts at 10 percent of the study capital.';$('#holdings-table').innerHTML=holdings.map(x=>'<tr><td>'+x.rank+'</td><td><b>'+esc(x.stock)+'</b></td><td>'+esc(x.sector)+'</td><td>'+fmtNum(x.score,1)+'</td><td>'+fmtPct(x.equalWeight,0)+'</td><td>'+money(x.investment)+'</td></tr>').join('');const scores=holdings.map(x=>Number(x.score)).filter(Number.isFinite);if(scores.length&&$('#selection-interpretation')){const mean=scores.reduce((a,b)=>a+b,0)/scores.length;$('#selection-interpretation').textContent=portfolio+' contains '+holdings.length+' holdings with a mean composite risk score of '+mean.toFixed(1)+'. The starting allocation is equal-weighted at 10% per holding; the score determines selection, while the later optimizer determines a separate allocation.';}}
$$('#selection-toggle button').forEach(b=>b.addEventListener('click',()=>renderSelection(b.dataset.portfolio)));
function selectedRegime(portfolio,regime){return D.regimes?.[portfolio]?.[regime]||{};}
const periodNames={'2020':'2020 crisis','2023':'2023 calm','18M':'Latest 18 months'};
function visiblePeriods(selector){return $$(selector+':checked').map(el=>el.value);}
function renderRegime(){
 const order=['2020','2023','18M'];
 const portfolios=['High Risk','Low Risk'];
 const chart=$('#regime-selection-chart');
 if(chart){
  chart.innerHTML=order.map(r=>{
   const maxVol=Math.max(.01,...order.flatMap(k=>portfolios.map(p=>Number(selectedRegime(p,k).annualizedVolatility)||0)));
   const rows=portfolios.map(p=>{
    const v=Number(selectedRegime(p,r).annualizedVolatility)||0;
    return '<div class="chart-bar-row"><span>'+p+'</span><div class="chart-track"><div class="chart-fill '+(p==='High Risk'?'high':'low')+'" style="width:'+Math.max(0,Math.min(100,100*v/maxVol))+'%"></div></div><b>'+fmtPct(v)+'</b></div>';
   }).join('');
   return '<div class="chart-group"><div class="chart-group-title">'+periodNames[r]+'</div>'+rows+'</div>';
  }).join('');
 }
 const metricDefs=[
  ['Annualized mean','annualizedMean',false],
  ['Annualized volatility','annualizedVolatility',false],
  ['Historical VaR 95%','historicalVaR95',true],
  ['Historical ES 95%','historicalES95',true],
  ['Historical VaR 99%','historicalVaR99',true],
  ['Historical ES 99%','historicalES99',true]
 ];
 const cards=order.map(r=>{
  const h=selectedRegime('High Risk',r), l=selectedRegime('Low Risk',r);
  const hm=Number(h.annualizedMean), lm=Number(l.annualizedMean);
  const hv=Number(h.annualizedVolatility), lv=Number(l.annualizedVolatility);
  let title, takeaway;
  if(r==='2020'){
   title='Volatility signals stress more clearly than average return';
   takeaway='Both portfolios show positive full-window average returns despite the crisis label. The window label does not mean every day—or the period average—was negative.';
  }else if(r==='2023'){
   title='Higher return came with higher volatility';
   takeaway='High Risk had a higher average return ('+fmtPct(hm)+' vs '+fmtPct(lm)+') and higher volatility ('+fmtPct(hv)+' vs '+fmtPct(lv)+') in this sample.';
  }else{
   title='Lower volatility did not prevent a negative average';
   takeaway='Low Risk averaged '+fmtPct(lm)+' at '+fmtPct(lv)+' volatility; lower variability did not guarantee a positive return.';
  }
  const label=r==='2020'?'STRESS PERIOD':r==='2023'?'CALMER PERIOD':'RECENT WINDOW';
  const rows=metricDefs.map(([name,key,loss])=>{
   const high=Number(h[key]), low=Number(l[key]);
   return '<tr><th scope="row">'+name+'</th><td>'+fmtPct(loss?Math.abs(high):high)+'</td><td>'+fmtPct(loss?Math.abs(low):low)+'</td></tr>';
  }).join('');
  return '<article class="regime-card"><div class="regime-card-head"><div class="eyebrow">'+label+'</div><h2>'+periodNames[r]+'</h2></div><div class="regime-table-wrap"><table class="regime-table"><thead><tr><th>Measure</th><th>High Risk</th><th>Low Risk</th></tr></thead><tbody>'+rows+'</tbody></table></div><div class="regime-observation"><b>'+title+'</b><p>'+takeaway+'</p></div></article>';
 }).join('');
 const val=(p,r,key)=>Number(selectedRegime(p,r)[key]);
 const highRecent=val('High Risk','18M','annualizedMean');
 const lowRecent=val('Low Risk','18M','annualizedMean');
 const highVols=order.map(r=>val('High Risk',r,'annualizedVolatility'));
 const lowVols=order.map(r=>val('Low Risk',r,'annualizedVolatility'));
 const highestHigh=order[highVols.indexOf(Math.max(...highVols))];
 const highestLow=order[lowVols.indexOf(Math.max(...lowVols))];
 $('#regime-key-findings').innerHTML=cards;
 $('#regime-interpretation').textContent='';
 $('#regime-cross-findings').innerHTML=
  '<article class="regime-cross-finding"><b>Volatility changes by window</b><p>Highest in '+periodNames[highestHigh]+' for High Risk and '+periodNames[highestLow]+' for Low Risk.</p></article>'+
  '<article class="regime-cross-finding"><b>Return and risk can diverge</b><p>Latest-window mean: High Risk '+fmtPct(highRecent)+'; Low Risk '+fmtPct(lowRecent)+'.</p></article>'+
  '<article class="regime-cross-finding"><b>Tail losses matter</b><p>Latest-window ES 99%: High Risk '+fmtPct(Math.abs(val('High Risk','18M','historicalES99')))+'; Low Risk '+fmtPct(Math.abs(val('Low Risk','18M','historicalES99')))+'.</p></article>';
}
function renderBacktest(){
 const portfolios=['High Risk','Low Risk'];
 const periods=[
  {key:'Last 18 Months (Apr 2025–Oct 2026)',title:'Last 18 Months',subtitle:'Apr 2025 – Oct 2026'},
  {key:'Crisis (2020)',title:'Crisis Period',subtitle:'2020'},
  {key:'Calm (2023)',title:'Calm Period',subtitle:'2023'}
 ];
 const allRows=periods.flatMap(period=>portfolios.flatMap(p=>((D.backtests[p]?.periods||{})[period.key]||[]).map(x=>({...x,portfolio:p,period:period.key}))));
 const decision=x=>Number(x.kupiecP)<0.05?'<span class="backtest-decision reject">Reject</span>':'<span class="backtest-decision pass">Do not reject</span>';
 const interpretation=rows=>{
  const rejected=rows.filter(x=>Number(x.kupiecP)<0.05);
  const above=rows.filter(x=>Number(x.observedRate)>Number(x.expectedRate));
  const below=rows.filter(x=>Number(x.observedRate)<Number(x.expectedRate));
  if(rejected.length){
   if(rejected.length===rows.length && rejected.every(x=>Number(x.observedRate)>Number(x.expectedRate))){
    return 'Both portfolios breach their VaR limits more often than the confidence levels predict, and the p-values show this gap is statistically significant. In this stress window, the VaR estimates understate downside risk and provide insufficient loss protection.';
   }
   const labels=[...new Set(rejected.map(x=>x.portfolio+' at '+x.confidence))];
   return 'The observed exception frequency is statistically inconsistent with the VaR target for '+labels.join(', ')+'. This signals a calibration problem at those levels; review whether the model captures the period’s tail risk adequately.';
  }
  if(above.length===rows.length){
   return 'Exception rates are slightly above their targets, but none of the p-values is below 0.05. The test therefore finds insufficient evidence that VaR is systematically underestimating risk in this window; this is not proof that the model is accurate.';
  }
  if(below.length===rows.length){
   return 'Fewer exceptions occurred than the VaR targets imply, but the differences are not statistically significant. The model may be conservative in this window, yet the test does not establish that conclusively.';
  }
  return 'None of the p-values is below 0.05, so the test does not find a statistically significant mismatch in exception frequency. The observed rates differ from their targets, but this test alone cannot prove that VaR is accurate or that losses are independent.';
 };
 $('#backtest-period-comparison').innerHTML=periods.map(period=>{
  const rows=allRows.filter(x=>x.period===period.key);
  return '<article class="backtest-period-panel"><header class="backtest-period-panel-head"><div><h3>'+period.title+'</h3><p>'+period.subtitle+'</p></div></header><div class="table-wrap backtest-period-table-wrap"><table><thead><tr><th>Portfolio / Level</th><th>Exceptions</th><th>Observed / Target</th><th>p-value</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><b>'+esc(x.portfolio)+'</b><small class="rate-target">'+esc(x.confidence)+'</small></td><td>'+x.exceptions+' / '+x.observations+'</td><td><b>'+fmtPct(x.observedRate)+'</b><small class="rate-target">Target '+fmtPct(x.expectedRate)+'</small></td><td><b>'+Number(x.kupiecP).toFixed(3)+'</b>'+decision(x)+'</td></tr>').join('')+'</tbody></table></div><div class="backtest-panel-interpretation"><div class="eyebrow">INTERPRETATION · P-VALUE ONLY</div><p>'+interpretation(rows)+'</p></div></article>';
 }).join('');
}
function renderOptimization(){
 const regimes=['2020','2023','18M'];
 const portfolios=['High Risk','Low Risk'];
 const regimeShort={'2020':'Crisis 2020','2023':'Calm 2023','18M':'Latest 18 Months'};
 const get=(p,r)=>D.optimization[p]?.[r]||{};
 const stocksFor=(p,r)=>(get(p,r).stocks||[]).filter(s=>s.stock!=='Stock');
 const portfolioPanel=p=>{
  const cases=regimes.map(r=>({r,x:get(p,r),stocks:stocksFor(p,r)}));
  const cards=cases.map(c=>'<article class="opt-regime-card"><div class="opt-regime-card-head"><span>'+regimeShort[c.r]+'</span><i></i></div><div class="opt-primary-metric"><span>Expected return</span><strong>'+fmtPct(c.x.optimizedReturn)+'</strong></div><div class="opt-secondary-metric"><span>Annualized volatility</span><b>'+fmtPct(c.x.volatility)+'</b></div><div class="opt-card-foot"><span>Holdings: '+c.stocks.length+'/10</span><span>Weight total: '+fmtPct(c.x.weightSum,1)+'</span></div></article>').join('');
  const names=[...new Set(cases.flatMap(c=>c.stocks.map(s=>s.stock)))];
  const allocation=names.map(name=>{
   const cells=cases.map(c=>{
    const s=c.stocks.find(v=>v.stock===name);
    if(!s)return '<td><span class="opt-missing">Not available</span></td>';
    const w=Math.max(0,Math.min(100,100*Number(s.optimizedWeight||0)));
    return '<td><div class="opt-weight-cell"><div class="opt-weight-value">'+fmtPct(s.optimizedWeight,2)+'</div><div class="opt-weight-track"><div style="width:'+w+'%"></div></div></div></td>';
   }).join('');
   return '<tr><th scope="row">'+esc(name)+'</th>'+cells+'</tr>';
  }).join('');
  const warnings=cases.filter(c=>c.stocks.length!==10).map(c=>regimeShort[c.r]+': '+c.stocks.length+' named holdings').join('; ');
  const notes=cases.map(c=>{
   const vols=cases.map(k=>Number(k.x.volatility)),v=Number(c.x.volatility);
   const note=v===Math.min(...vols)?'Lowest volatility within this portfolio.':v===Math.max(...vols)?'Highest volatility within this portfolio.':'Volatility sits between the other two regimes.';
   return '<div class="opt-note"><b>'+regimeShort[c.r]+'</b><p>'+note+'</p></div>';
  }).join('');
  return '<section class="opt-portfolio-block"><div class="opt-portfolio-heading"><div><div class="eyebrow">PORTFOLIO COMPARISON</div><h2>'+p+'</h2><p>Compare performance metrics across all three regimes.</p></div><span class="pill">Side-by-side view</span></div><div class="opt-regime-cards">'+cards+'</div><div class="opt-subheading"><div><h3>Optimized stock weights</h3><p>Each column is optimized independently using that regime’s return and covariance estimates.</p></div><span class="opt-table-key"><i></i> Portfolio weight</span></div><div class="table-wrap opt-compare-wrap"><table class="opt-compare-table opt-allocation-table"><thead><tr><th>Company</th>'+cases.map(c=>'<th>'+regimeShort[c.r]+'</th>').join('')+'</tr></thead><tbody>'+allocation+'</tbody></table></div><div class="opt-regime-notes">'+notes+'</div>'+(warnings?'<p class="data-warning">Data completeness: '+warnings+'. The saved outputs do not identify all ten holdings in these cases; reconcile them with the original workbook before treating the allocation as complete.</p>':'')+'</section>';
 };
 $('#opt-comparison').innerHTML=portfolios.map(portfolioPanel).join('');
 $('#opt-validation').textContent='Method: minimize portfolio variance, with weights summing to 100%, a 1% minimum weight per holding, and the saved expected-return floor.';
 if($('#opt-interpretation'))$('#opt-interpretation').textContent='The regime-specific estimates can lead to different allocations. Higher expected return does not automatically mean lower risk or better future performance.';
 if($('#opt-data-warning'))$('#opt-data-warning').hidden=true;
 updateFinalFindings();
}
function renderTravel(){const keys=visiblePeriods('.travel-period-toggle');$('#travel-table').innerHTML=['High Risk','Low Risk'].flatMap(p=>keys.map(k=>{const x=selectedRegime(p,k);return '<tr><td><b>'+p+'</b></td><td>'+periodNames[k]+'</td><td>'+x.observations+'</td><td>'+fmtPct(x.annualizedMean)+'</td><td>'+fmtPct(x.annualizedVolatility)+'</td><td>'+fmtPct(Math.abs(x.historicalVaR95))+'</td><td>'+fmtPct(Math.abs(x.historicalES95))+'</td></tr>';})).join('');if(!keys.length)$('#travel-table').innerHTML='<tr><td colspan="7">Select at least one period.</td></tr>';const groups=['High Risk','Low Risk'].map(p=>{const all=keys.map(k=>{const x=D.optimization[p]?.[k];const stocks=(x?.stocks||[]).filter(s=>s.stock!=='Stock');return '<div class="content-card"><h3>'+p+' · '+periodNames[k]+'</h3><div class="table-wrap"><table><thead><tr><th>Company</th><th>Equal weight</th><th>Optimized weight</th><th>Change</th></tr></thead><tbody>'+stocks.map(s=>'<tr><td>'+esc(s.stock)+'</td><td>'+fmtPct(s.equalWeight,1)+'</td><td>'+fmtPct(s.optimizedWeight,2)+'</td><td><b>'+((Number(s.delta)>0)?'+':'')+fmtPct(s.delta,2)+'</b></td></tr>').join('')+'</tbody></table></div></div>';}).join('');return '<div class="content-card"><h2>'+p+'</h2>'+all+'</div>';}).join('');$('#travel-weights').innerHTML=groups;const activeKeys=keys.length?keys:['2020','2023','18M'];const riskText=activeKeys.map(k=>{const h=Number(selectedRegime('High Risk',k).annualizedVolatility),l=Number(selectedRegime('Low Risk',k).annualizedVolatility);return periodNames[k]+': High Risk volatility is '+fmtPct(h) +' versus '+fmtPct(l)+' for Low Risk.';}).join(' ');if($('#travel-risk-interpretation'))$('#travel-risk-interpretation').textContent=riskText;if($('#travel-interpretation'))$('#travel-interpretation').textContent='Across the selected windows, the risk ordering '+(activeKeys.every(k=>Number(selectedRegime('High Risk',k).annualizedVolatility)>=Number(selectedRegime('Low Risk',k).annualizedVolatility))?'remains consistent: High Risk has higher annualized volatility in each displayed period.':'varies by window, so the relative risk ordering is not constant.');updateFinalFindings();}
$$('.travel-period-toggle').forEach(el=>el.addEventListener('change',renderTravel));
function updateFinalFindings(){
 const v=(p,r)=>Number(selectedRegime(p,r).annualizedVolatility);
 const h20=v('High Risk','2020'),l20=v('Low Risk','2020'),h23=v('High Risk','2023'),l23=v('Low Risk','2023'),h18=v('High Risk','18M'),l18=v('Low Risk','18M');
 if($('#finding-regimes')) $('#finding-regimes').textContent='Across the three selected windows, High Risk volatility is '+[h20,h23,h18].map(fmtPct).join(', ')+' while Low Risk volatility is '+[l20,l23,l18].map(fmtPct).join(', ')+'. High Risk is more volatile in all three windows in this sample.';
 if($('#finding-optimization')){
  const checks=['High Risk','Low Risk'].flatMap(p=>['2020','2023','18M'].map(k=>{const x=D.optimization[p]?.[k],b=Number(selectedRegime(p,k).annualizedVolatility);return x&&Number.isFinite(b)?{p,k,base:b,opt:Number(x.volatility),named:(x.stocks||[]).filter(s=>s.stock!=='Stock').length}:null;}).filter(Boolean));
  const reductions=checks.filter(z=>z.opt<=z.base).length;
  $('#finding-optimization').textContent='Across '+checks.length+' saved portfolio-window outputs, estimated volatility is lower than or equal to the reference portfolio in '+reductions+' cases. The optimizer redistributes weights under a return floor and covariance-based variance objective; the result remains conditional on the sample inputs and constraints.';
 }
 if($('#finding-limits')) $('#finding-limits').textContent='Mean-variance optimization is sensitive to estimated returns and covariances. Historical portfolio selection also uses broad-period information, so time-travel comparisons may contain look-ahead bias. These limits mean the results should be interpreted as sample-based comparisons, not proof of future performance.';
}
function download(filename,text,type='application/json'){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
$('#download-data').addEventListener('click',()=>download('fra_project_data.json',JSON.stringify(D,null,2)));
$('#download-json').addEventListener('click',()=>download('fra_project_data.json',JSON.stringify(D,null,2)));
renderUniverse();renderSelection('High Risk');renderRegime();renderBacktest();renderOptimization();renderTravel();updateFinalFindings();
if(location.hash&&titles[location.hash.slice(1)])nav(location.hash.slice(1));
})();