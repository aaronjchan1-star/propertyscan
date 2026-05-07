// Build: 1778108810
import React, { useState, useMemo } from 'react';
import { Calculator, MapPin, Layers, Loader2, TrendingUp, TrendingDown, Sparkles, AlertCircle, ChevronDown, ChevronRight, Save, Trash2 } from 'lucide-react';

const stampDutyCalc = {
  NSW:(p)=>{ if(p<=16000)return Math.max(20,p*.0125); if(p<=35000)return 200+(p-16000)*.015; if(p<=93000)return 485+(p-35000)*.0175; if(p<=351000)return 1500+(p-93000)*.035; if(p<=1168000)return 10530+(p-351000)*.045; if(p<=3505000)return 47295+(p-1168000)*.055; return 175830+(p-3505000)*.07; },
  VIC:(p)=>{ if(p<=25000)return p*.014; if(p<=130000)return 350+(p-25000)*.024; if(p<=960000)return 2870+(p-130000)*.06; if(p<=2000000)return p*.055; return 110000+(p-2000000)*.065; },
  QLD:(p)=>{ if(p<=5000)return 0; if(p<=75000)return(p-5000)*.015; if(p<=540000)return 1050+(p-75000)*.035; if(p<=1000000)return 17325+(p-540000)*.045; return 38025+(p-1000000)*.0575; },
  WA:(p)=>{ if(p<=120000)return p*.019; if(p<=150000)return 2280+(p-120000)*.0285; if(p<=360000)return 3135+(p-150000)*.038; if(p<=725000)return 11115+(p-360000)*.0475; return 28453+(p-725000)*.0515; },
  SA:(p)=>{ if(p<=12000)return p*.01; if(p<=30000)return 120+(p-12000)*.02; if(p<=50000)return 480+(p-30000)*.03; if(p<=100000)return 1080+(p-50000)*.035; if(p<=200000)return 2830+(p-100000)*.04; if(p<=250000)return 6830+(p-200000)*.0425; if(p<=300000)return 8955+(p-250000)*.0475; if(p<=500000)return 11330+(p-300000)*.05; return 21330+(p-500000)*.055; },
  TAS:(p)=>{ if(p<=3000)return 50; if(p<=25000)return 50+(p-3000)*.0175; if(p<=75000)return 435+(p-25000)*.0225; if(p<=200000)return 1560+(p-75000)*.035; if(p<=375000)return 5935+(p-200000)*.04; if(p<=725000)return 12935+(p-375000)*.0425; return 27810+(p-725000)*.045; },
  ACT:(p)=>{ if(p<=260000)return p*.0049; if(p<=300000)return 1274+(p-260000)*.022; if(p<=500000)return 2154+(p-300000)*.034; if(p<=750000)return 8954+(p-500000)*.05; if(p<=1000000)return 21454+(p-750000)*.067; if(p<=1455000)return 38204+(p-1000000)*.07; return p*.0454; },
  NT:(p)=>{ if(p<=525000)return(.06571441*(p/1000)**2+15*(p/1000)); if(p<=3000000)return p*.0495; if(p<=5000000)return p*.0575; return p*.0595; },
};

const fhbStampDuty = {
  NSW:(p)=>{ if(p<=800000)return 0; if(p<=1000000)return stampDutyCalc.NSW(p)*((p-800000)/200000); return stampDutyCalc.NSW(p); },
  VIC:(p)=>{ if(p<=600000)return 0; if(p<=750000)return stampDutyCalc.VIC(p)*((p-600000)/150000); return stampDutyCalc.VIC(p); },
  QLD:(p)=>{ if(p<=700000)return 0; if(p<=800000)return stampDutyCalc.QLD(p)*((p-700000)/100000); return stampDutyCalc.QLD(p); },
  WA:(p)=>{ if(p<=430000)return 0; if(p<=530000)return stampDutyCalc.WA(p)*((p-430000)/100000); return stampDutyCalc.WA(p); },
  SA:(p)=>stampDutyCalc.SA(p),
  TAS:(p)=>p<=750000?stampDutyCalc.TAS(p)*.5:stampDutyCalc.TAS(p),
  ACT:(p)=>p<=750000?0:stampDutyCalc.ACT(p),
  NT:(p)=>stampDutyCalc.NT(p)*.5,
};

const fhogByState = {
  NSW:{amount:10000,cap:600000,label:'$10,000 FHOG (new homes ≤ $600k)'},
  VIC:{amount:10000,cap:750000,label:'$10,000 FHOG (new homes ≤ $750k)'},
  QLD:{amount:30000,cap:null,label:'$30,000 FHOG (new homes)'},
  WA:{amount:10000,cap:750000,label:'$10,000 FHOG (new homes ≤ $750k)'},
  SA:{amount:15000,cap:null,label:'$15,000 FHOG (new homes)'},
  TAS:{amount:30000,cap:null,label:'$30,000 FHOG (new homes, until Jun 2026)'},
  ACT:{amount:0,cap:null,label:'No FHOG in ACT'},
  NT:{amount:50000,cap:null,label:'$50,000 FHOG (new/substantially renovated)'},
};

const getFhog=(state,price,isNew,type)=>{
  if(type!=='fhb'||!isNew)return 0;
  const g=fhogByState[state]; if(!g||g.amount===0)return 0;
  if(g.cap&&price>g.cap)return 0; return g.amount;
};

const states=['NSW','VIC','QLD','WA','SA','TAS','ACT','NT'];
const calculateLMI=(loan,val)=>{ const lvr=(loan/val)*100; if(lvr<=80)return 0; let r=lvr<=81?.0048:lvr<=85?.0095:lvr<=90?.019:lvr<=95?.035:.048; return loan*r; };
const getMarginalRate=(inc)=>inc<=18200?0:inc<=45000?.18:inc<=135000?.32:inc<=190000?.39:.47;
const calcRepayment=(p,r,y,t)=>{ const mr=r/100/12,n=y*12; if(t==='IO')return p*mr; if(mr===0)return p/n; return(p*mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1); };
function firstYearInterest(p,r,y){ const m=calcRepayment(p,r,y,'PI'),mr=r/100/12; let b=p,i=0; for(let x=0;x<12;x++){const ip=b*mr;i+=ip;b-=(m-ip);} return i; }
const fmt=(n,d=0)=>isNaN(n)||!isFinite(n)?'$0':new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const pct=(n,d=2)=>isNaN(n)||!isFinite(n)?'0%':`${n.toFixed(d)}%`;

