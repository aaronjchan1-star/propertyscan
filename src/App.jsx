import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calculator, MapPin, Layers, Loader2, TrendingUp, TrendingDown, Wallet, Home, Sparkles, X, Plus, AlertCircle, ChevronDown, ChevronRight, ExternalLink, Save, Trash2 } from 'lucide-react';

/* ============================================================================
   STAMP DUTY CALCULATIONS - 2025/26 indexed rates
   Investor = no FHB concessions. FHB PPOR = exemptions/concessions applied.
   Estimates only – verify with your conveyancer / state revenue office.
   ============================================================================ */

const stampDutyCalc = {
  NSW: (price) => {
    if (price <= 16000) return Math.max(20, price * 0.0125);
    if (price <= 35000) return 200 + (price - 16000) * 0.015;
    if (price <= 93000) return 485 + (price - 35000) * 0.0175;
    if (price <= 351000) return 1500 + (price - 93000) * 0.035;
    if (price <= 1168000) return 10530 + (price - 351000) * 0.045;
    if (price <= 3505000) return 47295 + (price - 1168000) * 0.055;
    return 175830 + (price - 3505000) * 0.07;
  },
  VIC: (price) => {
    if (price <= 25000) return price * 0.014;
    if (price <= 130000) return 350 + (price - 25000) * 0.024;
    if (price <= 960000) return 2870 + (price - 130000) * 0.06;
    if (price <= 2000000) return price * 0.055;
    return 110000 + (price - 2000000) * 0.065;
  },
  QLD: (price) => {
    // Investor rates (no home concession)
    if (price <= 5000) return 0;
    if (price <= 75000) return (price - 5000) * 0.015;
    if (price <= 540000) return 1050 + (price - 75000) * 0.035;
    if (price <= 1000000) return 17325 + (price - 540000) * 0.045;
    return 38025 + (price - 1000000) * 0.0575;
  },
  WA: (price) => {
    if (price <= 120000) return price * 0.019;
    if (price <= 150000) return 2280 + (price - 120000) * 0.0285;
    if (price <= 360000) return 3135 + (price - 150000) * 0.038;
    if (price <= 725000) return 11115 + (price - 360000) * 0.0475;
    return 28453 + (price - 725000) * 0.0515;
  },
  SA: (price) => {
    if (price <= 12000) return price * 0.01;
    if (price <= 30000) return 120 + (price - 12000) * 0.02;
    if (price <= 50000) return 480 + (price - 30000) * 0.03;
    if (price <= 100000) return 1080 + (price - 50000) * 0.035;
    if (price <= 200000) return 2830 + (price - 100000) * 0.04;
    if (price <= 250000) return 6830 + (price - 200000) * 0.0425;
    if (price <= 300000) return 8955 + (price - 250000) * 0.0475;
    if (price <= 500000) return 11330 + (price - 300000) * 0.05;
    return 21330 + (price - 500000) * 0.055;
  },
  TAS: (price) => {
    if (price <= 3000) return 50;
    if (price <= 25000) return 50 + (price - 3000) * 0.0175;
    if (price <= 75000) return 435 + (price - 25000) * 0.0225;
    if (price <= 200000) return 1560 + (price - 75000) * 0.035;
    if (price <= 375000) return 5935 + (price - 200000) * 0.04;
    if (price <= 725000) return 12935 + (price - 375000) * 0.0425;
    return 27810 + (price - 725000) * 0.045;
  },
  ACT: (price) => {
    // ACT investor (commercial-style)
    if (price <= 260000) return price * 0.0049;
    if (price <= 300000) return 1274 + (price - 260000) * 0.022;
    if (price <= 500000) return 2154 + (price - 300000) * 0.034;
    if (price <= 750000) return 8954 + (price - 500000) * 0.05;
    if (price <= 1000000) return 21454 + (price - 750000) * 0.067;
    if (price <= 1455000) return 38204 + (price - 1000000) * 0.07;
    return price * 0.0454;
  },
  NT: (price) => {
    if (price <= 525000) return (0.06571441 * (price/1000)**2 + 15 * (price/1000));
    if (price <= 3000000) return price * 0.0495;
    if (price <= 5000000) return price * 0.0575;
    return price * 0.0595;
  },
};

/* ============================================================================
   FHB STAMP DUTY — PPOR exemptions / concessions per state (2025/26)
   Only applies when buyerType = 'fhb' AND fhbPurpose = 'ppor'
   ============================================================================ */

// Returns the duty payable as an FHB (PPOR). 0 = full exemption.
const fhbStampDuty = {
  NSW: (price) => {
    // Exempt ≤ $800k; sliding concession $800k–$1M; full duty over $1M
    if (price <= 800000) return 0;
    if (price <= 1000000) {
      const full = stampDutyCalc.NSW(price);
      const fraction = (price - 800000) / 200000; // 0 → 1
      return full * fraction;
    }
    return stampDutyCalc.NSW(price);
  },
  VIC: (price) => {
    // Exempt ≤ $600k; sliding concession $600k–$750k; full duty over $750k
    if (price <= 600000) return 0;
    if (price <= 750000) {
      const full = stampDutyCalc.VIC(price);
      const fraction = (price - 600000) / 150000;
      return full * fraction;
    }
    return stampDutyCalc.VIC(price);
  },
  QLD: (price) => {
    // No duty ≤ $700k (established); concession $700k–$800k; full over $800k
    if (price <= 700000) return 0;
    if (price <= 800000) {
      const full = stampDutyCalc.QLD(price);
      const fraction = (price - 700000) / 100000;
      return full * fraction;
    }
    return stampDutyCalc.QLD(price);
  },
  WA: (price) => {
    // Exempt ≤ $430k (established home threshold 2025); concession $430k–$530k
    if (price <= 430000) return 0;
    if (price <= 530000) {
      const full = stampDutyCalc.WA(price);
      const fraction = (price - 430000) / 100000;
      return full * fraction;
    }
    return stampDutyCalc.WA(price);
  },
  SA: (price) => stampDutyCalc.SA(price), // SA has no FHB duty exemption
  TAS: (price) => {
    // 50% concession on established homes ≤ $750k (until June 2026)
    if (price <= 750000) return stampDutyCalc.TAS(price) * 0.5;
    return stampDutyCalc.TAS(price);
  },
  ACT: (price) => {
    // ACT: FHB exemption for eligible buyers (income tested). Units up to ~$1.02M.
    // Simplified: 0 duty for purchases up to $750k for FHBs
    if (price <= 750000) return 0;
    return stampDutyCalc.ACT(price);
  },
  NT: (price) => {
    // NT: 50% duty reduction on new homes for FHBs
    return stampDutyCalc.NT(price) * 0.5;
  },
};

/* ============================================================================
   FIRST HOME OWNER GRANT (FHOG) — cash grants per state 2025/26
   Only payable on NEW BUILDS (isNewBuild = true) and when buyerType = 'fhb'
   ============================================================================ */
const fhogByState = {
  NSW: { amount: 10000, cap: 600000, label: '$10,000 FHOG (new homes ≤ $600k)' },
  VIC: { amount: 10000, cap: 750000, label: '$10,000 FHOG (new homes ≤ $750k)' },
  QLD: { amount: 30000, cap: null, label: '$30,000 FHOG (new homes)' },
  WA:  { amount: 10000, cap: 750000, label: '$10,000 FHOG (new homes ≤ $750k)' },
  SA:  { amount: 15000, cap: null, label: '$15,000 FHOG (new homes)' },
  TAS: { amount: 30000, cap: null, label: '$30,000 FHOG (new homes, until Jun 2026)' },
  ACT: { amount: 0, cap: null, label: 'No FHOG in ACT (other schemes apply)' },
  NT:  { amount: 50000, cap: null, label: '$50,000 FHOG (new/substantially renovated)' },
};

