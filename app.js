(() => {
'use strict';
const D=window.FRA_DATA;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
if(!D){document.body.innerHTML='<p>Project data could not be loaded.</p>';return;}
const titles={overview:'Executive Summary',data:'Data and Universe',selection:'Risk Scoring',regimes:'Market Regimes',backtest:'VaR Backtesting',optimization:'Markowitz Optimization',findings:'Findings and Limits'};
const views=['overview','data','selection','regimes','backtest','optimization','findings'];
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
function renderUniverse(query=''){const rows=D.risk.filter(r=>r.company.toLowerCase().includes(query.toLowerCase())).map(r=>'<tr><td><b>'+esc(r.company)+'</b></td><td>'+fmtNum(r.beta,2)+'</td><td>'+fmtPct(r.volatility)+'</td><td>'+fmtPct(r.drawdown)+'</td><td>'+esc(r.rank)+'</td></tr>').join('');$('#universe-table').innerHTML=rows||'<tr><td colspan="5">No companies match the search.</td></tr>';const ranked=[...D.risk].filter(r=>Number.isFinite(Number(r.rank))).sort((a,b)=>Number(a.rank)-Number(b.rank));if(ranked.length&&$('#universe-interpretation'))$('#universe-interpretation').textContent='Within our selected universe, '+ranked[0].company+' ranks first on the composite risk screen, while '+ranked[ranked.length-1].company+' ranks last. These are relative rankings within the 45 stocks we reviewed, not market wide risk labels.';}
$('#universe-search').addEventListener('input',e=>renderUniverse(e.target.value));
function renderSelection(portfolio){activePortfolio=portfolio;$$('#selection-toggle button').forEach(b=>b.classList.toggle('selected',b.dataset.portfolio===portfolio));const holdings=D.portfolios[portfolio]||[];$('#selection-summary').textContent=portfolio+' contains ten selected holdings. Each baseline holding starts at 10 percent of the study capital.';$('#holdings-table').innerHTML=holdings.map(x=>'<tr><td>'+x.rank+'</td><td><b>'+esc(x.stock)+'</b></td><td>'+esc(x.sector)+'</td><td>'+fmtNum(x.score,1)+'</td><td>'+fmtPct(x.equalWeight,0)+'</td><td>'+money(x.investment)+'</td></tr>').join('');const scores=holdings.map(x=>Number(x.score)).filter(Number.isFinite);if(scores.length&&$('#selection-interpretation')){const mean=scores.reduce((a,b)=>a+b,0)/scores.length;$('#selection-interpretation').textContent=portfolio+' contains '+holdings.length+' holdings with a mean composite risk score of '+mean.toFixed(1)+'. The starting allocation is equal weighted at 10% per holding; the score determines selection, while the later optimizer determines a separate allocation.';}}
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
   takeaway='Both portfolios show positive full window average returns despite the crisis label. The window label does not mean every day or the period average was negative.';
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
  '<article class="regime-cross-finding"><b>Return and risk can diverge</b><p>Latest window mean: High Risk '+fmtPct(highRecent)+'; Low Risk '+fmtPct(lowRecent)+'.</p></article>'+
  '<article class="regime-cross-finding"><b>Tail losses matter</b><p>Latest window ES 99%: High Risk '+fmtPct(Math.abs(val('High Risk','18M','historicalES99')))+'; Low Risk '+fmtPct(Math.abs(val('Low Risk','18M','historicalES99')))+'.</p></article>';
}
function renderBacktest(){
 const portfolios=['High Risk','Low Risk'];
 const periods=[
  {key:'Last 18 Months (Apr 2025–Oct 2026)',title:'Last 18 Months',subtitle:'Apr 2025 to Oct 2026'},
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
    return 'Both portfolios breach their VaR limits more often than the confidence levels predict, and the p values show this gap is statistically significant. In this stress window, the VaR estimates understate downside risk and provide insufficient loss protection.';
   }
   const labels=[...new Set(rejected.map(x=>x.portfolio+' at '+x.confidence))];
   return 'The observed exception frequency is statistically inconsistent with the VaR target for '+labels.join(', ')+'. This signals a calibration problem at those levels; review whether the model captures the period’s tail risk adequately.';
  }
  if(above.length===rows.length){
   return 'Exception rates are slightly above their targets, but none of the p values is below 0.05. The test therefore finds insufficient evidence that VaR is systematically underestimating risk in this window; this is not proof that the model is accurate.';
  }
  if(below.length===rows.length){
   return 'Fewer exceptions occurred than the VaR targets imply, but the differences are not statistically significant. The model may be conservative in this window, yet the test does not establish that conclusively.';
  }
  return 'None of the p values is below 0.05, so the test does not find a statistically significant mismatch in exception frequency. The observed rates differ from their targets, but this test alone cannot prove that VaR is accurate or that losses are independent.';
 };
 $('#backtest-period-comparison').innerHTML=periods.map(period=>{
  const rows=allRows.filter(x=>x.period===period.key);
  return '<article class="backtest-period-panel"><header class="backtest-period-panel-head"><div><h3>'+period.title+'</h3><p>'+period.subtitle+'</p></div></header><div class="table-wrap backtest-period-table-wrap"><table><thead><tr><th>Portfolio / Level</th><th>Exceptions</th><th>Observed / Target</th><th>p value</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><b>'+esc(x.portfolio)+'</b><small class="rate-target">'+esc(x.confidence)+'</small></td><td>'+x.exceptions+' / '+x.observations+'</td><td><b>'+fmtPct(x.observedRate)+'</b><small class="rate-target">Target '+fmtPct(x.expectedRate)+'</small></td><td><b>'+Number(x.kupiecP).toFixed(3)+'</b>'+decision(x)+'</td></tr>').join('')+'</tbody></table></div><div class="backtest-panel-interpretation"><div class="eyebrow">INTERPRETATION · P VALUE ONLY</div><p>'+interpretation(rows)+'</p></div></article>';
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
  const byVol=[...cases].sort((a,b)=>Number(a.x.volatility)-Number(b.x.volatility));
  const byReturn=[...cases].sort((a,b)=>Number(b.x.optimizedReturn)-Number(a.x.optimizedReturn));
  const topHolding=c=>{
   const ranked=[...c.stocks].sort((a,b)=>Number(b.optimizedWeight||0)-Number(a.optimizedWeight||0));
   return ranked[0] ? {name:ranked[0].stock,weight:Number(ranked[0].optimizedWeight||0)} : null;
  };
  const topByRegime=cases.map(c=>({r:c.r,...(topHolding(c)||{name:'not available',weight:0})}));
  const largestTop=topByRegime.reduce((a,b)=>a.weight>=b.weight?a:b);
  const smallestTop=topByRegime.reduce((a,b)=>a.weight<=b.weight?a:b);
  const crisis=cases.find(c=>c.r==='2020'), calm=cases.find(c=>c.r==='2023'), latest=cases.find(c=>c.r==='18M');
  const volSentence='Volatility ranges from '+fmtPct(byVol[0].x.volatility)+' in '+regimeShort[byVol[0].r]+' to '+fmtPct(byVol[byVol.length-1].x.volatility)+' in '+regimeShort[byVol[byVol.length-1].r]+'. This shows that estimated portfolio risk changes materially across historical windows.';
  const returnSentence='The highest optimized return estimate is '+fmtPct(byReturn[0].x.optimizedReturn)+' in '+regimeShort[byReturn[0].r]+', while the lowest is '+fmtPct(byReturn[byReturn.length-1].x.optimizedReturn)+' in '+regimeShort[byReturn[byReturn.length-1].r]+'. Return should be assessed alongside volatility, not on its own.';
  const allocationSentence='The largest allocation in each window is '+topByRegime.map(t=>regimeShort[t.r]+': '+esc(t.name)+' ('+fmtPct(t.weight,1)+')').join('; ')+'. The largest single stock weight ranges from '+fmtPct(smallestTop.weight,1)+' to '+fmtPct(largestTop.weight,1)+', showing how the preferred mix and concentration shift with the regime estimates.';
  const notes='<div class="opt-note"><b>What stands out across the three regimes</b><ul class="opt-insight-list"><li><strong>Risk pattern:</strong> '+volSentence+'</li><li><strong>Return trade off:</strong> '+returnSentence+'</li><li><strong>Allocation pattern:</strong> '+allocationSentence+'</li></ul></div>';
  return '<section class="opt-portfolio-block"><div class="opt-portfolio-heading"><div><div class="eyebrow">PORTFOLIO COMPARISON</div><h2>'+p+'</h2><p>Compare performance metrics across all three regimes.</p></div><span class="pill">Side by side view</span></div><div class="opt-regime-cards">'+cards+'</div><div class="opt-subheading"><div><h3>Optimized stock weights</h3><p>Each column is optimized independently using that regime’s return and covariance estimates.</p></div><span class="opt-table-key"><i></i> Portfolio weight</span></div><div class="table-wrap opt-compare-wrap"><table class="opt-compare-table opt-allocation-table"><thead><tr><th>Company</th>'+cases.map(c=>'<th>'+regimeShort[c.r]+'</th>').join('')+'</tr></thead><tbody>'+allocation+'</tbody></table></div><div class="opt-regime-notes">'+notes+'</div>'+(warnings?'<p class="data-warning">Data completeness: '+warnings+'. The saved outputs do not identify all ten holdings in these cases; reconcile them with the original workbook before treating the allocation as complete.</p>':'')+'</section>';
 };
 $('#opt-comparison').innerHTML=portfolios.map(portfolioPanel).join('');
 $('#opt-validation').textContent='Method: minimize portfolio variance, with weights summing to 100%, a 1% minimum weight per holding, and the saved expected return floor.';
 if($('#opt-interpretation'))$('#opt-interpretation').innerHTML='<ul class="opt-insight-list opt-global-insights"><li><strong>Crisis 2020:</strong> Both portfolios show their highest optimized return estimates and highest volatility in this window. The stronger return estimate comes with higher estimated risk; it is not evidence that crises are inherently profitable.</li><li><strong>Calm 2023:</strong> Both portfolios have their lowest estimated volatility. In this sample, this is the comparatively lower risk window, but lower volatility does not by itself establish that a portfolio is better.</li><li><strong>Latest 18 months:</strong> The High Risk portfolio has a positive optimized return estimate, while the Low Risk portfolio estimate is negative. This highlights that portfolio labels do not guarantee positive returns in every period.</li></ul>';
 if($('#opt-data-warning'))$('#opt-data-warning').hidden=true;
 updateFinalFindings();
}
function updateFinalFindings(){
  const regimes=['2020','2023','18M'];
  const labels={'2020':'Crisis 2020','2023':'Calm 2023','18M':'Latest 18 months'};
  const reg=(p,r)=>D.regimes?.[p]?.[r]||{};
  const opt=(p,r)=>D.optimization?.[p]?.[r]||{};
  const pct=(v,d=2)=>fmtPct(Number(v),d);
  const h20=reg('High Risk','2020'),l20=reg('Low Risk','2020');
  const h23=reg('High Risk','2023'),l23=reg('Low Risk','2023');
  const h18=reg('High Risk','18M'),l18=reg('Low Risk','18M');
  const bt=(p,period,confidence)=>{
   const periods=D.backtests?.[p]?.summary?.periods||{};
   const key=Object.keys(periods).find(k=>k.toLowerCase().includes(period.toLowerCase()));
   return (key?periods[key]:[]).find(x=>x.confidence===confidence)||{};
  };
  const h20v=Number(h20.annualizedVolatility),l20v=Number(l20.annualizedVolatility);
  const crisis95H=bt('High Risk','Crisis','95%'),crisis99H=bt('High Risk','Crisis','99%');
  const crisis95L=bt('Low Risk','Crisis','95%'),crisis99L=bt('Low Risk','Crisis','99%');
  const kpis=[
   {label:'Stress window volatility',value:pct(h20v)+' / '+pct(l20v),sub:'High Risk / Low Risk · 2020'},
   {label:'Stress window ES 95%',value:pct(h20.historicalES95)+' / '+pct(l20.historicalES95),sub:'High Risk / Low Risk · historical tail loss'},
   {label:'VaR frequency test',value:'4 of 4 rejected',sub:'Both portfolios · 95% and 99% · crisis 2020'},
   {label:'Calm window optimized volatility',value:pct(opt('High Risk','2023').volatility)+' / '+pct(opt('Low Risk','2023').volatility),sub:'High Risk / Low Risk · Markowitz output'}
  ];
  const kpiEl=$('#findings-kpis');
  if(kpiEl) kpiEl.innerHTML=kpis.map(k=>'<article class="findings-kpi"><span>'+esc(k.label)+'</span><strong>'+esc(k.value)+'</strong><small>'+esc(k.sub)+'</small></article>').join('');
  const obs=[
   {n:'01',tag:'REGIME EFFECT',title:'The high risk portfolio is consistently more volatile',body:'Annualized volatility is '+pct(h20v)+' versus '+pct(l20.annualizedVolatility)+' in 2020, '+pct(h23.annualizedVolatility)+' versus '+pct(l23.annualizedVolatility)+' in 2023, and '+pct(h18.annualizedVolatility)+' versus '+pct(l18.annualizedVolatility)+' in the latest 18 month window. The gap persists in every window; the high risk label is reflected in measured outcomes, not just the stock selection score.',metric:'Latest window volatility gap: '+pct(h18.annualizedVolatility-l18.annualizedVolatility)},
   {n:'02',tag:'TAIL RISK',title:'The difference is visible in severe loss estimates too',body:'Historical ES at 95% is '+pct(h20.historicalES95)+' for High Risk and '+pct(l20.historicalES95)+' for Low Risk in 2020. In the latest window it is '+pct(h18.historicalES95)+' versus '+pct(l18.historicalES95)+'. The low risk portfolio’s tail loss is less severe in all three windows, although it is not immune to loss.',metric:'2020 ES 95% difference: '+pct(Math.abs(Number(h20.historicalES95))-Math.abs(Number(l20.historicalES95)))+' in return terms'},
   {n:'03',tag:'MODEL VALIDATION',title:'The crisis window is where VaR calibration is weakest',body:'In 2020, Kupiec p values are '+Number(crisis95H.kupiecP).toFixed(3)+' and '+Number(crisis99H.kupiecP).toFixed(3)+' for High Risk, and '+Number(crisis95L.kupiecP).toFixed(3)+' and '+Number(crisis99L.kupiecP).toFixed(3)+' for Low Risk. All are below 0.05, so expected exception frequency is rejected at both confidence levels for both portfolios. In 2023 and the latest window, the displayed frequency test does not reject at 5%; that is not proof of model accuracy.',metric:'Crisis: reject at 95% and 99% for both portfolios'},
   {n:'04',tag:'OPTIMIZATION',title:'The lowest optimized volatility appears in the calm window',body:'Markowitz volatility falls to '+pct(opt('High Risk','2023').volatility)+' for High Risk and '+pct(opt('Low Risk','2023').volatility)+' for Low Risk in 2023, compared with '+pct(opt('High Risk','2020').volatility)+' and '+pct(opt('Low Risk','2020').volatility)+' in 2020. The latest window optimized return estimate is '+pct(opt('High Risk','18M').optimizedReturn)+' for High Risk but '+pct(opt('Low Risk','18M').optimizedReturn)+' for Low Risk. These are model estimates under constraints, not realized performance.',metric:'Latest optimized return: '+pct(opt('High Risk','18M').optimizedReturn)+' / '+pct(opt('Low Risk','18M').optimizedReturn)+' · High / Low'},
   {n:'05',tag:'UNIVERSE PATTERN',title:'The score separates distinct sector and risk profiles',body:'The highest ranked group includes Shriram Finance and several metals and industrial names, while the lowest ranked group includes multiple FMCG names, healthcare companies and TCS. This reflects the combined beta, volatility and drawdown scores in this sample; it is not a permanent ranking of business quality or future risk.',metric:'Score weights: Beta 30% · Volatility 40% · Drawdown 30%'}
  ];
  const obsEl=$('#findings-observations');
  if(obsEl) obsEl.innerHTML=obs.map(x=>'<article class="findings-observation-card"><div class="finding-card-top"><span class="finding-number">'+x.n+'</span><span class="finding-tag">'+esc(x.tag)+'</span></div><h3>'+esc(x.title)+'</h3><p>'+esc(x.body)+'</p><div class="finding-evidence">'+esc(x.metric)+'</div></article>').join('');
  const tableEl=$('#findings-regime-table');
  if(tableEl) tableEl.innerHTML=regimes.map(r=>{
   const h=reg('High Risk',r),l=reg('Low Risk',r);
   return '<tr><th scope="row">'+esc(labels[r])+'</th><td>'+pct(h.annualizedVolatility)+'</td><td>'+pct(l.annualizedVolatility)+'</td><td>'+pct(h.historicalES95)+'</td><td>'+pct(l.historicalES95)+'</td></tr>';
  }).join('');
 }
 function download(filename,text,type='application/json'){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
$('#download-data').addEventListener('click',()=>download('fra_project_data.json',JSON.stringify(D,null,2)));
$('#download-json').addEventListener('click',()=>download('fra_project_data.json',JSON.stringify(D,null,2)));
renderUniverse();renderSelection('High Risk');renderRegime();renderBacktest();renderOptimization();updateFinalFindings();
if(location.hash&&titles[location.hash.slice(1)])nav(location.hash.slice(1));
})();