const defaultInputs={
  suburb:'Lidcombe',state:'NSW',propertyType:'Unit',bedrooms:2,bathrooms:1,parking:1,
  buyerType:'investor',fhbPurpose:'ppor',isNewBuild:false,useGuarantor:false,
  purchasePrice:720000,weeklyRent:620,deposit:144000,interestRate:6.15,loanTermYears:30,loanType:'PI',
  councilRates:1600,waterRates:900,strataFees:4800,insurance:600,pmFeesPct:6.5,
  vacancyWeeks:2,maintenancePct:1.0,landTax:0,legalFees:1800,buildingInspection:600,
  taxableIncome:160000,capitalGrowthPct:4.5,rentGrowthPct:3.0,depreciation:4000,
};

export default function App(){
  const [tab,setTab]=useState('calc');
  const [inputs,setInputs]=useState(defaultInputs);
  const [saved,setSaved]=useState([]);
  const [saveName,setSaveName]=useState('');
  const [showSave,setShowSave]=useState(false);
  const upd=(k,v)=>setInputs(p=>({...p,[k]:v}));

  const calc=useMemo(()=>{
    const p=Number(inputs.purchasePrice)||0,dep=Number(inputs.deposit)||0;
    const isFhbPpor=inputs.buyerType==='fhb'&&inputs.fhbPurpose==='ppor';
    const loan=Math.max(0,p-(inputs.useGuarantor?0:dep));
    const lvr=p>0?(loan/p)*100:0;
    const fullDuty=stampDutyCalc[inputs.state]?stampDutyCalc[inputs.state](p):0;
    const stampDuty=isFhbPpor&&fhbStampDuty[inputs.state]?fhbStampDuty[inputs.state](p):fullDuty;
    const stampDutySaving=fullDuty-stampDuty;
    const lmi=inputs.useGuarantor?0:calculateLMI(loan,p);
    const lmiSaving=inputs.useGuarantor?calculateLMI(loan,p):0;
    const fhogGrant=getFhog(inputs.state,p,inputs.isNewBuild,inputs.buyerType);
    const tf=170,mr=165;
    const upfrontCosts=stampDuty+lmi+tf+mr+Number(inputs.legalFees)+Number(inputs.buildingInspection);
    const totalCashRequired=dep+upfrontCosts-fhogGrant;
    const totalSavings=stampDutySaving+lmiSaving+fhogGrant;
    const grossRent=(Number(inputs.weeklyRent)||0)*52;
    const vacancyLoss=(Number(inputs.weeklyRent)||0)*(Number(inputs.vacancyWeeks)||0);
    const effectiveRent=grossRent-vacancyLoss;
    const pmFees=effectiveRent*(Number(inputs.pmFeesPct)||0)/100;
    const maintenance=p*(Number(inputs.maintenancePct)||0)/100;
    const totalOpEx=Number(inputs.councilRates)+Number(inputs.waterRates)+Number(inputs.strataFees)+Number(inputs.insurance)+Number(inputs.landTax)+pmFees+maintenance;
    const monthlyRepay=calcRepayment(loan,Number(inputs.interestRate),Number(inputs.loanTermYears),inputs.loanType);
    const annualRepay=monthlyRepay*12;
    const annualInterest=inputs.loanType==='IO'?loan*Number(inputs.interestRate)/100:firstYearInterest(loan,Number(inputs.interestRate),Number(inputs.loanTermYears));
    const cashflowBeforeTax=effectiveRent-totalOpEx-annualRepay;
    const grossYield=p>0?(grossRent/p)*100:0;
    const netYield=p>0?((effectiveRent-totalOpEx)/p)*100:0;
    const taxableLossOrGain=effectiveRent-totalOpEx-annualInterest-Number(inputs.depreciation);
    const marginalRate=getMarginalRate(Number(inputs.taxableIncome));
    const taxBenefit=taxableLossOrGain<0?-taxableLossOrGain*marginalRate:-taxableLossOrGain*marginalRate;
    const cashflowAfterTax=cashflowBeforeTax+taxBenefit;
    const cashflowAfterTaxWeekly=cashflowAfterTax/52;
    const cashOnCash=totalCashRequired>0?(cashflowAfterTax/totalCashRequired)*100:0;
    const projection=[];
    let pv=p,rent=grossRent,cumCF=0;
    for(let yr=1;yr<=10;yr++){
      pv*=(1+Number(inputs.capitalGrowthPct)/100); rent*=(1+Number(inputs.rentGrowthPct)/100);
      const yEff=rent-rent/52*Number(inputs.vacancyWeeks);
      const yOpEx=(Number(inputs.councilRates)+Number(inputs.waterRates)+Number(inputs.strataFees)+Number(inputs.insurance)+Number(inputs.landTax))*Math.pow(1.025,yr-1)+yEff*Number(inputs.pmFeesPct)/100+pv*Number(inputs.maintenancePct)/100;
      const yCF=yEff-yOpEx-annualRepay; cumCF+=yCF;
      projection.push({year:yr,propValue:pv,rent,cashflow:yCF,equity:dep+(pv-p),totalReturn:cumCF+(pv-p)});
    }
    let breakEvenYear=null;
    for(let i=0;i<projection.length;i++){if(projection[i].totalReturn>=upfrontCosts){breakEvenYear=projection[i].year;break;}}
    return{loan,lvr,stampDuty,fullDuty,stampDutySaving,lmi,lmiSaving,fhogGrant,tf,mr,upfrontCosts,totalCashRequired,totalSavings,grossRent,vacancyLoss,effectiveRent,pmFees,maintenance,totalOpEx,monthlyRepay,annualRepay,annualInterest,cashflowBeforeTax,cashflowWeekly:cashflowBeforeTax/52,cashflowAfterTax,cashflowAfterTaxWeekly,grossYield,netYield,cashOnCash,taxableLossOrGain,marginalRate,taxBenefit,projection,breakEvenYear};
  },[inputs]);

  return(
    <div style={{minHeight:'100vh',background:'var(--bg)',color:'var(--text)',fontFamily:'var(--font)'}}>
      <style>{CSS}</style>
      <header className="hdr">
        <div className="wrap">
          <div className="hdr-top">
            <div>
              <div className="eyebrow">Australian Property Investment Scanner · FY 2025/26</div>
              <h1 className="hero">Scan, model &amp; stress-test<br/><em>Australian property.</em></h1>
              <p className="hero-sub">Stamp duty · FHB grants · negative gearing · 10-year projection · AI suburb research</p>
            </div>
          </div>
          <div className="tabs">
            {[{id:'calc',l:'Calculator',I:Calculator},{id:'suburb',l:'Suburb Insights',I:MapPin},{id:'compare',l:'Compare',I:Layers,b:saved.length}].map(({id,l,I,b})=>(
              <button key={id} onClick={()=>setTab(id)} className={`tab${tab===id?' tab-on':''}`}>
                <I size={13}/>{l}{b>0&&<span className="tab-pip">{b}</span>}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="wrap" style={{padding:'20px 0 48px'}}>
        {tab==='calc'&&<CalcView inputs={inputs} upd={upd} calc={calc} onSave={()=>setShowSave(true)}/>}
        {tab==='suburb'&&<SuburbView initialSuburb={inputs.suburb}/>}
        {tab==='compare'&&<CompareView saved={saved} remove={id=>setSaved(p=>p.filter(s=>s.id!==id))} cur={{inputs,calc}}/>}
      </main>

      <footer className="ftr"><div className="wrap">Estimates only — verify stamp duty, LMI and tax with your conveyancer, broker and accountant before transacting.</div></footer>

      {showSave&&(
        <div className="overlay" onClick={()=>setShowSave(false)}>
          <div className="dialog" onClick={e=>e.stopPropagation()}>
            <h3 style={{fontFamily:'var(--ff)',fontSize:22,marginBottom:5}}>Save scenario</h3>
            <p style={{fontSize:12,color:'var(--muted)',marginBottom:16}}>Name this scenario to compare it with others.</p>
            <input autoFocus value={saveName} onChange={e=>setSaveName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&saveName.trim()){setSaved(p=>[...p,{id:Date.now(),name:saveName.trim(),inputs:{...inputs},calc:{...calc}}]);setSaveName('');setShowSave(false);}}} placeholder="e.g. Lidcombe 2BR Unit" className="inp"/>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:10}}>
              <button className="btn-ghost" onClick={()=>setShowSave(false)}>Cancel</button>
              <button className="btn-accent" onClick={()=>{if(!saveName.trim())return;setSaved(p=>[...p,{id:Date.now(),name:saveName.trim(),inputs:{...inputs},calc:{...calc}}]);setSaveName('');setShowSave(false);}}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalcView({inputs,upd,calc,onSave}){
  return(
    <div className="two-col">
      <div className="col-inputs">
        <Card title="Property" n="01">
          <Grid2>
            <F l="Suburb"><input value={inputs.suburb} onChange={e=>upd('suburb',e.target.value)} className="inp"/></F>
            <F l="State"><Sel value={inputs.state} onChange={v=>upd('state',v)} opts={states.map(s=>({v:s,l:s}))}/></F>
          </Grid2>
          <Grid2>
            <F l="Type"><Sel value={inputs.propertyType} onChange={v=>upd('propertyType',v)} opts={['House','Unit','Townhouse','Land'].map(x=>({v:x,l:x}))}/></F>
            <F l="Beds"><Sel value={inputs.bedrooms} onChange={v=>upd('bedrooms',Number(v))} opts={[1,2,3,4,5,6].map(n=>({v:n,l:n}))}/></F>
          </Grid2>
          <Grid2>
            <F l="Baths"><Sel value={inputs.bathrooms} onChange={v=>upd('bathrooms',Number(v))} opts={[1,1.5,2,2.5,3,4].map(n=>({v:n,l:n}))}/></F>
            <F l="Parking"><Sel value={inputs.parking} onChange={v=>upd('parking',Number(v))} opts={[0,1,2,3,4].map(n=>({v:n,l:String(n)==='0'?'None':n}))}/></F>
          </Grid2>
          <Grid2>
            <F l="Purchase price" pre="$"><Num value={inputs.purchasePrice} onChange={v=>upd('purchasePrice',v)}/></F>
            <F l="Weekly rent" pre="$"><Num value={inputs.weeklyRent} onChange={v=>upd('weeklyRent',v)}/></F>
          </Grid2>
        </Card>

        <Card title="Buyer profile" n="02">
          <F l="Buyer type"><Tog opts={[['investor','Investor'],['fhb','First Home Buyer']]} val={inputs.buyerType} set={v=>upd('buyerType',v)}/></F>
          {inputs.buyerType==='fhb'&&<>
            <F l="Intended use"><Tog opts={[['ppor','Live in (PPOR)'],['investment','Rent out']]} val={inputs.fhbPurpose} set={v=>upd('fhbPurpose',v)}/></F>
            <F l="Build type"><Tog opts={[[false,'Established'],[true,'New build']]} val={inputs.isNewBuild} set={v=>upd('isNewBuild',v)}/></F>
            {inputs.fhbPurpose==='ppor'&&<div className="info-box">
              <strong>FHB PPOR concession applied</strong> — {inputs.state} stamp duty reduced{inputs.isNewBuild&&fhogByState[inputs.state]?.amount>0?` + ${fhogByState[inputs.state].label}`:''}
              {!inputs.isNewBuild?' · Select new build to unlock FHOG':''}
            </div>}
          </>}
          <F l="Family guarantor?"><Tog opts={[[false,'No guarantor'],[true,'Yes – use guarantor']]} val={inputs.useGuarantor} set={v=>upd('useGuarantor',v)}/></F>
          {inputs.useGuarantor&&<div className="info-box"><strong>Guarantor active</strong> — LMI waived · Loan at 100% LVR · Guarantor's property at risk until your equity reaches ~20%</div>}
        </Card>

        <Card title="Loan structure" n="03">
          <Grid2>
            <F l="Deposit" pre="$"><Num value={inputs.deposit} onChange={v=>upd('deposit',v)}/></F>
            <F l="LVR"><div className="lvr-box" style={{color:calc.lvr>80?'var(--neg)':'var(--pos)'}}>{pct(calc.lvr,1)}</div></F>
          </Grid2>
          <Grid2>
            <F l="Interest rate" suf="%"><Num value={inputs.interestRate} onChange={v=>upd('interestRate',v)} step={0.01}/></F>
            <F l="Term" suf="yrs"><Num value={inputs.loanTermYears} onChange={v=>upd('loanTermYears',v)}/></F>
          </Grid2>
          <F l="Repayment type"><Tog opts={[['PI','Principal & Interest'],['IO','Interest Only']]} val={inputs.loanType} set={v=>upd('loanType',v)}/></F>
        </Card>

        <Card title="Annual costs" n="04">
          <Grid2>
            <F l="Council rates" pre="$"><Num value={inputs.councilRates} onChange={v=>upd('councilRates',v)}/></F>
            <F l="Water rates" pre="$"><Num value={inputs.waterRates} onChange={v=>upd('waterRates',v)}/></F>
          </Grid2>
          <Grid2>
            <F l="Strata / body corp" pre="$"><Num value={inputs.strataFees} onChange={v=>upd('strataFees',v)}/></F>
            <F l="Insurance" pre="$"><Num value={inputs.insurance} onChange={v=>upd('insurance',v)}/></F>
          </Grid2>
          <Grid2>
            <F l="Land tax" pre="$"><Num value={inputs.landTax} onChange={v=>upd('landTax',v)}/></F>
            <F l="PM fees" suf="%"><Num value={inputs.pmFeesPct} onChange={v=>upd('pmFeesPct',v)} step={0.1}/></F>
          </Grid2>
          <Grid2>
            <F l="Vacancy" suf="wks"><Num value={inputs.vacancyWeeks} onChange={v=>upd('vacancyWeeks',v)} step={0.5}/></F>
            <F l="Maintenance" suf="% p.a."><Num value={inputs.maintenancePct} onChange={v=>upd('maintenancePct',v)} step={0.1}/></F>
          </Grid2>
        </Card>

        <Card title="Tax & growth" n="05">
          <F l="Your income (excl. property)" pre="$"><Num value={inputs.taxableIncome} onChange={v=>upd('taxableIncome',v)}/></F>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--muted)',padding:'2px 0'}}>
            <span>Marginal rate</span><span className="mono">{pct(calc.marginalRate*100,0)}</span>
          </div>
          <Grid2>
            <F l="Capital growth" suf="% p.a."><Num value={inputs.capitalGrowthPct} onChange={v=>upd('capitalGrowthPct',v)} step={0.1}/></F>
            <F l="Rent growth" suf="% p.a."><Num value={inputs.rentGrowthPct} onChange={v=>upd('rentGrowthPct',v)} step={0.1}/></F>
          </Grid2>
          <F l="Annual depreciation" pre="$"><Num value={inputs.depreciation} onChange={v=>upd('depreciation',v)}/></F>
        </Card>

        <button className="save-btn" onClick={onSave}><Save size={14}/>Save scenario for comparison</button>
      </div>

      <div className="col-outputs">
        <div className="stats-row">
          <Stat l="Gross yield" v={pct(calc.grossYield)} s={`${fmt(calc.grossRent)}/yr`} tone={calc.grossYield>=5?'pos':calc.grossYield>=4?'neu':'neg'}/>
          <Stat l="Net yield" v={pct(calc.netYield)} s={`After ${fmt(calc.totalOpEx)} opex`} tone={calc.netYield>=4?'pos':calc.netYield>=3?'neu':'neg'}/>
          <Stat l="Weekly cashflow" v={`${calc.cashflowAfterTaxWeekly>=0?'+':''}${fmt(calc.cashflowAfterTaxWeekly)}`} s="After tax · neg. gearing" tone={calc.cashflowAfterTaxWeekly>=0?'pos':'neg'}/>
          <Stat l="Cash to close" v={fmt(calc.totalCashRequired)} s={`Deposit + ${fmt(calc.upfrontCosts)} costs`} tone="neu"/>
        </div>

        <div className="callout" style={{borderLeftColor:calc.cashflowAfterTaxWeekly>=0?'var(--pos)':'var(--neg)'}}>
          <div style={{fontSize:11,letterSpacing:'.08em',textTransform:'uppercase',color:calc.cashflowAfterTaxWeekly>=0?'var(--pos)':'var(--neg)',marginBottom:6,fontWeight:600}}>
            {calc.cashflowAfterTaxWeekly>=0?'✦ Positively geared':'✦ Negatively geared'}
          </div>
          <div style={{fontFamily:'var(--ff)',fontSize:21,lineHeight:1.3,marginBottom:6}}>
            {calc.cashflowAfterTaxWeekly>=0
              ?<>Property pays you <strong style={{color:'var(--pos)'}}>{fmt(Math.abs(calc.cashflowAfterTaxWeekly))} / week</strong></>
              :<>Top up from pocket: <strong style={{color:'var(--neg)'}}>{fmt(Math.abs(calc.cashflowAfterTaxWeekly))} / week</strong></>}
          </div>
          <div style={{fontSize:12,color:'var(--muted)'}}>
            Pre-tax: {fmt(calc.cashflowWeekly)}/wk &nbsp;·&nbsp; Tax {calc.taxBenefit>=0?'saved':'owed'}: {fmt(Math.abs(calc.taxBenefit))}/yr &nbsp;·&nbsp; Cash-on-cash: {pct(calc.cashOnCash)}
          </div>
          {calc.totalSavings>0&&<div className="savings-pill">🎉 {fmt(calc.totalSavings)} in concessions applied</div>}
        </div>

        <Acc title="Upfront cost breakdown" open>
          <table className="tbl">
            <tbody>
              <TR l={`Stamp duty (${inputs.state}${inputs.buyerType==='fhb'&&inputs.fhbPurpose==='ppor'?', FHB':''})`} v={fmt(calc.stampDuty)} sub={calc.stampDutySaving>0?`Saving ${fmt(calc.stampDutySaving)} vs full rate`:null}/>
              {calc.stampDutySaving>0&&<TR l="→ FHB stamp duty saving" v={`-${fmt(calc.stampDutySaving)}`} pos/>}
              <TR l="LMI" v={fmt(calc.lmi)} muted={calc.lmi===0} sub={inputs.useGuarantor?'Waived — guarantor':calc.lmi===0?'LVR ≤ 80%':`LVR ${pct(calc.lvr,1)}`}/>
              {calc.lmiSaving>0&&<TR l="→ Guarantor LMI saving" v={`-${fmt(calc.lmiSaving)}`} pos/>}
              <TR l="Legal / conveyancing" v={fmt(inputs.legalFees)}/>
              <TR l="Building & pest inspection" v={fmt(inputs.buildingInspection)}/>
              <TR l="Transfer & mortgage rego" v={fmt(calc.tf+calc.mr)}/>
              <TR l="Total upfront costs" v={fmt(calc.upfrontCosts)} bold/>
              <TR l="+ Cash deposit" v={fmt(inputs.deposit)}/>
              {calc.fhogGrant>0&&<TR l={`− FHOG grant (${inputs.state})`} v={`-${fmt(calc.fhogGrant)}`} pos sub={fhogByState[inputs.state]?.label}/>}
              <TR l="Total cash required" v={fmt(calc.totalCashRequired)} bold accent/>
              {calc.totalSavings>0&&<TR l="Total concession savings" v={fmt(calc.totalSavings)} pos bold sub="vs standard investor"/>}
            </tbody>
          </table>
        </Acc>

        <Acc title="Annual cashflow breakdown">
          <table className="tbl">
            <tbody>
              <TR l="Gross rent (52 wks)" v={fmt(calc.grossRent)}/>
              <TR l={`Vacancy (${inputs.vacancyWeeks} wks)`} v={`-${fmt(calc.vacancyLoss)}`}/>
              <TR l="Effective rental income" v={fmt(calc.effectiveRent)} bold/>
              <tr><td colSpan={2} className="tbl-section">Operating costs</td></tr>
              <TR l="Council rates" v={`-${fmt(inputs.councilRates)}`}/>
              <TR l="Water rates" v={`-${fmt(inputs.waterRates)}`}/>
              <TR l="Strata / body corp" v={`-${fmt(inputs.strataFees)}`}/>
              <TR l="Insurance" v={`-${fmt(inputs.insurance)}`}/>
              {inputs.landTax>0&&<TR l="Land tax" v={`-${fmt(inputs.landTax)}`}/>}
              <TR l={`PM fees (${inputs.pmFeesPct}%)`} v={`-${fmt(calc.pmFees)}`}/>
              <TR l={`Maintenance (${inputs.maintenancePct}%)`} v={`-${fmt(calc.maintenance)}`}/>
              <TR l="Total operating costs" v={`-${fmt(calc.totalOpEx)}`} bold/>
              <tr><td colSpan={2} className="tbl-section">Loan</td></tr>
              <TR l={`Repayments (${inputs.loanType==='IO'?'IO':'P&I'})`} v={`-${fmt(calc.annualRepay)}`} sub={`${fmt(calc.monthlyRepay)}/month`}/>
              <TR l="Cashflow before tax" v={fmt(calc.cashflowBeforeTax)} bold/>
              <tr><td colSpan={2} className="tbl-section">Tax</td></tr>
              <TR l="Taxable loss / gain" v={fmt(calc.taxableLossOrGain)} sub={`Rent − opex − interest − ${fmt(inputs.depreciation)} dep.`}/>
              <TR l={`Tax ${calc.taxBenefit>=0?'saved':'owed'} @ ${pct(calc.marginalRate*100,0)}`} v={`${calc.taxBenefit>=0?'+':''}${fmt(calc.taxBenefit)}`} pos={calc.taxBenefit>=0}/>
              <TR l="Cashflow after tax" v={fmt(calc.cashflowAfterTax)} bold accent/>
            </tbody>
          </table>
        </Acc>

        <Acc title="10-year projection">
          <ProjChart proj={calc.projection} pp={inputs.purchasePrice}/>
          <table className="tbl" style={{marginTop:12}}>
            <thead><tr style={{color:'var(--muted)',fontSize:11}}>
              {['Yr','Value','Rent/yr','Cashflow','Equity'].map(h=><th key={h} style={{padding:'4px 4px',fontWeight:400,textAlign:h==='Yr'?'left':'right',textTransform:'uppercase',letterSpacing:'.06em'}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {calc.projection.map(r=>(
                <tr key={r.year} style={{borderTop:'1px solid var(--border)'}}>
                  <td className="mono" style={{padding:'5px 4px',fontSize:12}}>{r.year}</td>
                  <td className="mono" style={{padding:'5px 4px',fontSize:12,textAlign:'right'}}>{fmt(r.propValue)}</td>
                  <td className="mono" style={{padding:'5px 4px',fontSize:12,textAlign:'right'}}>{fmt(r.rent)}</td>
                  <td className="mono" style={{padding:'5px 4px',fontSize:12,textAlign:'right',color:r.cashflow>=0?'var(--pos)':'var(--neg)'}}>{fmt(r.cashflow)}</td>
                  <td className="mono" style={{padding:'5px 4px',fontSize:12,textAlign:'right'}}>{fmt(r.equity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {calc.breakEvenYear&&<div className="info-box" style={{marginTop:12}}>Break-even (cashflow + equity ≥ upfront costs): <strong>Year {calc.breakEvenYear}</strong></div>}
        </Acc>
      </div>
    </div>
  );
}

function ProjChart({proj,pp}){
  const W=580,H=180,pl=52,pr=12,pt=14,pb=26,iW=W-pl-pr,iH=H-pt-pb;
  const maxV=Math.max(...proj.map(r=>r.propValue)),minV=pp*.96;
  const ys=v=>pt+iH-((v-minV)/(maxV-minV))*iH;
  const xs=i=>pl+(i/(proj.length-1))*iW;
  const line=proj.map((r,i)=>`${i===0?'M':'L'}${xs(i).toFixed(1)} ${ys(r.propValue).toFixed(1)}`).join(' ');
  const area=`M${pl} ${ys(proj[0].equity).toFixed(1)} `+proj.map((r,i)=>`L${xs(i).toFixed(1)} ${ys(r.equity).toFixed(1)}`).join(' ')+` L${pl+iW} ${pt+iH} L${pl} ${pt+iH}Z`;
  return(
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',display:'block',maxHeight:180}}>
      <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--acc)" stopOpacity=".22"/><stop offset="100%" stopColor="var(--acc)" stopOpacity="0"/></linearGradient></defs>
      {[0,.5,1].map(t=>{ const v=minV+t*(maxV-minV); return <g key={t}><line x1={pl} x2={pl+iW} y1={ys(v)} y2={ys(v)} stroke="var(--border)" strokeDasharray="3,5"/><text x={pl-5} y={ys(v)+3} textAnchor="end" fontSize="9" fill="var(--muted)" fontFamily="monospace">{fmt(v)}</text></g>; })}
      {proj.filter((_,i)=>i%2===0).map(r=><text key={r.year} x={xs(r.year-1)} y={H-6} textAnchor="middle" fontSize="9" fill="var(--muted)" fontFamily="monospace">Y{r.year}</text>)}
      <path d={area} fill="url(#eg)"/><path d={line} fill="none" stroke="var(--acc)" strokeWidth="1.5"/>
      {proj.map((r,i)=><circle key={i} cx={xs(i)} cy={ys(r.propValue)} r="2.5" fill="var(--acc)"/>)}
    </svg>
  );
}

function SuburbView({initialSuburb}){
  const [suburb,setSuburb]=useState(initialSuburb||'');
  const [propType,setPropType]=useState('Unit');
  const [beds,setBeds]=useState('2');
  const [baths,setBaths]=useState('1');
  const [parking,setParking]=useState('1');
  const [budget,setBudget]=useState('700000');
  const [loading,setLoading]=useState(false);
  const [data,setData]=useState(null);
  const [error,setError]=useState(null);

  const run=async()=>{
    if(!suburb.trim())return;
    setLoading(true);setError(null);setData(null);
    const parkingDesc=parking==='0'?'no parking':`${parking} parking space${parking==='1'?'':'s'}`;
    try{
      const res=await fetch('https://ath-prox.aaronjchan1.workers.dev',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({model:'claude-sonnet-4-5',max_tokens:2000,
          messages:[{role:'user',content:`You are an Australian property investment analyst. Analyse a ${beds}-bed, ${baths}-bath ${propType.toLowerCase()} with ${parkingDesc} in ${suburb} around $${Number(budget).toLocaleString('en-AU')}. Search for current 2025/2026 data. Return ONLY valid JSON (no markdown): {"summary":"...","metrics":{"medianPrice":null,"medianWeeklyRent":null,"grossYield":null,"vacancyRate":null,"fiveYearGrowth":null,"rentGrowthYoY":null},"verdict":"buy"|"watch"|"avoid","verdictReason":"...","strengths":["..."],"risks":["..."],"demographics":"...","infrastructure":"...","comparableSuburbs":[{"name":"...","reason":"..."}]}`}],
          tools:[{type:'web_search_20250305',name:'web_search'}]}),
      });
      const d=await res.json();
      const text=d.content.filter(b=>b.type==='text').map(b=>b.text).join('');
      const s=text.indexOf('{'),e=text.lastIndexOf('}');
      setData(JSON.parse(text.substring(s,e+1)));
    }catch(err){setError('Could not generate analysis. Please try again.');}
    finally{setLoading(false);}
  };

  const vc={buy:'var(--pos)',watch:'var(--acc)',avoid:'var(--neg)'}[data?.verdict]||'var(--text)';

  return(
    <div className="two-col">
      <div className="col-inputs">
        <Card title="Suburb research" n="01">
          <F l="Suburb"><input value={suburb} onChange={e=>setSuburb(e.target.value)} placeholder="e.g. Lidcombe" className="inp"/></F>
          <Grid2>
            <F l="Type"><Sel value={propType} onChange={setPropType} opts={['Unit','House','Townhouse'].map(x=>({v:x,l:x}))}/></F>
            <F l="Bedrooms"><Sel value={beds} onChange={setBeds} opts={['1','2','3','4','5+'].map(x=>({v:x,l:x}))}/></F>
          </Grid2>
          <Grid2>
            <F l="Bathrooms"><Sel value={baths} onChange={setBaths} opts={['1','1.5','2','2.5','3','4'].map(x=>({v:x,l:x}))}/></F>
            <F l="Parking"><Sel value={parking} onChange={setParking} opts={[{v:'0',l:'None'},{v:'1',l:'1'},{v:'2',l:'2'},{v:'3',l:'3'},{v:'4',l:'4'}]}/></F>
          </Grid2>
          <F l="Budget" pre="$"><Num value={budget} onChange={v=>setBudget(v)}/></F>
          <button onClick={run} disabled={loading||!suburb.trim()} className="btn-accent" style={{width:'100%',marginTop:4,justifyContent:'center',gap:8,display:'flex',alignItems:'center'}}>
            {loading?<><Loader2 size={13} style={{animation:'spin .8s linear infinite'}}/>Researching…</>:<><Sparkles size={13}/>Analyse suburb</>}
          </button>
          <p style={{fontSize:11,color:'var(--muted)',marginTop:8,lineHeight:1.5}}>Pulls live web data — median prices, rents, vacancy, growth. ~20 seconds.</p>
        </Card>
      </div>
      <div className="col-outputs">
        {!data&&!loading&&!error&&<div className="empty"><MapPin size={32} style={{color:'var(--muted)',marginBottom:6}}/><h3 style={{fontFamily:'var(--ff)',fontSize:20,marginBottom:5}}>Suburb intelligence</h3><p style={{fontSize:13,color:'var(--muted)',maxWidth:340}}>Enter a suburb for median prices, rental yields, vacancy, growth, and a live buy/watch/avoid verdict.</p></div>}
        {loading&&<div className="empty"><Loader2 size={28} style={{color:'var(--acc)',marginBottom:6,animation:'spin .8s linear infinite'}}/><p style={{color:'var(--muted)',fontSize:13}}>Searching property data…</p></div>}
        {error&&<div style={{display:'flex',gap:12,padding:16,borderRadius:8,border:'1px solid var(--neg)',background:'rgba(194,80,80,.06)'}}><AlertCircle size={16} style={{color:'var(--neg)',marginTop:2}}/><span style={{fontSize:13}}>{error}</span></div>}
        {data&&<div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
              <h2 style={{fontFamily:'var(--ff)',fontSize:26,fontWeight:500}}>{suburb}</h2>
              <span style={{padding:'3px 10px',borderRadius:4,fontSize:10,letterSpacing:'.1em',textTransform:'uppercase',background:vc,color:'var(--bg)',fontWeight:700}}>{data.verdict}</span>
            </div>
            <p style={{fontSize:12,fontStyle:'italic',color:'var(--muted)',marginBottom:5}}>"{data.verdictReason}"</p>
            <p style={{fontSize:13,lineHeight:1.6}}>{data.summary}</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
            {[['Median price',data.metrics.medianPrice?fmt(data.metrics.medianPrice):'n/a'],['Weekly rent',data.metrics.medianWeeklyRent?fmt(data.metrics.medianWeeklyRent):'n/a'],['Gross yield',data.metrics.grossYield?pct(data.metrics.grossYield):'n/a'],['Vacancy',data.metrics.vacancyRate?pct(data.metrics.vacancyRate,1):'n/a'],['5yr growth',data.metrics.fiveYearGrowth?pct(data.metrics.fiveYearGrowth,1):'n/a'],['Rent growth',data.metrics.rentGrowthYoY?pct(data.metrics.rentGrowthYoY,1):'n/a']].map(([l,v])=>(
              <div key={l} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,padding:'7px 10px'}}>
                <div style={{fontSize:10,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--muted)',marginBottom:4}}>{l}</div>
                <div className="mono" style={{fontSize:15}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderLeft:'3px solid var(--pos)',borderRadius:6,padding:10}}>
              <div style={{fontSize:10,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--pos)',marginBottom:8,display:'flex',alignItems:'center',gap:4}}><TrendingUp size={10}/>Strengths</div>
              {data.strengths.map((s,i)=><div key={i} style={{fontSize:12,lineHeight:1.5,display:'flex',gap:6,marginBottom:4}}><span style={{color:'var(--pos)'}}>+</span>{s}</div>)}
            </div>
            <div style={{background:'var(--surface)',border:'1px solid var(--border)',borderLeft:'3px solid var(--neg)',borderRadius:6,padding:10}}>
              <div style={{fontSize:10,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--neg)',marginBottom:8,display:'flex',alignItems:'center',gap:4}}><TrendingDown size={10}/>Risks</div>
              {data.risks.map((s,i)=><div key={i} style={{fontSize:12,lineHeight:1.5,display:'flex',gap:6,marginBottom:4}}><span style={{color:'var(--neg)'}}>−</span>{s}</div>)}
            </div>
          </div>
          {data.comparableSuburbs?.length>0&&<div style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:6,padding:10}}>
            <div style={{fontSize:10,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--muted)',marginBottom:6}}>Comparable / alternative suburbs</div>
            {data.comparableSuburbs.map((c,i)=><div key={i} style={{display:'flex',gap:10,marginBottom:8,fontSize:12}}><span style={{fontFamily:'var(--ff)',fontSize:14,color:'var(--acc)',minWidth:110}}>{c.name}</span><span style={{color:'var(--muted)',lineHeight:1.5}}>{c.reason}</span></div>)}
          </div>}
        </div>}
      </div>
    </div>
  );
}

function CompareView({saved,remove,cur}){
  const all=[{id:'current',name:'Current',inputs:cur.inputs,calc:cur.calc,isCur:true},...saved];
  if(!saved.length)return<div className="empty" style={{minHeight:300}}><Layers size={32} style={{color:'var(--muted)',marginBottom:6}}/><h3 style={{fontFamily:'var(--ff)',fontSize:20,marginBottom:5}}>No saved scenarios</h3><p style={{fontSize:13,color:'var(--muted)',maxWidth:340}}>Save scenarios from the Calculator tab to compare them side-by-side.</p></div>;
  const mets=[{k:'grossYield',l:'Gross yield',f:v=>pct(v),hi:true},{k:'netYield',l:'Net yield',f:v=>pct(v),hi:true},{k:'cashflowAfterTaxWeekly',l:'Weekly cashflow',f:v=>fmt(v),hi:true},{k:'cashOnCash',l:'Cash-on-cash',f:v=>pct(v),hi:true},{k:'totalCashRequired',l:'Cash to close',f:v=>fmt(v),hi:false},{k:'lvr',l:'LVR',f:v=>pct(v,1),hi:false}];
  const best=(k,hi)=>{let bi=0,bv=all[0].calc[k];for(let i=1;i<all.length;i++){if(hi?all[i].calc[k]>bv:all[i].calc[k]<bv){bi=i;bv=all[i].calc[k];}}return bi;};
  return(
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead><tr>
          <th style={{textAlign:'left',padding:'8px 12px',fontSize:10,letterSpacing:'.07em',textTransform:'uppercase',color:'var(--muted)',fontWeight:400,borderBottom:'1px solid var(--border)'}}>Metric</th>
          {all.map(s=><th key={s.id} style={{textAlign:'left',padding:'8px 12px',minWidth:160,borderBottom:'1px solid var(--border)'}}>
            <div style={{fontFamily:'var(--ff)',fontSize:15,fontWeight:500}}>{s.name}</div>
            <div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>{s.inputs.suburb}, {s.inputs.state} · {fmt(s.inputs.purchasePrice)}</div>
            {!s.isCur&&<button onClick={()=>remove(s.id)} style={{marginTop:4,fontSize:10,color:'var(--muted)',background:'none',border:'none',padding:0,cursor:'pointer',display:'flex',alignItems:'center',gap:3}}><Trash2 size={9}/>Remove</button>}
          </th>)}
        </tr></thead>
        <tbody>
          {mets.map(m=>{const bi=best(m.k,m.hi);return(<tr key={m.k} style={{borderTop:'1px solid var(--border)'}}>
            <td style={{padding:'7px 10px',fontSize:11,color:'var(--muted)',letterSpacing:'.05em',textTransform:'uppercase'}}>{m.l}</td>
            {all.map((s,i)=><td key={s.id} className="mono" style={{padding:'7px 10px',color:i===bi?'var(--pos)':'var(--text)'}}>{m.f(s.calc[m.k])}{i===bi&&<span style={{fontSize:10,marginLeft:4}}>★</span>}</td>)}
          </tr>);})}
          {[{l:'Value Yr 10',f:s=>fmt(s.calc.projection[9].propValue)},{l:'Equity Yr 10',f:s=>fmt(s.calc.projection[9].equity)},{l:'Break-even',f:s=>s.calc.breakEvenYear?`Year ${s.calc.breakEvenYear}`:'> 10 yrs'}].map(r=>(
            <tr key={r.l} style={{borderTop:'1px solid var(--border)'}}>
              <td style={{padding:'7px 10px',fontSize:11,color:'var(--muted)',letterSpacing:'.05em',textTransform:'uppercase'}}>{r.l}</td>
              {all.map(s=><td key={s.id} className="mono" style={{padding:'7px 10px'}}>{r.f(s)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Primitives ──────────────────────────────────────────────
function Card({title,n,children}){return<div className="card"><div className="card-hdr"><h2 className="card-ttl">{title}</h2><span style={{fontFamily:'monospace',fontSize:10,color:'var(--muted)'}}>—{n}</span></div><div style={{display:'flex',flexDirection:'column',gap:8}}>{children}</div></div>;}
function F({l,pre,suf,children}){return<div><div className="flbl">{l}</div><div style={{display:'flex',alignItems:'center',gap:6}}>{pre&&<span style={{fontSize:12,color:'var(--muted)'}}>{pre}</span>}<div style={{flex:1}}>{children}</div>{suf&&<span style={{fontSize:12,color:'var(--muted)',whiteSpace:'nowrap'}}>{suf}</span>}</div></div>;}
function Grid2({children}){return<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>{children}</div>;}
function Num({value,onChange,step=1}){return<input type="number" value={value} step={step} onChange={e=>onChange(e.target.value===''?0:Number(e.target.value))} className="inp mono"/>;}
function Sel({value,onChange,opts}){return<select value={value} onChange={e=>onChange(e.target.value)} className="inp">{opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>;}
function Tog({opts,val,set}){return<div style={{display:'flex',gap:1,background:'var(--bg)',border:'1px solid var(--border)',borderRadius:5,padding:2}}>{opts.map(([v,l])=><button key={String(v)} onClick={()=>set(v)} style={{flex:1,padding:'6px 8px',fontSize:11,borderRadius:4,border:'none',cursor:'pointer',background:String(val)===String(v)?'var(--acc)':'transparent',color:String(val)===String(v)?'var(--bg)':'var(--muted)',transition:'all .15s',fontFamily:'var(--font)',whiteSpace:'nowrap'}}>{l}</button>)}</div>;}
function Stat({l,v,s,tone}){const c={pos:'var(--pos)',neg:'var(--neg)',neu:'var(--text)'}[tone];return<div className="stat"><div className="stat-l">{l}</div><div className="stat-v mono" style={{color:c}}>{v}</div><div className="stat-s">{s}</div></div>;}
function Acc({title,open:defOpen,children}){const[o,setO]=useState(!!defOpen);return<div className="acc"><button className="acc-hdr" onClick={()=>setO(x=>!x)}><span className="acc-ttl">{title}</span>{o?<ChevronDown size={14} style={{color:'var(--muted)'}}/>:<ChevronRight size={14} style={{color:'var(--muted)'}}/>}</button>{o&&<div style={{padding:'4px 16px 16px'}}>{children}</div>}</div>;}
function TR({l,v,sub,bold,accent,pos,muted}){const c=accent?'var(--acc)':pos?'var(--pos)':muted?'var(--muted)':'var(--text)';return<tr style={{borderTop:'1px solid var(--border)'}}><td style={{padding:'5px 4px',fontWeight:bold?600:400,color:pos?'var(--pos)':muted?'var(--muted)':'var(--text)'}}>{l}{sub&&<div style={{fontSize:10,color:'var(--muted)',marginTop:2}}>{sub}</div>}</td><td className="mono" style={{padding:'5px 4px',textAlign:'right',color:c,fontWeight:bold?600:400,whiteSpace:'nowrap'}}>{v}</td></tr>;}

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#0d0c0a; --surface:#161310; --surface2:#1e1a15;
  --border:#252018; --border2:#302820;
  --text:#f0e8d8; --muted:#7a7168;
  --acc:#d4783a; --acc-soft:rgba(212,120,58,.12);
  --pos:#7ea86a; --neg:#c25050;
  --font:'Inter',system-ui,sans-serif; --ff:'Fraunces',Georgia,serif;
}
body,html{background:var(--bg);color:var(--text);font-family:var(--font);-webkit-font-smoothing:antialiased;}
.mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;letter-spacing:-.02em;}
input[type=number]{-moz-appearance:textfield;}
input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;}
button{font-family:var(--font);cursor:pointer;}
::selection{background:var(--acc);color:var(--bg);}

.wrap{max-width:1360px;margin:0 auto;padding:0 28px;}
@media(max-width:600px){.wrap{padding:0 16px;}}

/* Header */
.hdr{border-bottom:1px solid var(--border);background:rgba(13,12,10,.92);position:sticky;top:0;z-index:100;backdrop-filter:blur(12px);}
.hdr-top{padding:14px 0 10px;}
.eyebrow{font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--acc);margin-bottom:6px;display:flex;align-items:center;gap:8px;}
.eyebrow::before,.eyebrow::after{content:'';display:inline-block;width:18px;height:1px;background:var(--acc);}
.hero{font-family:var(--ff);font-size:clamp(22px,3vw,32px);line-height:1;letter-spacing:-.025em;font-weight:500;margin-bottom:6px;}
.hero em{font-style:italic;color:var(--acc);}
.hero-sub{font-size:12px;color:var(--muted);line-height:1.6;}
.tabs{display:flex;gap:2px;border-top:1px solid var(--border2);margin-top:2px;}
.tab{display:flex;align-items:center;gap:6px;padding:8px 14px;font-size:12px;border:none;border-bottom:2px solid transparent;background:none;color:var(--muted);cursor:pointer;transition:all .15s;letter-spacing:.02em;}
.tab:hover{color:var(--text);}
.tab-on{color:var(--text);border-bottom-color:var(--acc);}
.tab-pip{font-size:9px;padding:2px 6px;border-radius:10px;background:var(--acc);color:var(--bg);font-weight:700;}
.ftr{border-top:1px solid var(--border);padding:20px 0;font-size:11px;color:var(--muted);line-height:1.6;}

/* Layout */
.two-col{display:grid;grid-template-columns:370px 1fr;gap:20px;align-items:start;}
@media(max-width:880px){.two-col{grid-template-columns:1fr;}}
.col-inputs{display:flex;flex-direction:column;gap:7px;position:sticky;top:82px;max-height:calc(100vh - 100px);overflow-y:auto;padding-right:2px;scrollbar-width:thin;scrollbar-color:var(--border) transparent;}
.col-inputs::-webkit-scrollbar{width:3px;}
.col-inputs::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px;}
.col-outputs{display:flex;flex-direction:column;gap:7px;}

/* Cards */
.card{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:12px;}
.card-hdr{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border);}
.card-ttl{font-family:var(--ff);font-size:14px;font-weight:500;letter-spacing:-.015em;}
.flbl{font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin-bottom:3px;}
.inp{width:100%;background:var(--surface2);border:1px solid var(--border2);color:var(--text);padding:5px 8px;font-size:12px;border-radius:5px;outline:none;transition:border-color .15s;font-family:var(--font);}
.inp:focus{border-color:var(--acc);}
select.inp{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='%237a7168' d='M2 4l4 4 4-4z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 8px center;background-size:10px;padding-right:24px;}
.lvr-box{height:27px;display:flex;align-items:center;font-family:'JetBrains Mono',monospace;font-size:14px;font-weight:500;padding:0 8px;background:var(--surface2);border:1px solid var(--border2);border-radius:5px;}
.info-box{font-size:11px;padding:7px 10px;border-radius:5px;background:var(--acc-soft);border:1px solid rgba(212,120,58,.25);color:var(--acc);line-height:1.5;}
.save-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px;font-size:12px;letter-spacing:.04em;border-radius:6px;border:1px solid var(--acc);background:var(--acc-soft);color:var(--acc);transition:all .15s;}
.save-btn:hover{background:var(--acc);color:var(--bg);}

/* Stats */
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;}
@media(max-width:700px){.stats-row{grid-template-columns:1fr 1fr;}}
.stat{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:10px 12px;}
.stat-l{font-size:9px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);margin-bottom:3px;}
.stat-v{font-size:20px;line-height:1;margin-bottom:3px;}
.stat-s{font-size:11px;color:var(--muted);}

/* Callout */
.callout{background:var(--surface);border:1px solid var(--border);border-left:3px solid;border-radius:6px;padding:12px;}
.savings-pill{margin-top:10px;padding:7px 10px;border-radius:4px;background:rgba(126,168,106,.1);border:1px solid rgba(126,168,106,.2);font-size:11px;color:var(--pos);}

/* Table */
.tbl{width:100%;border-collapse:collapse;font-size:12px;}
.tbl-section{padding:10px 4px 4px;font-size:10px;letter-spacing:.07em;text-transform:uppercase;color:var(--muted);}

/* Accordion */
.acc{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;}
.acc-hdr{width:100%;display:flex;justify-content:space-between;align-items:center;padding:9px 12px;background:none;border:none;cursor:pointer;transition:background .15s;}
.acc-hdr:hover{background:var(--surface2);}
.acc-ttl{font-family:var(--ff);font-size:13px;font-weight:500;letter-spacing:-.01em;}

/* Buttons */
.btn-accent{background:var(--acc);color:var(--bg);font-weight:500;padding:9px 18px;border-radius:5px;border:none;font-size:13px;cursor:pointer;transition:opacity .15s;}
.btn-accent:hover{opacity:.85;}
.btn-accent:disabled{opacity:.4;cursor:not-allowed;}
.btn-ghost{background:transparent;color:var(--muted);padding:9px 18px;border-radius:5px;border:none;font-size:13px;cursor:pointer;}
.btn-ghost:hover{color:var(--text);}

/* Modal */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:16px;z-index:200;}
.dialog{background:var(--surface);border:1px solid var(--border2);border-radius:10px;padding:24px;width:100%;max-width:400px;}

/* Empty */
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 24px;background:var(--surface);border:1px dashed var(--border2);border-radius:8px;}

@keyframes spin{to{transform:rotate(360deg);}}
`;