const getFhog = (state, price, isNewBuild, buyerType) => {
  if (buyerType !== 'fhb' || !isNewBuild) return 0;
  const grant = fhogByState[state];
  if (!grant || grant.amount === 0) return 0;
  if (grant.cap && price > grant.cap) return 0;
  return grant.amount;
};

const states = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Aust Capital Territory' },
  { code: 'NT', name: 'Northern Territory' },
];

/* LMI is roughly: paid when LVR > 80%. Approximate based on LVR & loan size. */
const calculateLMI = (loanAmount, propertyValue) => {
  const lvr = (loanAmount / propertyValue) * 100;
  if (lvr <= 80) return 0;
  // Simplified bracket approximation
  let rate = 0;
  if (lvr <= 81) rate = 0.0048;
  else if (lvr <= 85) rate = 0.0095;
  else if (lvr <= 90) rate = 0.0190;
  else if (lvr <= 95) rate = 0.0350;
  else rate = 0.0480;
  return loanAmount * rate;
};

/* Australian marginal tax rates 2025-26 incl. 2% Medicare levy */
const calculateTax = (taxableIncome) => {
  let tax = 0;
  if (taxableIncome <= 18200) tax = 0;
  else if (taxableIncome <= 45000) tax = (taxableIncome - 18200) * 0.16;
  else if (taxableIncome <= 135000) tax = 4288 + (taxableIncome - 45000) * 0.30;
  else if (taxableIncome <= 190000) tax = 31288 + (taxableIncome - 135000) * 0.37;
  else tax = 51638 + (taxableIncome - 190000) * 0.45;
  if (taxableIncome > 27222) tax += taxableIncome * 0.02; // Medicare levy
  return tax;
};

const getMarginalRate = (income) => {
  if (income <= 18200) return 0;
  if (income <= 45000) return 0.18; // 16% + 2% Medicare
  if (income <= 135000) return 0.32;
  if (income <= 190000) return 0.39;
  return 0.47;
};

/* P&I monthly repayment formula */
const calcMonthlyRepayment = (principal, annualRate, years, type) => {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (type === 'IO') return principal * r;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
};

const formatAUD = (n, decimals = 0) => {
  if (isNaN(n) || !isFinite(n)) return '$0';
  return new Intl.NumberFormat('en-AU', {
    style: 'currency', currency: 'AUD',
    minimumFractionDigits: decimals, maximumFractionDigits: decimals,
  }).format(n);
};

const formatPct = (n, decimals = 2) => {
  if (isNaN(n) || !isFinite(n)) return '0%';
  return `${n.toFixed(decimals)}%`;
};

/* ============================================================================
   DEFAULT INPUTS — tuned for Aaron's Lidcombe/Silverwater scenario
   ============================================================================ */
const defaultInputs = {
  suburb: 'Lidcombe',
  state: 'NSW',
  propertyType: 'Unit',
  bedrooms: 2,
  bathrooms: 1,
  parking: 1,
  buyerType: 'investor',   // 'investor' | 'fhb'
  fhbPurpose: 'ppor',      // 'ppor' | 'investment' (FHB only)
  isNewBuild: false,
  useGuarantor: false,
  purchasePrice: 720000,
  weeklyRent: 620,
  // Loan
  deposit: 144000,
  interestRate: 6.15,
  loanTermYears: 30,
  loanType: 'PI',
  // Annual costs
  councilRates: 1600,
  waterRates: 900,
  strataFees: 4800,
  insurance: 600,
  pmFeesPct: 6.5,
  vacancyWeeks: 2,
  maintenancePct: 1.0,
  landTax: 0,
  // Upfront
  legalFees: 1800,
  buildingInspection: 600,
  // Tax & growth
  taxableIncome: 160000,
  capitalGrowthPct: 4.5,
  rentGrowthPct: 3.0,
  // Depreciation (estimated annual, used only for tax purposes)
  depreciation: 4000,
};

/* ============================================================================
   MAIN COMPONENT
   ============================================================================ */
