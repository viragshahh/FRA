(() => {
  'use strict';
  const D = window.FRA_DATA;
  if (!D) { document.body.innerHTML = '<p style="padding:2rem">Project data could not be loaded. Check that data.js is in the same folder as index.html.</p>'; return; }
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const charts = {};
  const fmtPct = (v, digits=2) => Number.isFinite(Number(v)) ? (Number(v)*100).toFixed(digits)+'%' : '—';
  const fmtNum = (v, digits=4) => Number.isFinite(Number(v)) ? Number(v).toFixed(digits) : '—';
  const fmtMoney = v => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(v) : '—';
  const fmtInt = v => Number.isFinite(Number(v)) ? new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(v) : '—';
  const fmtSignedPct = (v,d=2) => Number.isFinite(Number(v)) ? (v>0?'+':'')+(Number(v)*100).toFixed(d)+'%' : '—';
  const regimeLabel = r => ({'2020':'Stress · 2020','2023':'Calm · 2023','18M':'Trailing 18 months'}[r] || r);
  const portfolioColor = p => p==='High Risk' ? '#24354d' : '#b8dd63';
  const palette = {navy:'#24354d',lime:'#b8dd63',teal:'#4e8c81',blue:'#6f8fc0',red:'#c76860',grey:'#c9d1dc'};
  const toast = msg => { const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>t.classList.remove('show'),2300); };
  function makeChart(id, config) {
    const el=$('#'+id); if(!el || !window.Chart) return;
    if(charts[id]) charts[id].destroy();
    const defaults={responsive:true,maintainAspectRatio:false,animation:{duration:350},plugins:{legend:{display:false},tooltip:{backgroundColor:'#101a2b',padding:11,titleFont:{family:'DM Sans',size:11},bodyFont:{family:'DM Sans',size:11},displayColors:true}},scales:{x:{grid:{display:false},ticks:{color:'#8792a2',font:{family:'DM Sans',size:10}}},y:{grid:{color:'#edf0f4'},border:{display:false},ticks:{color:'#8792a2',font:{family:'DM Mono',size:9},callback:v=>v}}}};
    charts[id]=new Chart(el, {...config,options:{...defaults,...config.options,plugins:{...defaults.plugins,...(config.options||{}).plugins},scales:{...defaults.scales,...(config.options||{}).scales}}});
  }
  function kpi(label,value,foot,cls='') { return `<article class="metric-card kpi-small ${cls}"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-foot">${foot}</div></article>`; }
  function renderOverview() {
    const regs=['2020','2023','18M'];
    makeChart('volatility-chart',{type:'bar',data:{labels:regs.map(regimeLabel),datasets:[{label:'High Risk',data:regs.map(r=>D.regimes['High Risk'][r].annualizedVolatility*100),backgroundColor:palette.navy,borderRadius:5,barPercentage:.62},{label:'Low Risk',data:regs.map(r=>D.regimes['Low Risk'][r].annualizedVolatility*100),backgroundColor:palette.lime,borderRadius:5,barPercentage:.62}]},options:{scales:{x:{grid:{display:false},ticks:{color:'#8792a2',font:{size:9}}},y:{beginAtZero:true,grid:{color:'#edf0f4'},ticks:{color:'#8792a2',font:{size:9},callback:v=>v+'%'}}},plugins:{tooltip:{callbacks:{label:c=>c.dataset.label+': '+c.raw.toFixed(2)+'%'}}}}});
    const h20=D.regimes['High Risk']['2020'].annualizedVolatility, h23=D.regimes['High Risk']['2023'].annualizedVolatility;
    $('#insight-high-2020').textContent=fmtPct(h20); $('#insight-high-2023').textContent=fmtPct(h23);
    const regime=$('#overview-regime').value;
    $('#overview-table tbody').innerHTML=['High Risk','Low Risk'].map(p=>{const m=D.regimes[p][regime];return `<tr><td><span class="dot" style="background:${portfolioColor(p)};display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:7px"></span>${p}</td><td>${fmtInt(m.observations)}</td><td>${fmtPct(m.annualizedMean)}</td><td>${fmtPct(m.annualizedVolatility)}</td><td>${fmtPct(m.parametricVaR95)}</td><td>${fmtPct(m.parametricVaR99)}</td><td>${fmtPct(Math.abs(m.historicalES99))}</td></tr>`}).join('');
  }
  function renderRisk() {
    const reg=$('#risk-regime').value; const high=D.regimes['High Risk'][reg], low=D.regimes['Low Risk'][reg];
    const maxVol=Math.max(high.annualizedVolatility,low.annualizedVolatility);
    $('#risk-kpis').innerHTML=kpi('HIGH RISK · ANNUALIZED VOLATILITY',fmtPct(high.annualizedVolatility),`Equal-weight · ${high.observations} observations`)+kpi('LOW RISK · ANNUALIZED VOLATILITY',fmtPct(low.annualizedVolatility),`Equal-weight · ${low.observations} observations`)+kpi('HIGH RISK · HISTORICAL ES 99%',fmtPct(Math.abs(high.historicalES99)),'Average empirical 1% tail loss')+kpi('LOW RISK · HISTORICAL ES 99%',fmtPct(Math.abs(low.historicalES99)),'Average empirical 1% tail loss');
    makeChart('risk-measures-chart',{type:'bar',data:{labels:['Parametric VaR 95%','Parametric VaR 99%','Historical ES 95%','Historical ES 99%'],datasets:[{label:'High Risk',data:[high.parametricVaR95,high.parametricVaR99,Math.abs(high.historicalES95),Math.abs(high.historicalES99)].map(v=>v*100),backgroundColor:palette.navy,borderRadius:4},{label:'Low Risk',data:[low.parametricVaR95,low.parametricVaR99,Math.abs(low.historicalES95),Math.abs(low.historicalES99)].map(v=>v*100),backgroundColor:palette.lime,borderRadius:4}]},options:{scales:{x:{grid:{display:false},ticks:{maxRotation:0,minRotation:0,color:'#8792a2',font:{size:9}}},y:{beginAtZero:true,grid:{color:'#edf0f4'},ticks:{callback:v=>v+'%',color:'#8792a2',font:{size:9}}}},plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:8,usePointStyle:true,pointStyle:'rect',color:'#68768a',font:{size:10}}},tooltip:{callbacks:{label:c=>c.dataset.label+': '+c.raw.toFixed(2)+'%'}}}}});
    $('#risk-interpretation').innerHTML=[['Volatility',`High Risk is ${maxVol===high.annualizedVolatility?'the more volatile':'the less volatile'} portfolio in this window. Volatility summarizes dispersion; it does not directly describe the severity of the worst tail losses.`],['VaR',`At 95% confidence, parametric VaR is ${fmtPct(high.parametricVaR95)} for High Risk and ${fmtPct(low.parametricVaR95)} for Low Risk. It is a threshold estimate, not a maximum possible loss.`],['Expected Shortfall',`Historical ES 99% is ${fmtPct(Math.abs(high.historicalES99))} for High Risk versus ${fmtPct(Math.abs(low.historicalES99))} for Low Risk. ES averages observed returns in the lower tail.`]].map((x,i)=>`<div class="interpretation-item"><span class="interpretation-num">0${i+1}</span><div><b>${x[0]}</b><p>${x[1]}</p></div></div>`).join('');
    $('#risk-observations').textContent=`${high.observations} / ${low.observations} complete observations`;
    $('#risk-mean-result').textContent=`High ${fmtPct(high.meanDaily,3)} daily · Low ${fmtPct(low.meanDaily,3)} daily`;
    $('#risk-var-result').textContent=`High ${fmtNum(high.varianceDaily,7)} · Low ${fmtNum(low.varianceDaily,7)} (daily)`;
    $('#risk-vol-result').textContent=`High ${fmtPct(high.annualizedVolatility)} · Low ${fmtPct(low.annualizedVolatility)}`;
    renderHoldings($('#risk-portfolio-toggle .selected')?.dataset.portfolio || 'High Risk');
  }
  function renderHoldings(port) {
    const rows=D.portfolios[port]||[];
    $('#holdings-table tbody').innerHTML=rows.map(x=>`<tr><td>${x.rank}</td><td>${x.stock}</td><td>${x.sector||'—'}</td><td>${fmtNum(x.score,2)}</td><td>${fmtPct(x.equalWeight,0)}</td><td>${fmtMoney(x.investment)}</td></tr>`).join('');
  }
  function renderVaR() {
    const p=$('#var-portfolio').value, reg=$('#var-regime').value, m=D.regimes[p][reg];
    $('#var-kpis').innerHTML=kpi('PARAMETRIC VaR · 95%',fmtPct(m.parametricVaR95),'Daily positive loss equivalent')+kpi('PARAMETRIC VaR · 99%',fmtPct(m.parametricVaR99),'Daily positive loss equivalent')+kpi('HISTORICAL ES · 95%',fmtPct(Math.abs(m.historicalES95)),'Average return in 5% tail')+kpi('HISTORICAL ES · 99%',fmtPct(Math.abs(m.historicalES99)),'Average return in 1% tail');
    makeChart('var-chart',{type:'bar',data:{labels:['Parametric VaR 95%','Parametric VaR 99%','Historical VaR 95%','Historical ES 95%','Historical VaR 99%','Historical ES 99%'],datasets:[{label:'Loss magnitude',data:[m.parametricVaR95,m.parametricVaR99,Math.abs(m.historicalVaR95),Math.abs(m.historicalES95),Math.abs(m.historicalVaR99),Math.abs(m.historicalES99)].map(v=>v*100),backgroundColor:[palette.blue,palette.navy,'#93a6c2','#c6d5cd','#6e8b84',palette.teal],borderRadius:4}]},options:{indexAxis:'y',scales:{x:{beginAtZero:true,grid:{color:'#edf0f4'},ticks:{callback:v=>v+'%',color:'#8792a2',font:{size:9}}},y:{grid:{display:false},ticks:{color:'#68768a',font:{size:9}}}},plugins:{tooltip:{callbacks:{label:c=>'Loss magnitude: '+c.raw.toFixed(2)+'%'}}}}});
    const es95=Math.abs(m.historicalES95), es99=Math.abs(m.historicalES99);
    $('#var-interpretation-sub').textContent=`${p} · ${regimeLabel(reg)}`;
    $('#var-interpretation').innerHTML=[['Tail severity',`Historical ES 99% is ${fmtPct(es99)}, meaning the average return among the empirical worst 1% of observations was this negative in the selected window.`],['Method comparison',`Parametric VaR 99% is ${fmtPct(m.parametricVaR99)} while historical VaR 99% is ${fmtPct(Math.abs(m.historicalVaR99))}. Different assumptions and empirical samples can produce different thresholds.`],['Decision use',`Use VaR to communicate a percentile threshold and ES to understand average tail severity. Neither measure captures every possible loss or guarantees future outcomes.`]].map((x,i)=>`<div class="interpretation-item"><span class="interpretation-num">0${i+1}</span><div><b>${x[0]}</b><p>${x[1]}</p></div></div>`).join('');
    renderBacktest($('#backtest-toggle .selected')?.dataset.portfolio||'High Risk');
  }
  function renderBacktest(p) {
    const bt=D.backtests[p]; if(!bt) return;
    const s95=bt.summary.find(x=>String(x.confidence).startsWith('95'))||bt.summary[0], s99=bt.summary.find(x=>String(x.confidence).startsWith('99'))||bt.summary[1];
    $('#backtest-kpis').innerHTML=kpi('95% EXCEPTIONS',`${s95.exceptions} <span> / ${fmtInt(s95.observations)}</span>`,`${fmtPct(s95.observedRate)} observed · ${fmtPct(s95.expectedRate)} expected`)+kpi('95% KUPIEC P-VALUE',fmtNum(s95.kupiecP,4),s95.interpretation,s95.kupiecP<.05?'':'')+kpi('99% EXCEPTIONS',`${s99.exceptions} <span> / ${fmtInt(s99.observations)}</span>`,`${fmtPct(s99.observedRate)} observed · ${fmtPct(s99.expectedRate)} expected`)+kpi('99% KUPIEC P-VALUE',fmtNum(s99.kupiecP,4),s99.interpretation);
    const labels=bt.series.map(x=>x.date.slice(5));
    makeChart('backtest-chart',{type:'line',data:{labels,datasets:[{label:'Actual return',data:bt.series.map(x=>x.actual*100),borderColor:palette.navy,backgroundColor:'#24354d10',pointRadius:0,borderWidth:1.5,tension:0,fill:false},{label:'VaR 95%',data:bt.series.map(x=>x.var95*100),borderColor:palette.red,borderWidth:1.1,pointRadius:0,tension:0,borderDash:[4,3]},{label:'VaR 99%',data:bt.series.map(x=>x.var99*100),borderColor:palette.teal,borderWidth:1.1,pointRadius:0,tension:0,borderDash:[2,3]}]},options:{scales:{x:{grid:{display:false},ticks:{maxTicksLimit:7,color:'#8792a2',font:{size:9}}},y:{grid:{color:'#edf0f4'},ticks:{callback:v=>v+'%',color:'#8792a2',font:{size:9}}}},plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:10,usePointStyle:true,color:'#68768a',font:{size:9}}}}}});
    $('#backtest-table tbody').innerHTML=bt.summary.map(x=>`<tr><td>${x.confidence}</td><td>${fmtPct(x.expectedRate,1)}</td><td>${fmtPct(x.observedRate,2)}</td><td>${fmtNum(x.kupiecP,4)}</td><td><span class="decision ${x.kupiecP<.05?'reject':'keep'}">${x.kupiecP<.05?'Reject H₀':'Do not reject'}</span></td></tr>`).join('');
  }
  function renderOptimizer() {
    const p=$('#opt-portfolio').value, r=$('#opt-regime').value, o=D.optimization[p][r], m=D.regimes[p][r];
    $('#opt-kpis').innerHTML=kpi('OPTIMIZED RETURN',fmtPct(o.optimizedReturn),'Annualized arithmetic estimate')+kpi('OPTIMIZED VOLATILITY',fmtPct(o.volatility),'√ annualized variance')+kpi('RETURN TARGET',fmtPct(o.target),'Constraint: expected return ≥ target')+kpi('WEIGHT SUM',fmtPct(o.weightSum,2),`Minimum holding ${fmtPct(o.minWeight)}`);
    makeChart('opt-comparison-chart',{type:'bar',data:{labels:['Expected return','Annualized volatility'],datasets:[{label:'Equal-weight baseline',data:[o.equalWeightMean*100,Math.sqrt(m.annualizedVolatility*m.annualizedVolatility)*100],backgroundColor:palette.grey,borderRadius:4},{label:'Optimized',data:[o.optimizedReturn*100,o.volatility*100],backgroundColor:palette.teal,borderRadius:4}]},options:{scales:{x:{grid:{display:false},ticks:{color:'#8792a2',font:{size:10}}},y:{grid:{color:'#edf0f4'},ticks:{callback:v=>v+'%',color:'#8792a2',font:{size:9}}}},plugins:{legend:{display:true,position:'bottom',labels:{boxWidth:8,usePointStyle:true,color:'#68768a',font:{size:10}}},tooltip:{callbacks:{label:c=>c.dataset.label+': '+c.raw.toFixed(2)+'%'}}}}});
    $('#opt-target').textContent=fmtPct(o.target); $('#opt-return').textContent=fmtPct(o.optimizedReturn);
    $('#opt-insight-title').textContent=o.optimizedReturn>o.target+0.005?'The optimum exceeds the return floor.':'The optimum sits near the return floor.';
    $('#opt-insight').textContent=`For ${p} in ${regimeLabel(r).toLowerCase()}, the target is ${fmtPct(o.target)} and the optimized estimate is ${fmtPct(o.optimizedReturn)}. Because the constraint is a minimum return rather than an exact equality, the optimizer can deliver a higher expected return when that also minimizes variance under the other constraints.`;
    const stocks=[...o.stocks].sort((a,b)=>b.optimizedWeight-a.optimizedWeight);
    makeChart('weights-chart',{type:'bar',data:{labels:stocks.map(x=>x.stock),datasets:[{label:'Optimized weight',data:stocks.map(x=>x.optimizedWeight*100),backgroundColor:stocks.map(x=>x.optimizedWeight>=.2?palette.teal:palette.navy),borderRadius:3}]},options:{indexAxis:'y',scales:{x:{beginAtZero:true,max:Math.max(40,Math.ceil(Math.max(...stocks.map(x=>x.optimizedWeight*100))/10)*10),grid:{color:'#edf0f4'},ticks:{callback:v=>v+'%',color:'#8792a2',font:{size:9}}},y:{grid:{display:false},ticks:{color:'#68768a',font:{size:9}}}},plugins:{tooltip:{callbacks:{label:c=>'Weight: '+c.raw.toFixed(2)+'%'}}}}});
    $('#weights-table tbody').innerHTML=o.stocks.map(x=>`<tr><td>${x.stock}</td><td>${fmtPct(x.equalWeight,0)}</td><td><b>${fmtPct(x.optimizedWeight)}</b></td><td class="${x.delta>=0?'positive':'negative'}">${fmtSignedPct(x.delta)}</td><td>${fmtPct(x.annualizedMean)}</td></tr>`).join('');
    renderCovariance(o.covariance);
  }
  function renderCovariance(c) {
    if(!c) return; const t=$('#covariance-table');
    t.innerHTML='<thead><tr><th>Stock</th>'+c.labels.map(x=>`<th title="${x}">${x.length>13?x.slice(0,12)+'…':x}</th>`).join('')+'</tr></thead><tbody>'+c.matrix.map((row,i)=>'<tr><td>'+c.labels[i]+'</td>'+row.map((v,j)=>{const intensity=Math.min(1,Math.abs(v||0)/Math.max(0.001,...c.matrix.flat().map(x=>Math.abs(x||0))));const bg=v>=0?`rgba(78,140,129,${.05+intensity*.28})`:`rgba(199,104,96,${.05+intensity*.24})`;return `<td style="background:${bg}" title="${c.labels[i]} × ${c.labels[j]}">${fmtNum(v,4)}</td>`}).join('')+'</tr>').join('')+'</tbody>';
  }
  function renderMethod() {
    const c=D.correlation; $('#vol-es-corr').textContent=fmtNum(c.matrix[1][2],3);
    const el=$('#correlation-heatmap'); let html='<div></div>'+c.labels.map(l=>`<div class="heat-head">${l.replace('Annualized ','')}</div>`).join('');
    c.labels.forEach((label,i)=>{html+=`<div class="heat-label">${label.replace('Annualized ','')}</div>`;c.matrix[i].forEach((v,j)=>{const pos=v>=0;const alpha=.08+Math.abs(v)*.6;const bg=i===j?'#dbe6e2':pos?`rgba(78,140,129,${alpha})`:`rgba(199,104,96,${alpha})`;const color=Math.abs(v)>.65?'#1d382f':'#344258';html+=`<div class="heat-cell" style="background:${bg};color:${color}" title="${label} vs ${c.labels[j]}: ${fmtNum(v,3)}">${fmtNum(v,2)}</div>`})}); el.innerHTML=html;
    renderRiskUniverse($('#risk-search').value||'');
  }
  function renderRiskUniverse(query) {
    const q=query.toLowerCase(); const rows=D.risk.filter(x=>x.company.toLowerCase().includes(q)).sort((a,b)=>(a.rank||999)-(b.rank||999));
    $('#risk-universe-table tbody').innerHTML=rows.map(x=>`<tr><td>${x.rank??'—'}</td><td>${x.company}</td><td>${fmtNum(x.beta,2)}</td><td>${fmtPct(x.volatility)}</td><td>${fmtPct(x.es99)}</td><td>${fmtPct(x.drawdown)}</td><td><b>${fmtNum(x.composite,2)}</b></td></tr>`).join('')||'<tr><td colspan="7" class="no-data">No companies match that search.</td></tr>';
  }
  const titles={overview:'Executive overview',risk:'Portfolio risk',var:'VaR & Expected Shortfall',optimizer:'Markowitz optimizer',method:'Methodology & data'};
  function gotoView(view) {
    $$('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+view));
    $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
    $('#crumb-title').textContent=titles[view]||titles.overview;
    if(location.hash!=='#'+view) history.replaceState(null,'','#'+view);
    window.scrollTo({top:0,behavior:'smooth'});
    if(view==='overview')renderOverview(); if(view==='risk')renderRisk(); if(view==='var')renderVaR(); if(view==='optimizer')renderOptimizer(); if(view==='method')renderMethod();
  }
  $$('.nav-item').forEach(b=>b.addEventListener('click',()=>gotoView(b.dataset.view)));
  $$('[data-goto]').forEach(b=>b.addEventListener('click',()=>gotoView(b.dataset.goto)));
  $$('[data-view]').forEach(b=>{if(!b.classList.contains('nav-item'))b.addEventListener('click',()=>gotoView(b.dataset.view))});
  $('#overview-regime').addEventListener('change',renderOverview);
  $('#risk-regime').addEventListener('change',renderRisk);
  $('#risk-portfolio-toggle').addEventListener('click',e=>{const b=e.target.closest('button[data-portfolio]');if(!b)return;$$('button',e.currentTarget).forEach(x=>x.classList.toggle('selected',x===b));renderHoldings(b.dataset.portfolio)});
  $('#var-portfolio').addEventListener('change',renderVaR); $('#var-regime').addEventListener('change',renderVaR);
  $('#backtest-toggle').addEventListener('click',e=>{const b=e.target.closest('button[data-portfolio]');if(!b)return;$$('button',e.currentTarget).forEach(x=>x.classList.toggle('selected',x===b));renderBacktest(b.dataset.portfolio)});
  $('#opt-portfolio').addEventListener('change',renderOptimizer); $('#opt-regime').addEventListener('change',renderOptimizer);
  $('#risk-search').addEventListener('input',e=>renderRiskUniverse(e.target.value));
  function download(filename,text,type='application/json') {const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);toast('Download prepared');}
  $('#download-data').addEventListener('click',()=>download('fra-risklab-data.json',JSON.stringify(D,null,2)));
  $('#download-json').addEventListener('click',()=>download('fra-risklab-data.json',JSON.stringify(D,null,2)));
  // First paint
  renderOverview(); renderRisk(); renderVaR(); renderOptimizer(); renderMethod();
  const initial=(location.hash||'').replace('#',''); if(titles[initial]) gotoView(initial);
})();
