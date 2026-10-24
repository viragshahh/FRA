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
 const allVols=order.flatMap(r=>portfolios.map(p=>Number(selectedRegime(p,r).annualizedVolatility)||0));
 const maxVol=Math.max(.01,...allVols);
 const chart=$('#regime-selection-chart');
 if(chart){
  chart.innerHTML=order.map(r=>{
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
  let observationTitle, takeaway;
  if(r==='2020'){
   observationTitle='Unusual observation · crisis window still shows positive average returns';
   takeaway='Despite the crisis label, annualized mean returns are '+fmtPct(hm)+' for High Risk and '+fmtPct(lm)+' for Low Risk. A period label does not mean every day—or the full-window average—was negative; volatility is the clearer stress signal.';
  }else if(r==='2023'){
   observationTitle='Unusual observation · the higher-risk portfolio also earned more';
   takeaway='High Risk returned '+fmtPct(hm)+' versus '+fmtPct(lm)+' for Low Risk, but volatility was also higher ('+fmtPct(hv)+' versus '+fmtPct(lv)+'). In this sample, the lower-risk portfolio came with a lower average return; that is a historical result, not a guaranteed rule.';
  }else{
   observationTitle='Unusual observation · Low Risk still lost on average';
   takeaway='Low Risk recorded an annualized mean return of '+fmtPct(lm)+' despite volatility of '+fmtPct(lv)+'. High Risk returned '+fmtPct(hm)+' with volatility of '+fmtPct(hv)+'. Lower volatility reduced variability, but did not prevent a negative average return.';
  }
  const label=r==='2020'?'STRESS PERIOD':r==='2023'?'CALMER PERIOD':'RECENT WINDOW';
  const metricCards=metricDefs.map(([name,key,loss])=>{
   const hv=Number(h[key]), lv=Number(l[key]);
   return '<div class="regime-metric"><span>'+name+'</span><div><small>High Risk</small><b>'+fmtPct(loss?Math.abs(hv):hv)+'</b></div><div><small>Low Risk</small><b>'+fmtPct(loss?Math.abs(lv):lv)+'</b></div></div>';
  }).join('');
  return '<article class="regime-card"><div class="regime-card-head"><div class="eyebrow">'+label+'</div><h2>'+periodNames[r]+'</h2></div><div class="regime-metric-grid">'+metricCards+'</div><div class="regime-observation"><b>'+observationTitle+'</b><p>'+takeaway+'</p></div></article>';
 }).join('');
 const val=(p,r,key)=>Number(selectedRegime(p,r)[key]);
 const highRecent=val('High Risk','18M','annualizedMean');
 const lowRecent=val('Low Risk','18M','annualizedMean');
 const highVols=order.map(r=>val('High Risk',r,'annualizedVolatility'));
 const lowVols=order.map(r=>val('Low Risk',r,'annualizedVolatility'));
 const highestHigh=order[highVols.indexOf(Math.max(...highVols))];
 const highestLow=order[lowVols.indexOf(Math.max(...lowVols))];
 $('#regime-key-findings').innerHTML=cards;
 $('#regime-interpretation').textContent='The counterintuitive results matter more than the labels: lower volatility did not ensure positive returns, and a crisis label did not produce a negative full-window average. Historical outcomes should be read with volatility and tail-loss exposure together.';
 $('#regime-cross-findings').innerHTML=
  '<article class="regime-cross-finding"><b>Volatility depends on the window</b><p>Volatility peaks in '+periodNames[highestHigh]+' for High Risk and '+periodNames[highestLow]+' for Low Risk. Risk estimates are sensitive to the dates observed.</p></article>'+
  '<article class="regime-cross-finding"><b>Return and risk can diverge</b><p>In the latest window, High Risk averaged '+fmtPct(highRecent)+' while Low Risk averaged '+fmtPct(lowRecent)+'. Lower measured risk is not the same as avoiding losses.</p></article>'+
  '<article class="regime-cross-finding"><b>Tail losses still matter</b><p>Compare historical ES 99% across both portfolios: it captures the average loss in the worst tail, adding context beyond average return and volatility.</p></article>';
}
function renderBacktest(){
 const portfolios=['High Risk','Low Risk'];
 const periods=[
  {key:'Last 18 Months (Apr 2025–Oct 2026)',title:'Last 18 Months',subtitle:'Apr 2025 – Oct 2026'},
  {key:'Crisis (2020)',title:'Crisis Period',subtitle:'2020'},
  {key:'Calm (2023)',title:'Calm Period',subtitle:'2023'}
 ];
 const allRows=periods.flatMap(period=>portfolios.flatMap(p=>((D.backtests[p]?.periods||{})[period.key]||[]).map(x=>({...x,portfolio:p,period:period.key}))));
 const decision=x=>Number(x)<0.05?'<span class="backtest-decision reject">Reject</span>':'<span class="backtest-decision pass">Do not reject</span>';
 $('#backtest-period-comparison').innerHTML=periods.map(period=>{
  const rows=allRows.filter(x=>x.period===period.key);
  return '<article class="backtest-period-panel"><header class="backtest-period-panel-head"><h3>'+period.title+'</h3><p>'+period.subtitle+'</p></header><div class="table-wrap backtest-period-table-wrap"><table><thead><tr><th>Portfolio</th><th>Level</th><th>Exceptions</th><th>Observed / Target</th><th>p-value</th></tr></thead><tbody>'+rows.map(x=>'<tr><td><b>'+esc(x.portfolio)+'</b></td><td>'+esc(x.confidence)+'</td><td>'+x.exceptions+' / '+x.observations+'</td><td><b>'+fmtPct(x.observedRate)+'</b><small class="rate-target">Target '+fmtPct(x.expectedRate)+'</small></td><td>'+Number(x.kupiecP).toFixed(3)+' '+decision(x.kupiecP)+'</td></tr>').join('')+'</tbody></table></div></article>';
 }).join('');
 const interp=[
  {title:'Last 18 Months',high:'95%: 5.87% observed vs 5% target; frequency is not rejected (p = 0.453). 99%: 1.33% vs 1%; frequency is not rejected (p = 0.537), but independence and conditional coverage reject, indicating clustered exceptions.',low:'95%: 5.04% vs 5% target; not rejected (p = 0.972). 99%: 1.86% vs 1%; frequency is not rejected (p = 0.135). The tests do not show significant clustering.'},
  {title:'Crisis Period (2020)',high:'Both levels are above target: 8.37% at 95% and 2.79% at 99%. Kupiec rejects expected frequency at both levels (p = 0.025 and 0.019).',low:'Both levels are above target: 8.37% at 95% and 2.79% at 99%. Kupiec rejects expected frequency at both levels (p = 0.025 and 0.019). This points to underestimation of tail risk during crisis conditions.'},
  {title:'Calm Period (2023)',high:'Observed rates are below target: 3.67% at 95% and 0.41% at 99%. None of the frequency, independence or conditional-coverage tests rejects at 5%.',low:'Observed rates are below target: 3.67% at 95% and 0.82% at 99%. None of the frequency, independence or conditional-coverage tests rejects at 5%.'}
 ];
 $('#backtest-interpretation-grid').innerHTML=interp.map(p=>'<article class="backtest-interpretation-card"><h3>'+p.title+'</h3><div class="regime-result"><b>High Risk</b><p>'+p.high+'</p></div><div class="regime-result"><b>Low Risk</b><p>'+p.low+'</p></div></article>').join('');
 $('#backtest-interpretation').textContent='P-values shown in the tables are Kupiec frequency-test p-values. At p < 0.05, reject the expected exception frequency. Independence and conditional-coverage results are summarized above where relevant. Non-rejection does not prove model accuracy.';
}
function renderOptimization(){const p=$('#opt-portfolio').value,r=$('#opt-regime').value,x=D.optimization[p]?.[r];if(!x)return;$('#opt-kpis').innerHTML=[['Equal weight mean',fmtPct(x.equalWeightMean)],['Target return',fmtPct(x.target)],['Optimized return',fmtPct(x.optimizedReturn)],['Optimized volatility',fmtPct(x.volatility)]].map(a=>'<article class="metric-card"><span>'+a[0]+'</span><strong>'+a[1]+'</strong><small>Annualized or daily measure, as labelled</small></article>').join('');const stocks=(x.stocks||[]).filter(s=>s.stock!=='Stock');$('#weights-table').innerHTML=stocks.map(s=>'<tr><td><b>'+esc(s.stock)+'</b></td><td>'+fmtPct(s.equalWeight,1)+'</td><td>'+fmtPct(s.optimizedWeight,2)+'</td><td>'+fmtPct(s.delta,2)+'</td><td>'+fmtPct(s.annualizedMean)+'</td></tr>').join('');$('#weight-bars').innerHTML=stocks.length?stocks.map(s=>'<div class="weight-pair"><span class="weight-name">'+esc(s.stock)+'</span><div class="weight-pair-bars"><div class="chart-bar-row"><span>Equal</span><div class="chart-track"><div class="chart-fill high" style="width:'+Math.max(0,Math.min(100,100*Number(s.equalWeight||0)))+'%"></div></div><b>'+fmtPct(s.equalWeight,1)+'</b></div><div class="chart-bar-row"><span>Optimized</span><div class="chart-track"><div class="chart-fill low" style="width:'+Math.max(0,Math.min(100,100*Number(s.optimizedWeight||0)))+'%"></div></div><b>'+fmtPct(s.optimizedWeight,1)+'</b></div></div></div>').join(''):'<p class="chart-empty">No named holding weights are available for this selection.</p>';const cov=x.covariance||{};$('#covariance-table').innerHTML='<thead><tr><th>Company</th>'+(cov.labels||[]).slice(1).map(l=>'<th>'+esc(l)+'</th>').join('')+'</tr></thead><tbody>'+(cov.matrix||[]).map((row,i)=>'<tr><th>'+esc(cov.labels?.[i+1]||'Stock '+(i+1))+'</th>'+row.map(v=>'<td>'+fmtNum(v,4)+'</td>').join('')+'</tr>').join('')+'</tbody>';$('#opt-validation').textContent='Constraint check: '+x.validation+'. The saved weights sum to '+fmtPct(x.weightSum,3)+' and the smallest named-or-saved weight is '+fmtPct(x.minWeight,2)+'. The target return is '+fmtPct(x.target)+' and the optimized expected return is '+fmtPct(x.optimizedReturn)+'.';const baseline=selectedRegime(p,r);const baseVol=Number(baseline.annualizedVolatility),optVol=Number(x.volatility);const volText=Number.isFinite(baseVol)&&Number.isFinite(optVol)?' Estimated annualized volatility moves from '+fmtPct(baseVol)+' for the equal-weight portfolio to '+fmtPct(optVol)+' after optimization ('+(optVol<=baseVol?'a reduction of ':'an increase of ')+fmtPct(Math.abs(baseVol-optVol))+').':' Volatility comparison is unavailable for this selection.';const met=Number(x.optimizedReturn)>=Number(x.target)-1e-8;const targetText=' The optimized expected return '+(met?'meets or exceeds':'falls below')+' the stated target.';if($('#opt-interpretation'))$('#opt-interpretation').textContent='For '+p+' in '+periodNames[r]+', the optimizer '+(met?'meets':'does not meet')+' the return floor using the saved model output.'+volText+targetText+' We interpret this as a sample-dependent minimum-variance allocation, not a guaranteed future result.';const namedCount=stocks.length;if($('#opt-data-warning')){const missing=10-namedCount;$('#opt-data-warning').hidden=missing<=0;$('#opt-data-warning').textContent=missing>0?'Data completeness: the saved optimization output contains '+namedCount+' named holdings rather than ten for '+p+' in '+periodNames[r]+'. The saved weight vector sums to '+fmtPct(x.weightSum,3)+', but the unnamed holding(s) cannot be attributed to a company without reconciliation to the source workbook. We therefore do not treat the named table as a complete ten-stock allocation.':'';}updateFinalFindings();}
['opt-portfolio','opt-regime'].forEach(id=>$('#'+id).addEventListener('change',renderOptimization));
function renderTravel(){const keys=visiblePeriods('.travel-period-toggle');$('#travel-table').innerHTML=['High Risk','Low Risk'].flatMap(p=>keys.map(k=>{const x=selectedRegime(p,k);return '<tr><td><b>'+p+'</b></td><td>'+periodNames[k]+'</td><td>'+x.observations+'</td><td>'+fmtPct(x.annualizedMean)+'</td><td>'+fmtPct(x.annualizedVolatility)+'</td><td>'+fmtPct(Math.abs(x.historicalVaR95))+'</td><td>'+fmtPct(Math.abs(x.historicalES95))+'</td></tr>';})).join('');if(!keys.length)$('#travel-table').innerHTML='<tr><td colspan="7">Select at least one period.</td></tr>';const groups=['High Risk','Low Risk'].map(p=>{const all=keys.map(k=>{const x=D.optimization[p]?.[k];const stocks=(x?.stocks||[]).filter(s=>s.stock!=='Stock');return '<div class="content-card"><h3>'+p+' · '+periodNames[k]+'</h3><div class="table-wrap"><table><thead><tr><th>Company</th><th>Equal weight</th><th>Optimized weight</th><th>Change</th></tr></thead><tbody>'+stocks.map(s=>'<tr><td>'+esc(s.stock)+'</td><td>'+fmtPct(s.equalWeight,1)+'</td><td>'+fmtPct(s.optimizedWeight,2)+'</td><td><b>'+((Number(s.delta)>0)?'+':'')+fmtPct(s.delta,2)+'</b></td></tr>').join('')+'</tbody></table></div></div>';}).join('');return '<div class="content-card"><h2>'+p+'</h2>'+all+'</div>';}).join('');$('#travel-weights').innerHTML=groups;const activeKeys=keys.length?keys:['2020','2023','18M'];const riskText=activeKeys.map(k=>{const h=Number(selectedRegime('High Risk',k).annualizedVolatility),l=Number(selectedRegime('Low Risk',k).annualizedVolatility);return periodNames[k]+': High Risk volatility is '+fmtPct(h) +' versus '+fmtPct(l)+' for Low Risk.';}).join(' ');if($('#travel-risk-interpretation'))$('#travel-risk-interpretation').textContent=riskText;if($('#travel-interpretation'))$('#travel-interpretation').textContent='Across the selected windows, the risk ordering '+(activeKeys.every(k=>Number(selectedRegime('High Risk',k).annualizedVolatility)>=Number(selectedRegime('Low Risk',k).annualizedVolatility))?'remains consistent: High Risk has higher annualized volatility in each displayed period.':'varies by window, so the relative risk ordering is not constant.');updateFinalFindings();}
$$('.travel-period-toggle').forEach(el=>el.addEventListener('change',renderTravel));
function updateFinalFindings(){
 const v=(p,r)=>Number(selectedRegime(p,r).annualizedVolatility);
 const h20=v('High Risk','2020'),l20=v('Low Risk','2020'),h23=v('High Risk','2023'),l23=v('Low Risk','2023'),h18=v('High Risk','18M'),l18=v('Low Risk','18M');
 if($('#finding-regimes')) $('#finding-regimes').textContent='Across the three selected windows, High Risk volatility is '+[h20,h23,h18].map(fmtPct).join(', ')+' while Low Risk volatility is '+[l20,l23,l18].map(fmtPct).join(', ')+'. High Risk is more volatile in all three windows in this sample.';
 if($('#finding-optimization')){
  const checks=['High Risk','Low Risk'].flatMap(p=>['2020','2023','18M'].map(k=>{const x=D.optimization[p]?.[k],b=Number(selectedRegime(p,k).annualizedVolatility);return x&&Number.isFinite(b)?{p,k,base:b,opt:Number(x.volatility),named:(x.stocks||[]).filter(s=>s.stock!=='Stock').length}:null;}).filter(Boolean));
  const reductions=checks.filter(z=>z.opt<=z.base).length;
  $('#finding-optimization').textContent='Across '+checks.length+' saved portfolio-window outputs, estimated volatility is lower than or equal to the equal-weight baseline in '+reductions+' cases. The optimization redistributes weights under a return target and covariance-based variance objective; the result remains conditional on the sample inputs and constraints.';
 }
 if($('#finding-limits')) $('#finding-limits').textContent='The 2023 and latest 18-month optimization outputs contain only nine named holdings per portfolio, despite a ten-stock design. Historical portfolio selection also uses broad-period information, so time-travel comparisons may contain look-ahead bias. These limit claims about complete allocations and historical investability.';
}
function download(filename,text,type='application/json'){const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
$('#download-data').addEventListener('click',()=>download('fra_project_data.json',JSON.stringify(D,null,2)));
$('#download-json').addEventListener('click',()=>download('fra_project_data.json',JSON.stringify(D,null,2)));
renderUniverse();renderSelection('High Risk');renderRegime();renderBacktest();renderOptimization();renderTravel();updateFinalFindings();
if(location.hash&&titles[location.hash.slice(1)])nav(location.hash.slice(1));
})();