export default function PropertyScanner() {
  const [tab, setTab] = useState('calc');
  const [inputs, setInputs] = useState(defaultInputs);
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [scenarioName, setScenarioName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  /* Load saved scenarios from session memory only (artifacts can't use localStorage) */

  const update = (key, value) => setInputs((prev) => ({ ...prev, [key]: value }));

  /* ----- ALL THE MATH ----- */
  const calc = useMemo(() => {
    const p = Number(inputs.purchasePrice) || 0;
    const dep = Number(inputs.deposit) || 0;
    const isFhbPpor = inputs.buyerType === 'fhb' && inputs.fhbPurpose === 'ppor';

    // Guarantor: zero out the deposit requirement for loan purposes (no LMI, borrow 100%)
    const effectiveDeposit = inputs.useGuarantor ? 0 : dep;
    const loanAmount = Math.max(0, p - effectiveDeposit);
    const lvr = p > 0 ? (loanAmount / p) * 100 : 0;

    // Stamp duty: FHB PPOR gets exemption/concession; investor & FHB investment = full rate
    const fullDuty = stampDutyCalc[inputs.state] ? stampDutyCalc[inputs.state](p) : 0;
    const fhbDuty = isFhbPpor && fhbStampDuty[inputs.state] ? fhbStampDuty[inputs.state](p) : fullDuty;
    const stampDuty = isFhbPpor ? fhbDuty : fullDuty;
    const stampDutySaving = fullDuty - stampDuty;

    // LMI: waived entirely with a guarantor (guarantor's equity acts as extra security)
    const lmi = inputs.useGuarantor ? 0 : calculateLMI(loanAmount, p);
    const lmiSaving = inputs.useGuarantor ? calculateLMI(loanAmount, p) : 0;

    // FHOG cash grant
    const fhogGrant = getFhog(inputs.state, p, inputs.isNewBuild, inputs.buyerType);

    const transferFee = 170;
    const mortgageReg = 165;
    const rawUpfrontCosts = stampDuty + lmi + transferFee + mortgageReg + Number(inputs.legalFees) + Number(inputs.buildingInspection);
    // FHOG reduces the cash you need to bring to the table
    const upfrontCosts = rawUpfrontCosts;
    const totalCashRequired = dep + upfrontCosts - fhogGrant;
    const totalCashWithoutConcessions = dep + fullDuty + calculateLMI(Math.max(0, p - dep), p) + transferFee + mortgageReg + Number(inputs.legalFees) + Number(inputs.buildingInspection);
    const totalSavings = stampDutySaving + lmiSaving + fhogGrant;

    // Annual figures
    const grossRent = (Number(inputs.weeklyRent) || 0) * 52;
    const vacancyLoss = (Number(inputs.weeklyRent) || 0) * (Number(inputs.vacancyWeeks) || 0);
    const effectiveRent = grossRent - vacancyLoss;
    const pmFees = effectiveRent * (Number(inputs.pmFeesPct) || 0) / 100;
    const maintenance = p * (Number(inputs.maintenancePct) || 0) / 100;
    const totalOpEx =
      Number(inputs.councilRates) +
      Number(inputs.waterRates) +
      Number(inputs.strataFees) +
      Number(inputs.insurance) +
      Number(inputs.landTax) +
      pmFees + maintenance;

    const monthlyRepay = calcMonthlyRepayment(loanAmount, Number(inputs.interestRate), Number(inputs.loanTermYears), inputs.loanType);
    const annualRepay = monthlyRepay * 12;
    const annualInterest = inputs.loanType === 'IO'
      ? loanAmount * Number(inputs.interestRate) / 100
      : estimateFirstYearInterest(loanAmount, Number(inputs.interestRate), Number(inputs.loanTermYears));

    // Cashflow before tax
    const cashflowBeforeTax = effectiveRent - totalOpEx - annualRepay;
    const cashflowWeekly = cashflowBeforeTax / 52;

    // Yields
    const grossYield = p > 0 ? (grossRent / p) * 100 : 0;
    const netYield = p > 0 ? ((effectiveRent - totalOpEx) / p) * 100 : 0;

    // Tax position (negative gearing benefit)
    // Loss for tax = rent - opex - interest - depreciation
    const taxableLossOrGain = effectiveRent - totalOpEx - annualInterest - Number(inputs.depreciation);
    const marginalRate = getMarginalRate(Number(inputs.taxableIncome));
    const taxBenefit = taxableLossOrGain < 0 ? -taxableLossOrGain * marginalRate : -taxableLossOrGain * marginalRate;
    // (positive number means tax saving; negative means extra tax owed)
    const cashflowAfterTax = cashflowBeforeTax + taxBenefit;
    const cashflowAfterTaxWeekly = cashflowAfterTax / 52;

    // Cash on cash
    const cashOnCash = totalCashRequired > 0 ? (cashflowAfterTax / totalCashRequired) * 100 : 0;

    // 10-year projection
    const projection = [];
    let propValue = p;
    let rent = grossRent;
    let cumCashflow = 0;
    let cumEquity = dep;
    for (let year = 1; year <= 10; year++) {
      propValue *= (1 + Number(inputs.capitalGrowthPct) / 100);
      rent *= (1 + Number(inputs.rentGrowthPct) / 100);
      const yearVacancy = rent / 52 * Number(inputs.vacancyWeeks);
      const yearEffectiveRent = rent - yearVacancy;
      const yearPmFees = yearEffectiveRent * Number(inputs.pmFeesPct) / 100;
      const yearMaintenance = propValue * Number(inputs.maintenancePct) / 100;
      const yearOpEx = (Number(inputs.councilRates) + Number(inputs.waterRates) + Number(inputs.strataFees) + Number(inputs.insurance) + Number(inputs.landTax)) * Math.pow(1.025, year - 1) + yearPmFees + yearMaintenance;
      const yearCF = yearEffectiveRent - yearOpEx - annualRepay;
      cumCashflow += yearCF;
      const equityFromGrowth = propValue - p;
      cumEquity = dep + equityFromGrowth;
      projection.push({
        year, propValue, rent, cashflow: yearCF,
        cumCashflow, equity: cumEquity, totalReturn: cumCashflow + equityFromGrowth,
      });
    }

    // Break-even: years to recover total cash invested via cashflow + equity growth
    let breakEvenYear = null;
    for (let i = 0; i < projection.length; i++) {
      if (projection[i].totalReturn >= upfrontCosts) {
        breakEvenYear = projection[i].year;
        break;
      }
    }

    return {
      loanAmount, lvr, stampDuty, fullDuty, stampDutySaving, lmi, lmiSaving,
      fhogGrant, transferFee, mortgageReg,
      upfrontCosts, totalCashRequired, totalSavings,
      grossRent, vacancyLoss, effectiveRent, pmFees, maintenance, totalOpEx,
      monthlyRepay, annualRepay, annualInterest,
      cashflowBeforeTax, cashflowWeekly, cashflowAfterTax, cashflowAfterTaxWeekly,
      grossYield, netYield, cashOnCash,
      taxableLossOrGain, marginalRate, taxBenefit,
      projection, breakEvenYear,
    };
  }, [inputs]);

  const saveScenario = () => {
    if (!scenarioName.trim()) return;
    setSavedScenarios((prev) => [...prev, {
      id: Date.now(),
      name: scenarioName.trim(),
      inputs: { ...inputs },
      calc: { ...calc },
    }]);
    setScenarioName('');
    setShowSaveDialog(false);
  };

  const removeScenario = (id) => setSavedScenarios((prev) => prev.filter(s => s.id !== id));

  return (
    <div className="min-h-screen w-full" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <style>{styles}</style>

      {/* HEADER */}
      <header className="border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-container px-6 lg:px-10 py-6 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-11 tracking-18 uppercase mb-2" style={{ color: 'var(--accent)' }}>
              <span className="inline-block w-6 h-px" style={{ background: 'var(--accent)' }} />
              Property Investment Scanner
              <span className="inline-block w-6 h-px" style={{ background: 'var(--accent)' }} />
            </div>
            <h1 className="font-display text-4xl lg:text-5xl leading-95 tracking-tight">
              Scan, model, and stress-test
              <br />
              <em style={{ color: 'var(--accent)' }} className="font-display">Australian property.</em>
            </h1>
            <p className="text-sm mt-3 max-w-xl" style={{ color: 'var(--text-muted)' }}>
              State-specific stamp duty, full upfront cost modelling, weekly cashflow, negative gearing benefit, and a 10-year projection. Plus AI-powered suburb research.
            </p>
          </div>
          <div className="text-right text-11 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
            <div>FY 2025/26</div>
            <div>Indexed Rates</div>
          </div>
        </div>

        {/* TABS */}
        <div className="max-w-container px-6 lg:px-10 flex gap-1">
          {[
            { id: 'calc', label: 'Calculator', icon: Calculator },
            { id: 'suburb', label: 'Suburb Insights', icon: MapPin },
            { id: 'compare', label: 'Compare', icon: Layers, badge: savedScenarios.length },
          ].map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="px-4 py-3 text-sm flex items-center gap-2 border-b-2 transition-all"
                style={{
                  borderColor: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                }}
              >
                <Icon size={14} />
                <span className="tracking-wide">{t.label}</span>
                {t.badge ? (
                  <span className="ml-1 text-10 px-1.5 py-0.5 rounded-full" style={{ background: 'var(--accent)', color: 'var(--bg)' }}>
                    {t.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </header>

      {/* CONTENT */}
      <main className="max-w-container px-6 lg:px-10 py-8">
        {tab === 'calc' && (
          <CalculatorView
            inputs={inputs}
            update={update}
            calc={calc}
            onSave={() => setShowSaveDialog(true)}
          />
        )}
        {tab === 'suburb' && <SuburbInsights initialSuburb={inputs.suburb} />}
        {tab === 'compare' && (
          <CompareView
            scenarios={savedScenarios}
            removeScenario={removeScenario}
            currentInputs={inputs}
            currentCalc={calc}
            currentName="Current scenario"
          />
        )}
      </main>

      {/* SAVE DIALOG */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowSaveDialog(false)}>
          <div className="rounded-lg p-6 w-full max-w-md" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-2xl mb-2">Save scenario</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Save this analysis to compare against others.</p>
            <input
              autoFocus
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveScenario()}
              placeholder="e.g. Lidcombe 2BR Unit"
              className="w-full px-3 py-2 text-sm rounded mb-4"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSaveDialog(false)} className="px-4 py-2 text-sm rounded" style={{ color: 'var(--text-muted)' }}>Cancel</button>
              <button onClick={saveScenario} className="px-4 py-2 text-sm rounded" style={{ background: 'var(--accent)', color: 'var(--bg)' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t mt-16 py-8" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-container px-6 lg:px-10 text-11 tracking-wide" style={{ color: 'var(--text-muted)' }}>
          <p>Estimates only. Stamp duty, LMI, and tax figures are calculated from current published rates but should be verified with your conveyancer, broker, and accountant. Capital growth is a projection, not a forecast.</p>
        </div>
      </footer>
    </div>
  );
}

/* Estimate of first-year interest portion of P&I repayments */
function estimateFirstYearInterest(principal, annualRate, years) {
  const monthly = calcMonthlyRepayment(principal, annualRate, years, 'PI');
  const r = annualRate / 100 / 12;
  let bal = principal;
  let interest = 0;
  for (let i = 0; i < 12; i++) {
    const intPart = bal * r;
    interest += intPart;
    bal -= (monthly - intPart);
  }
  return interest;
}

/* ============================================================================
   CALCULATOR VIEW
   ============================================================================ */
function CalculatorView({ inputs, update, calc, onSave }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* INPUT PANEL */}
      <div className="lg:col-span-5 space-y-6">
        <Section title="Property" number="01">
          <Field label="Suburb">
            <input value={inputs.suburb} onChange={(e) => update('suburb', e.target.value)} className="form-input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="State">
              <select value={inputs.state} onChange={(e) => update('state', e.target.value)} className="form-input">
                {states.map((s) => <option key={s.code} value={s.code}>{s.code}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select value={inputs.propertyType} onChange={(e) => update('propertyType', e.target.value)} className="form-input">
                <option>House</option><option>Unit</option><option>Townhouse</option><option>Land</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Beds">
              <select value={inputs.bedrooms} onChange={(e) => update('bedrooms', Number(e.target.value))} className="form-input">
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Baths">
              <select value={inputs.bathrooms} onChange={(e) => update('bathrooms', Number(e.target.value))} className="form-input">
                {[1,1.5,2,2.5,3,3.5,4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Parking">
              <select value={inputs.parking} onChange={(e) => update('parking', Number(e.target.value))} className="form-input">
                {[0,1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Purchase price" prefix="$">
            <NumberInput value={inputs.purchasePrice} onChange={(v) => update('purchasePrice', v)} />
          </Field>
          <Field label="Weekly rent" prefix="$">
            <NumberInput value={inputs.weeklyRent} onChange={(v) => update('weeklyRent', v)} />
          </Field>
        </Section>

        <Section title="Buyer profile" number="02">
          {/* Buyer type toggle */}
          <Field label="Buyer type">
            <div className="flex gap-1">
              {[['investor', 'Investor'], ['fhb', 'First Home Buyer']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => update('buyerType', val)}
                  className="flex-1 py-2 text-xs"
                  style={{
                    background: inputs.buyerType === val ? 'var(--accent)' : 'transparent',
                    color: inputs.buyerType === val ? 'var(--bg)' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                >{label}</button>
              ))}
            </div>
          </Field>

          {inputs.buyerType === 'fhb' && (
            <>
              <Field label="Intended use">
                <div className="flex gap-1">
                  {[['ppor', 'Live in (PPOR)'], ['investment', 'Rent out']].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => update('fhbPurpose', val)}
                      className="flex-1 py-2 text-xs"
                      style={{
                        background: inputs.fhbPurpose === val ? 'var(--accent)' : 'transparent',
                        color: inputs.fhbPurpose === val ? 'var(--bg)' : 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >{label}</button>
                  ))}
                </div>
              </Field>
              <Field label="New build?">
                <div className="flex gap-1">
                  {[[true, 'Yes – new build'], [false, 'No – established']].map(([val, label]) => (
                    <button
                      key={String(val)}
                      onClick={() => update('isNewBuild', val)}
                      className="flex-1 py-2 text-xs"
                      style={{
                        background: inputs.isNewBuild === val ? 'var(--accent)' : 'transparent',
                        color: inputs.isNewBuild === val ? 'var(--bg)' : 'var(--text-muted)',
                        border: '1px solid var(--border)',
                      }}
                    >{label}</button>
                  ))}
                </div>
              </Field>
              {inputs.fhbPurpose === 'ppor' && (
                <div className="p-3 rounded-sm text-xs" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
                  <strong>FHB PPOR benefits applied:</strong> {inputs.state} stamp duty exemption/concession
                  {inputs.isNewBuild && fhogByState[inputs.state]?.amount > 0 && ` + ${fhogByState[inputs.state].label}`}
                  {inputs.isNewBuild && fhogByState[inputs.state]?.amount === 0 && ' · No FHOG in this state'}
                  {!inputs.isNewBuild && ' · New build required for FHOG'}
                </div>
              )}
            </>
          )}

          {/* Guarantor toggle */}
          <Field label="Family guarantor (security guarantee)?">
            <div className="flex gap-1">
              {[[false, 'No guarantor'], [true, 'Yes – use guarantor']].map(([val, label]) => (
                <button
                  key={String(val)}
                  onClick={() => update('useGuarantor', val)}
                  className="flex-1 py-2 text-xs"
                  style={{
                    background: inputs.useGuarantor === val ? 'var(--accent)' : 'transparent',
                    color: inputs.useGuarantor === val ? 'var(--bg)' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                >{label}</button>
              ))}
            </div>
          </Field>
          {inputs.useGuarantor && (
            <div className="p-3 rounded-sm text-xs" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--accent)' }}>
              <strong>Guarantor active:</strong> LMI waived (guarantor's equity covers the ≤20% gap). Loan modelled at 100% LVR. You still need cash for stamp duty &amp; other upfront costs. Guarantor's property is at risk until your equity reaches ~20%.
            </div>
          )}
        </Section>

        <Section title="Loan structure" number="03">
          <Field label="Deposit (cash, ex. costs)" prefix="$">
            <NumberInput value={inputs.deposit} onChange={(v) => update('deposit', v)} />
          </Field>
          <div className="text-11 flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
            <span>LVR</span>
            <span className="font-mono" style={{ color: calc.lvr > 80 ? 'var(--negative)' : 'var(--text)' }}>{formatPct(calc.lvr, 1)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Interest rate" suffix="%">
              <NumberInput value={inputs.interestRate} onChange={(v) => update('interestRate', v)} step={0.01} />
            </Field>
            <Field label="Term" suffix="yrs">
              <NumberInput value={inputs.loanTermYears} onChange={(v) => update('loanTermYears', v)} />
            </Field>
          </div>
          <Field label="Repayment type">
            <div className="flex gap-1">
              {['PI', 'IO'].map((t) => (
                <button
                  key={t}
                  onClick={() => update('loanType', t)}
                  className="flex-1 py-2 text-xs"
                  style={{
                    background: inputs.loanType === t ? 'var(--accent)' : 'transparent',
                    color: inputs.loanType === t ? 'var(--bg)' : 'var(--text-muted)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {t === 'PI' ? 'Principal & Interest' : 'Interest Only'}
                </button>
              ))}
            </div>
          </Field>
        </Section>

        <Section title="Annual costs" number="04">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Council rates" prefix="$"><NumberInput value={inputs.councilRates} onChange={(v) => update('councilRates', v)} /></Field>
            <Field label="Water rates" prefix="$"><NumberInput value={inputs.waterRates} onChange={(v) => update('waterRates', v)} /></Field>
            <Field label="Strata / body corp" prefix="$"><NumberInput value={inputs.strataFees} onChange={(v) => update('strataFees', v)} /></Field>
            <Field label="Insurance" prefix="$"><NumberInput value={inputs.insurance} onChange={(v) => update('insurance', v)} /></Field>
            <Field label="Land tax" prefix="$"><NumberInput value={inputs.landTax} onChange={(v) => update('landTax', v)} /></Field>
            <Field label="PM fees" suffix="%"><NumberInput value={inputs.pmFeesPct} onChange={(v) => update('pmFeesPct', v)} step={0.1} /></Field>
            <Field label="Vacancy" suffix="wks"><NumberInput value={inputs.vacancyWeeks} onChange={(v) => update('vacancyWeeks', v)} step={0.5} /></Field>
            <Field label="Maintenance" suffix="% of value"><NumberInput value={inputs.maintenancePct} onChange={(v) => update('maintenancePct', v)} step={0.1} /></Field>
          </div>
        </Section>

        <Section title="Tax & growth assumptions" number="05">
          <Field label="Your taxable income (excl. property)" prefix="$">
            <NumberInput value={inputs.taxableIncome} onChange={(v) => update('taxableIncome', v)} />
          </Field>
          <div className="text-11 flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
            <span>Marginal tax rate</span>
            <span className="font-mono" style={{ color: 'var(--text)' }}>{formatPct(calc.marginalRate * 100, 0)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Capital growth" suffix="% p.a."><NumberInput value={inputs.capitalGrowthPct} onChange={(v) => update('capitalGrowthPct', v)} step={0.1} /></Field>
            <Field label="Rent growth" suffix="% p.a."><NumberInput value={inputs.rentGrowthPct} onChange={(v) => update('rentGrowthPct', v)} step={0.1} /></Field>
          </div>
          <Field label="Annual depreciation (qty surveyor est.)" prefix="$">
            <NumberInput value={inputs.depreciation} onChange={(v) => update('depreciation', v)} />
          </Field>
        </Section>

        <button onClick={onSave} className="w-full py-3 text-sm flex items-center justify-center gap-2 transition-all" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
          <Save size={14} /> Save scenario for comparison
        </button>
      </div>

      {/* OUTPUT PANEL */}
      <div className="lg:col-span-7 space-y-6">
        {/* HEADLINE METRICS */}
        <div className="grid grid-cols-2 gap-3">
          <BigStat
            label="Gross yield"
            value={formatPct(calc.grossYield)}
            sub={`${formatAUD(calc.grossRent)} / yr rent`}
            tone={calc.grossYield >= 5 ? 'positive' : calc.grossYield >= 4 ? 'neutral' : 'negative'}
          />
          <BigStat
            label="Net yield"
            value={formatPct(calc.netYield)}
            sub={`After ${formatAUD(calc.totalOpEx)} opex`}
            tone={calc.netYield >= 4 ? 'positive' : calc.netYield >= 3 ? 'neutral' : 'negative'}
          />
          <BigStat
            label="Weekly cashflow"
            value={`${calc.cashflowAfterTaxWeekly >= 0 ? '+' : ''}${formatAUD(calc.cashflowAfterTaxWeekly)}`}
            sub="After tax (incl. neg. gearing)"
            tone={calc.cashflowAfterTaxWeekly >= 0 ? 'positive' : 'negative'}
            mono
          />
          <BigStat
            label="Cash to close"
            value={formatAUD(calc.totalCashRequired)}
            sub={`Deposit + ${formatAUD(calc.upfrontCosts)} costs`}
            tone="neutral"
          />
        </div>

        {/* HOLDING COST CALLOUT */}
        <div className="p-5 rounded-sm border-l-2" style={{ borderColor: calc.cashflowAfterTaxWeekly >= 0 ? 'var(--positive)' : 'var(--negative)', background: 'var(--surface)' }}>
          <div className="text-11 tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>
            {calc.cashflowAfterTaxWeekly >= 0 ? 'Positively geared' : 'Negatively geared'}
          </div>
          <div className="font-display text-2xl">
            {calc.cashflowAfterTaxWeekly >= 0
              ? <>This property pays you <em style={{ color: 'var(--positive)' }}>{formatAUD(Math.abs(calc.cashflowAfterTaxWeekly))} / week</em>.</>
              : <>You'll need to top up <em style={{ color: 'var(--negative)' }}>{formatAUD(Math.abs(calc.cashflowAfterTaxWeekly))} / week</em> from your own pocket.</>
            }
          </div>
          <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Pre-tax: {formatAUD(calc.cashflowWeekly)}/wk · Tax {calc.taxBenefit >= 0 ? 'saved' : 'owed'}: {formatAUD(Math.abs(calc.taxBenefit))}/yr · Cash-on-cash: {formatPct(calc.cashOnCash)}
          </div>
        </div>

        {/* COST BREAKDOWN */}
        <Collapsible title="Upfront cost breakdown" defaultOpen>
          <table className="w-full text-sm">
            <tbody>
              <Row
                label={`Stamp duty (${inputs.state}${inputs.buyerType === 'fhb' && inputs.fhbPurpose === 'ppor' ? ', FHB PPOR' : ', standard'})`}
                value={formatAUD(calc.stampDuty)}
                subtitle={calc.stampDutySaving > 0 ? `Saving ${formatAUD(calc.stampDutySaving)} vs full investor rate` : undefined}
              />
              {calc.stampDutySaving > 0 && (
                <Row label="→ FHB stamp duty saving" value={`-${formatAUD(calc.stampDutySaving)}`} positive />
              )}
              <Row label="LMI" value={formatAUD(calc.lmi)} muted={calc.lmi === 0} subtitle={
                inputs.useGuarantor ? 'Waived — guarantor security' :
                calc.lmi === 0 ? 'LVR ≤ 80%, no LMI' : `LVR ${formatPct(calc.lvr,1)}`
              } />
              {calc.lmiSaving > 0 && (
                <Row label="→ Guarantor LMI saving" value={`-${formatAUD(calc.lmiSaving)}`} positive />
              )}
              <Row label="Legal / conveyancing" value={formatAUD(inputs.legalFees)} editable onChange={(v) => update('legalFees', v)} />
              <Row label="Building & pest inspection" value={formatAUD(inputs.buildingInspection)} editable onChange={(v) => update('buildingInspection', v)} />
              <Row label="Transfer & mortgage rego fees" value={formatAUD(calc.transferFee + calc.mortgageReg)} />
              <Row label="Total upfront costs" value={formatAUD(calc.upfrontCosts)} bold />
              <Row label="+ Cash deposit" value={formatAUD(inputs.deposit)} />
              {calc.fhogGrant > 0 && (
                <Row label={`− FHOG grant (${inputs.state})`} value={`-${formatAUD(calc.fhogGrant)}`} positive subtitle={fhogByState[inputs.state]?.label} />
              )}
              <Row label="Total cash required" value={formatAUD(calc.totalCashRequired)} bold accent />
              {calc.totalSavings > 0 && (
                <Row label="Total concession savings" value={formatAUD(calc.totalSavings)} positive bold subtitle={`vs standard investor with no concessions`} />
              )}
            </tbody>
          </table>
        </Collapsible>

        <Collapsible title="Annual cashflow breakdown">
          <table className="w-full text-sm">
            <tbody>
              <Row label="Gross rent (52 weeks)" value={formatAUD(calc.grossRent)} />
              <Row label={`Vacancy allowance (${inputs.vacancyWeeks} wks)`} value={`-${formatAUD(calc.vacancyLoss)}`} />
              <Row label="Effective rental income" value={formatAUD(calc.effectiveRent)} bold />
              <tr><td colSpan="2" className="pt-3 text-11 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Operating costs</td></tr>
              <Row label="Council rates" value={`-${formatAUD(inputs.councilRates)}`} />
              <Row label="Water rates" value={`-${formatAUD(inputs.waterRates)}`} />
              <Row label="Strata / body corp" value={`-${formatAUD(inputs.strataFees)}`} />
              <Row label="Insurance" value={`-${formatAUD(inputs.insurance)}`} />
              {inputs.landTax > 0 && <Row label="Land tax" value={`-${formatAUD(inputs.landTax)}`} />}
              <Row label={`Property mgmt (${inputs.pmFeesPct}%)`} value={`-${formatAUD(calc.pmFees)}`} />
              <Row label={`Maintenance (${inputs.maintenancePct}%)`} value={`-${formatAUD(calc.maintenance)}`} />
              <Row label="Total operating costs" value={`-${formatAUD(calc.totalOpEx)}`} bold />
              <tr><td colSpan="2" className="pt-3 text-11 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Loan</td></tr>
              <Row label={`Repayments (${inputs.loanType === 'IO' ? 'Interest Only' : 'P&I'})`} value={`-${formatAUD(calc.annualRepay)}`} subtitle={`${formatAUD(calc.monthlyRepay)} / month`} />
              <Row label="Cashflow before tax" value={formatAUD(calc.cashflowBeforeTax)} bold />
              <tr><td colSpan="2" className="pt-3 text-11 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Tax</td></tr>
              <Row label={`Tax-deductible loss/gain`} value={formatAUD(calc.taxableLossOrGain)} subtitle={`Rent − opex − interest − ${formatAUD(inputs.depreciation)} depreciation`} />
              <Row label={`Tax ${calc.taxBenefit >= 0 ? 'saved' : 'owed'} @ ${formatPct(calc.marginalRate*100,0)}`} value={`${calc.taxBenefit >= 0 ? '+' : ''}${formatAUD(calc.taxBenefit)}`} />
              <Row label="Cashflow after tax" value={formatAUD(calc.cashflowAfterTax)} bold accent />
            </tbody>
          </table>
        </Collapsible>

        <Collapsible title="10-year projection">
          <ProjectionChart projection={calc.projection} purchasePrice={inputs.purchasePrice} deposit={inputs.deposit} />
          <table className="w-full text-xs mt-4">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }}>
                <th className="text-left py-2 font-normal tracking-widest uppercase text-10">Year</th>
                <th className="text-right py-2 font-normal tracking-widest uppercase text-10">Property</th>
                <th className="text-right py-2 font-normal tracking-widest uppercase text-10">Rent (yr)</th>
                <th className="text-right py-2 font-normal tracking-widest uppercase text-10">Cashflow</th>
                <th className="text-right py-2 font-normal tracking-widest uppercase text-10">Equity</th>
              </tr>
            </thead>
            <tbody>
              {calc.projection.map((p) => (
                <tr key={p.year} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="py-2 font-mono">{p.year}</td>
                  <td className="py-2 text-right font-mono">{formatAUD(p.propValue)}</td>
                  <td className="py-2 text-right font-mono">{formatAUD(p.rent)}</td>
                  <td className="py-2 text-right font-mono" style={{ color: p.cashflow >= 0 ? 'var(--positive)' : 'var(--negative)' }}>{formatAUD(p.cashflow)}</td>
                  <td className="py-2 text-right font-mono">{formatAUD(p.equity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {calc.breakEvenYear && (
            <div className="text-xs mt-4 p-3 rounded" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              <strong>Break-even (cashflow + equity ≥ upfront costs):</strong> Year {calc.breakEvenYear}
            </div>
          )}
        </Collapsible>
      </div>
    </div>
  );
}

/* ============================================================================
   PROJECTION CHART (custom SVG)
   ============================================================================ */
function ProjectionChart({ projection, purchasePrice, deposit }) {
  const width = 600;
  const height = 220;
  const pad = { l: 50, r: 20, t: 20, b: 30 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;

  const maxValue = Math.max(...projection.map((p) => p.propValue));
  const minValue = purchasePrice * 0.95;
  const yScale = (v) => pad.t + innerH - ((v - minValue) / (maxValue - minValue)) * innerH;
  const xScale = (i) => pad.l + (i / (projection.length - 1)) * innerW;

  const valuePath = projection.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(p.propValue)}`).join(' ');
  const equityArea = `M ${pad.l} ${yScale(deposit + (projection[0].equity - deposit))} ` +
    projection.map((p, i) => `L ${xScale(i)} ${yScale(p.equity)}`).join(' ') +
    ` L ${pad.l + innerW} ${pad.t + innerH} L ${pad.l} ${pad.t + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 220 }}>
      <defs>
        <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* y axis labels */}
      {[0, 0.5, 1].map((t) => {
        const v = minValue + t * (maxValue - minValue);
        return (
          <g key={t}>
            <line x1={pad.l} x2={pad.l + innerW} y1={yScale(v)} y2={yScale(v)} stroke="var(--border)" strokeDasharray="2,4" />
            <text x={pad.l - 6} y={yScale(v) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">{formatAUD(v)}</text>
          </g>
        );
      })}
      {/* x axis labels */}
      {projection.filter((_, i) => i % 2 === 0).map((p) => (
        <text key={p.year} x={xScale(p.year - 1)} y={height - 8} textAnchor="middle" fontSize="9" fill="var(--text-muted)" fontFamily="JetBrains Mono, monospace">Y{p.year}</text>
      ))}
      {/* equity area */}
      <path d={equityArea} fill="url(#equityGrad)" />
      {/* property value line */}
      <path d={valuePath} fill="none" stroke="var(--accent)" strokeWidth="1.5" />
      {/* points */}
      {projection.map((p, i) => (
        <circle key={i} cx={xScale(i)} cy={yScale(p.propValue)} r="2" fill="var(--accent)" />
      ))}
      {/* legend */}
      <g transform={`translate(${pad.l}, ${pad.t})`}>
        <circle cx="4" cy="4" r="2" fill="var(--accent)" />
        <text x="11" y="7" fontSize="9" fill="var(--text-muted)">Property value</text>
        <rect x="100" y="2" width="8" height="6" fill="url(#equityGrad)" />
        <text x="112" y="7" fontSize="9" fill="var(--text-muted)">Your equity</text>
      </g>
    </svg>
  );
}

/* ============================================================================
   SUBURB INSIGHTS — uses Anthropic API + web search
   ============================================================================ */
function SuburbInsights({ initialSuburb }) {
  const [suburb, setSuburb] = useState(initialSuburb || '');
  const [propType, setPropType] = useState('Unit');
  const [bedrooms, setBedrooms] = useState('2');
  const [budget, setBudget] = useState('700000');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const runAnalysis = async () => {
    if (!suburb.trim()) return;
    setLoading(true); setError(null); setAnalysis(null);

    const prompt = `You are an Australian property investment analyst. Provide a structured analysis for an investor considering a ${bedrooms}-bedroom ${propType.toLowerCase()} in ${suburb} around $${Number(budget).toLocaleString('en-AU')}.

Search the web for current data (2025/2026) on:
- Median sale prices for ${bedrooms}-bed ${propType.toLowerCase()}s in ${suburb}
- Median weekly rent for that property type
- Vacancy rate
- 5-year capital growth rate
- Demographics, infrastructure, transport, schools
- Recent or planned developments
- Risks (oversupply, flood/fire zones, body corporate issues for units)

Return ONLY a JSON object (no markdown, no preamble) with this exact shape:
{
  "summary": "2-3 sentence executive summary",
  "metrics": {
    "medianPrice": <number in AUD>,
    "medianWeeklyRent": <number>,
    "grossYield": <number, percent>,
    "vacancyRate": <number, percent>,
    "fiveYearGrowth": <number, percent total over 5y>,
    "rentGrowthYoY": <number, percent>
  },
  "verdict": "buy" | "watch" | "avoid",
  "verdictReason": "1 sentence",
  "strengths": ["...", "...", "..."],
  "risks": ["...", "...", "..."],
  "demographics": "1-2 sentences",
  "infrastructure": "1-2 sentences",
  "comparableSuburbs": [
    {"name": "...", "reason": "why this is a comparable or better alternative"}
  ]
}

Use null for any metric you cannot find. Be honest about data limitations.`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        }),
      });
      const data = await response.json();
      const text = data.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
      const cleaned = text.replace(/```json|```/g, '').trim();
      // find first { and last }
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      const jsonStr = start !== -1 ? cleaned.substring(start, end + 1) : cleaned;
      const parsed = JSON.parse(jsonStr);
      setAnalysis(parsed);
    } catch (e) {
      console.error(e);
      setError('Could not generate analysis. Try again, or check the suburb name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-4 space-y-4">
        <Section title="Suburb research" number="01">
          <Field label="Suburb">
            <input value={suburb} onChange={(e) => setSuburb(e.target.value)} placeholder="e.g. Lidcombe" className="form-input" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select value={propType} onChange={(e) => setPropType(e.target.value)} className="form-input">
                <option>Unit</option><option>House</option><option>Townhouse</option>
              </select>
            </Field>
            <Field label="Bedrooms">
              <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="form-input">
                <option>1</option><option>2</option><option>3</option><option>4</option><option>5+</option>
              </select>
            </Field>
          </div>
          <Field label="Budget" prefix="$">
            <NumberInput value={budget} onChange={(v) => setBudget(v)} />
          </Field>
          <button
            onClick={runAnalysis}
            disabled={loading || !suburb.trim()}
            className="w-full py-3 mt-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: 'var(--bg)' }}
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Researching...</> : <><Sparkles size={14} /> Analyse suburb</>}
          </button>
          <p className="text-11 mt-2" style={{ color: 'var(--text-muted)' }}>
            Pulls live web data — vacancy, median price, rents, growth. Takes ~20 seconds.
          </p>
        </Section>
      </div>

      <div className="lg:col-span-8">
        {!analysis && !loading && !error && (
          <div className="p-12 text-center rounded-sm" style={{ border: '1px dashed var(--border)' }}>
            <MapPin size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <h3 className="font-display text-2xl mb-2">Suburb intelligence</h3>
            <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
              Enter a suburb to get current median prices, yields, vacancy, growth history, infrastructure context, and a buy/watch/avoid verdict — all sourced live from the web.
            </p>
          </div>
        )}

        {loading && (
          <div className="p-12 text-center">
            <Loader2 size={32} className="mx-auto mb-4 animate-spin" style={{ color: 'var(--accent)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Searching property data, vacancy rates, growth history...</p>
          </div>
        )}

        {error && (
          <div className="p-6 rounded-sm flex gap-3" style={{ border: '1px solid var(--negative)', background: 'rgba(196,85,77,0.05)' }}>
            <AlertCircle size={20} style={{ color: 'var(--negative)' }} />
            <div className="text-sm">{error}</div>
          </div>
        )}

        {analysis && <AnalysisDisplay analysis={analysis} suburb={suburb} />}
      </div>
    </div>
  );
}

function AnalysisDisplay({ analysis, suburb }) {
  const verdictColor = {
    buy: 'var(--positive)', watch: 'var(--accent)', avoid: 'var(--negative)',
  }[analysis.verdict] || 'var(--text)';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h2 className="font-display text-3xl">{suburb}</h2>
          <span className="px-2 py-1 text-10 uppercase tracking-widest" style={{ background: verdictColor, color: 'var(--bg)' }}>
            {analysis.verdict}
          </span>
        </div>
        <p className="text-sm italic mb-3" style={{ color: 'var(--text-muted)' }}>"{analysis.verdictReason}"</p>
        <p className="text-sm">{analysis.summary}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricBox label="Median price" value={analysis.metrics.medianPrice ? formatAUD(analysis.metrics.medianPrice) : 'n/a'} />
        <MetricBox label="Weekly rent" value={analysis.metrics.medianWeeklyRent ? formatAUD(analysis.metrics.medianWeeklyRent) : 'n/a'} />
        <MetricBox label="Gross yield" value={analysis.metrics.grossYield ? formatPct(analysis.metrics.grossYield, 2) : 'n/a'} />
        <MetricBox label="Vacancy" value={analysis.metrics.vacancyRate ? formatPct(analysis.metrics.vacancyRate, 1) : 'n/a'} />
        <MetricBox label="5y growth" value={analysis.metrics.fiveYearGrowth ? formatPct(analysis.metrics.fiveYearGrowth, 1) : 'n/a'} />
        <MetricBox label="Rent growth YoY" value={analysis.metrics.rentGrowthYoY ? formatPct(analysis.metrics.rentGrowthYoY, 1) : 'n/a'} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-sm" style={{ background: 'var(--surface)', borderLeft: '2px solid var(--positive)' }}>
          <div className="text-10 tracking-widest uppercase mb-2 flex items-center gap-1" style={{ color: 'var(--positive)' }}><TrendingUp size={10} /> Strengths</div>
          <ul className="space-y-2 text-sm">
            {analysis.strengths.map((s, i) => <li key={i} className="flex gap-2"><span style={{ color: 'var(--positive)' }}>+</span><span>{s}</span></li>)}
          </ul>
        </div>
        <div className="p-4 rounded-sm" style={{ background: 'var(--surface)', borderLeft: '2px solid var(--negative)' }}>
          <div className="text-10 tracking-widest uppercase mb-2 flex items-center gap-1" style={{ color: 'var(--negative)' }}><TrendingDown size={10} /> Risks</div>
          <ul className="space-y-2 text-sm">
            {analysis.risks.map((s, i) => <li key={i} className="flex gap-2"><span style={{ color: 'var(--negative)' }}>−</span><span>{s}</span></li>)}
          </ul>
        </div>
      </div>

      {(analysis.demographics || analysis.infrastructure) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.demographics && (
            <div className="p-4 rounded-sm" style={{ background: 'var(--surface)' }}>
              <div className="text-10 tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Demographics</div>
              <p className="text-sm">{analysis.demographics}</p>
            </div>
          )}
          {analysis.infrastructure && (
            <div className="p-4 rounded-sm" style={{ background: 'var(--surface)' }}>
              <div className="text-10 tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>Infrastructure & transport</div>
              <p className="text-sm">{analysis.infrastructure}</p>
            </div>
          )}
        </div>
      )}

      {analysis.comparableSuburbs && analysis.comparableSuburbs.length > 0 && (
        <div className="p-4 rounded-sm" style={{ background: 'var(--surface)' }}>
          <div className="text-10 tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>Comparable / alternative suburbs</div>
          <div className="space-y-2">
            {analysis.comparableSuburbs.map((c, i) => (
              <div key={i} className="text-sm flex gap-3">
                <span className="font-display text-base" style={{ color: 'var(--accent)' }}>{c.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>{c.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   COMPARE VIEW
   ============================================================================ */
function CompareView({ scenarios, removeScenario, currentInputs, currentCalc, currentName }) {
  const all = [
    { id: 'current', name: currentName, inputs: currentInputs, calc: currentCalc, current: true },
    ...scenarios,
  ];

  if (scenarios.length === 0) {
    return (
      <div className="p-12 text-center rounded-sm" style={{ border: '1px dashed var(--border)' }}>
        <Layers size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <h3 className="font-display text-2xl mb-2">No saved scenarios yet</h3>
        <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-muted)' }}>
          Configure a property in the Calculator tab and click "Save scenario" to add it here. Stack multiple suburbs side-by-side to find the best yield.
        </p>
      </div>
    );
  }

  // Find best/worst per metric for highlighting
  const metricKeys = [
    { key: 'grossYield', label: 'Gross yield', fmt: (v) => formatPct(v, 2), higher: true },
    { key: 'netYield', label: 'Net yield', fmt: (v) => formatPct(v, 2), higher: true },
    { key: 'cashflowAfterTaxWeekly', label: 'Weekly cashflow (after tax)', fmt: (v) => formatAUD(v), higher: true },
    { key: 'cashOnCash', label: 'Cash-on-cash return', fmt: (v) => formatPct(v, 2), higher: true },
    { key: 'totalCashRequired', label: 'Cash to close', fmt: (v) => formatAUD(v), higher: false },
    { key: 'upfrontCosts', label: 'Upfront costs', fmt: (v) => formatAUD(v), higher: false },
    { key: 'lvr', label: 'LVR', fmt: (v) => formatPct(v, 1), higher: false },
  ];

  const bestIndex = (key, higher) => {
    let bi = 0; let bv = all[0].calc[key];
    for (let i = 1; i < all.length; i++) {
      if ((higher && all[i].calc[key] > bv) || (!higher && all[i].calc[key] < bv)) {
        bi = i; bv = all[i].calc[key];
      }
    }
    return bi;
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left p-3 text-10 tracking-widest uppercase font-normal" style={{ color: 'var(--text-muted)' }}>Metric</th>
              {all.map((s) => (
                <th key={s.id} className="text-left p-3 min-w-180">
                  <div className="font-display text-lg leading-tight">{s.name}</div>
                  <div className="text-10 tracking-widest uppercase mt-1" style={{ color: 'var(--text-muted)' }}>
                    {s.inputs.suburb}, {s.inputs.state}
                  </div>
                  <div className="text-10 tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                    {formatAUD(s.inputs.purchasePrice)} · {s.inputs.propertyType}
                  </div>
                  {!s.current && (
                    <button onClick={() => removeScenario(s.id)} className="mt-2 text-10 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Trash2 size={10} /> Remove
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metricKeys.map((m) => {
              const bi = bestIndex(m.key, m.higher);
              return (
                <tr key={m.key} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="p-3 text-11 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>{m.label}</td>
                  {all.map((s, i) => (
                    <td key={s.id} className="p-3 font-mono" style={{ color: i === bi ? 'var(--positive)' : 'var(--text)' }}>
                      {m.fmt(s.calc[m.key])}
                      {i === bi && <span className="ml-1 text-9">★</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
            <tr style={{ borderTop: '1px solid var(--border)' }}>
              <td className="p-3 text-11 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Property at year 10</td>
              {all.map((s) => (
                <td key={s.id} className="p-3 font-mono">{formatAUD(s.calc.projection[9].propValue)}</td>
              ))}
            </tr>
            <tr style={{ borderTop: '1px solid var(--border)' }}>
              <td className="p-3 text-11 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Equity at year 10</td>
              {all.map((s) => (
                <td key={s.id} className="p-3 font-mono">{formatAUD(s.calc.projection[9].equity)}</td>
              ))}
            </tr>
            <tr style={{ borderTop: '1px solid var(--border)' }}>
              <td className="p-3 text-11 tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Break-even year</td>
              {all.map((s) => (
                <td key={s.id} className="p-3 font-mono">{s.calc.breakEvenYear ? `Y${s.calc.breakEvenYear}` : '> 10y'}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================================
   PRESENTATIONAL HELPERS
   ============================================================================ */
function Section({ title, number, children }) {
  return (
    <div className="rounded-sm p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="font-display text-xl">{title}</h2>
        <span className="font-mono text-10 tracking-widest" style={{ color: 'var(--text-muted)' }}>—{number}</span>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, prefix, suffix, children }) {
  return (
    <div>
      <label className="text-10 tracking-widest uppercase block mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{prefix}</span>}
        <div className="flex-1">{children}</div>
        {suffix && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{suffix}</span>}
      </div>
    </div>
  );
}

function NumberInput({ value, onChange, step = 1 }) {
  return (
    <input
      type="number"
      value={value}
      step={step}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      className="form-input font-mono"
    />
  );
}

function BigStat({ label, value, sub, tone, mono = true }) {
  const toneColor = {
    positive: 'var(--positive)',
    negative: 'var(--negative)',
    neutral: 'var(--text)',
  }[tone] || 'var(--text)';
  return (
    <div className="rounded-sm p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-10 tracking-widest uppercase mb-2" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className={`font-display text-3xl leading-none ${mono ? 'tabular-nums' : ''}`} style={{ color: toneColor }}>{value}</div>
      <div className="text-11 mt-2" style={{ color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function Row({ label, value, subtitle, bold, accent, muted, positive, editable, onChange }) {
  return (
    <tr style={{ borderTop: muted ? 'none' : '1px solid var(--border)' }}>
      <td className="py-2.5 pr-3">
        <div className={bold ? 'font-medium' : ''} style={{ color: muted ? 'var(--text-muted)' : positive ? 'var(--positive)' : 'var(--text)' }}>{label}</div>
        {subtitle && <div className="text-10 mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</div>}
      </td>
      <td className={`py-2.5 text-right font-mono ${bold ? 'font-medium' : ''} tabular-nums`} style={{ color: accent ? 'var(--accent)' : positive ? 'var(--positive)' : muted ? 'var(--text-muted)' : 'var(--text)' }}>
        {editable ? (
          <input
            type="number"
            value={value.replace(/[^\d.]/g, '')}
            onChange={(e) => onChange(Number(e.target.value))}
            className="form-input font-mono text-right w-28"
            style={{ background: 'transparent' }}
          />
        ) : value}
      </td>
    </tr>
  );
}

function Collapsible({ title, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div className="rounded-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4">
        <span className="font-display text-lg">{title}</span>
        {open ? <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />}
      </button>
      {open && <div className="px-4 pb-4 pt-1">{children}</div>}
    </div>
  );
}

function MetricBox({ label, value }) {
  return (
    <div className="p-4 rounded-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="text-10 tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="font-mono text-lg tabular-nums">{value}</div>
    </div>
  );
}

/* ============================================================================
   STYLES
   ============================================================================ */
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg: #0e0d0b;
  --surface: #161310;
  --surface-2: #1f1b16;
  --border: #2a241d;
  --text: #f1ebde;
  --text-muted: #8a8278;
  --accent: #d97c3f;
  --accent-soft: rgba(217, 124, 63, 0.1);
  --positive: #92a779;
  --negative: #c4554d;
}

body, html { background: var(--bg); }

* { box-sizing: border-box; }

/* Custom utility classes for sizes Tailwind core doesn't have */
.text-9 { font-size: 9px; line-height: 1.4; }
.text-10 { font-size: 10px; line-height: 1.4; }
.text-11 { font-size: 11px; line-height: 1.5; }
.leading-95 { line-height: 0.95; }
.tracking-18 { letter-spacing: 0.18em; }
.max-w-container { max-width: 1400px; margin-left: auto; margin-right: auto; }
.min-w-180 { min-width: 180px; }

body {
  font-family: 'Outfit', system-ui, sans-serif;
  font-feature-settings: 'cv11', 'ss01';
  -webkit-font-smoothing: antialiased;
  letter-spacing: -0.005em;
}

.font-display {
  font-family: 'Fraunces', Georgia, serif;
  font-optical-sizing: auto;
  font-variation-settings: 'opsz' 96, 'SOFT' 50;
  letter-spacing: -0.02em;
  font-weight: 500;
}

.font-display em {
  font-style: italic;
  font-variation-settings: 'opsz' 96, 'SOFT' 100;
}

.font-mono, .tabular-nums {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.form-input {
  width: 100%;
  background: var(--bg);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  outline: none;
  border-radius: 2px;
  transition: border-color 0.15s;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
}

.form-input:focus {
  border-color: var(--accent);
}

select.form-input {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='%238a8278' d='M2 4l4 4 4-4z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  background-size: 12px;
  padding-right: 2rem;
  font-family: 'Outfit', sans-serif;
}

input[type="number"] { -moz-appearance: textfield; }
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

button {
  cursor: pointer;
  font-family: inherit;
  border: none;
  outline: none;
  letter-spacing: -0.005em;
}

::selection {
  background: var(--accent);
  color: var(--bg);
}

/* Subtle texture */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: radial-gradient(circle at 1px 1px, rgba(217, 124, 63, 0.04) 1px, transparent 0);
  background-size: 24px 24px;
}

main, header { position: relative; z-index: 1; }
`;
