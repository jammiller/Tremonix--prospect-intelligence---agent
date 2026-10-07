export function score(p) {
 const factors = {companyFit: p.fit ? 30 : 0, buyingSignals: Math.min(3,Math.max(0,Number(p.signals)||0))*10, budgetPotential:p.budget ? 20:0,growthIndicators:p.growth ? 15:0,engagementHistory:p.engaged ? 5:0};
 const total=Object.values(factors).reduce((a,b)=>a+b,0);
 return {total,factors,status:total>=80?'Hot':total>=60?'Warm':total>=40?'Nurture':'Low Priority'};
}
export function summary(p) { const s=score(p); return `${p.companyName} operates in ${p.industry || 'an unspecified industry'}${p.location ? ` in ${p.location}`:''}. ${p.employees ? `Reported employee count: ${p.employees}. `:''}${p.fit?'Marked as a fit for workforce training and competency solutions. ':'Product fit is not yet confirmed. '}${p.growth?'Growth has been reported. ':''}Opportunity score: ${s.total}/100 (${s.status}). Verify imported facts before outreach.`; }
export function parseCSV(text) {
 const rows=[]; let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i]; if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw new Error('Unclosed quoted CSV field'); row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 const headers=rows.shift()?.map(x=>x.replace(/^\uFEFF/,'').trim())||[];
 if(!headers.includes('companyName'))throw new Error('CSV requires a companyName column');
 return rows.map(values=>Object.fromEntries(headers.map((h,i)=>[h,values[i]||''])));
}
