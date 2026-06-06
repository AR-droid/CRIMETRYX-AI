import React, { useState, useEffect, useRef } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── colour palette used across the page ───────────────────────────────────
const CRIME_COLORS = {
  burglary: '#6366f1', robbery: '#f59e0b', assault: '#ef4444',
  vehicle_theft: '#3b82f6', cybercrime: '#10b981', fraud: '#8b5cf6',
  kidnapping: '#f97316', murder: '#dc2626', drug_offense: '#ec4899',
  vandalism: '#64748b',
};

// ── tiny helpers ──────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}44`,
      borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 600,
    }}>{label}</span>
  );
}

function Card({ title, children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(17,24,39,0.85)', border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: 16, padding: 24, backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)', ...style
    }}>
      {title && <h3 style={{ margin: '0 0 16px', color: '#a5b4fc', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>{title}</h3>}
      {children}
    </div>
  );
}

function MiniBar({ value, max = 1, color = '#6366f1' }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.6s ease' }} />
    </div>
  );
}

function Select({ label, name, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <select name={name} value={value} onChange={onChange} style={{
        background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.3)',
        borderRadius: 8, color: '#e2e8f0', padding: '8px 12px', fontSize: 14,
        outline: 'none', cursor: 'pointer',
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── option lists ──────────────────────────────────────────────────────────
const CRIME_OPTS   = ['burglary','robbery','assault','vehicle_theft','cybercrime','fraud','kidnapping','murder','drug_offense','vandalism'].map(v => ({ value: v, label: v.replace(/_/g, ' ') }));
const LOC_OPTS     = ['residential_area','commercial_zone','industrial_area','public_transport','educational_institution','rural_area','highway','marketplace','bank_premises','parking_lot'].map(v => ({ value: v, label: v.replace(/_/g, ' ') }));
const TIME_OPTS    = ['early_morning','morning','afternoon','evening','night','midnight'].map(v => ({ value: v, label: v.replace(/_/g, ' ') }));
const WEAPON_OPTS  = ['none','knife','firearm','blunt_object','chemical','vehicle','rope','improvised_tool'].map(v => ({ value: v, label: v.replace(/_/g, ' ') }));
const ENTRY_OPTS   = ['forced_entry','lock_picking','social_engineering','none','window_break','tunneling','impersonation','cyber_access','unlocked_door','roof_access'].map(v => ({ value: v, label: v.replace(/_/g, ' ') }));
const TARGET_OPTS  = ['individual','household','commercial_establishment','financial_institution','government_property','vehicle','digital_asset','public_space','infrastructure','multiple'].map(v => ({ value: v, label: v.replace(/_/g, ' ') }));
const AGE_OPTS     = ['juvenile','18-25','26-35','36-45','46-60','60+'].map(v => ({ value: v, label: v }));

const DEFAULT_FEATURES = {
  crime_type: 'burglary', location_type: 'residential_area', state: 'MH',
  time_of_day: 'night', weapon_used: 'none', entry_method: 'forced_entry',
  target_type: 'household', suspect_age_group: '26-35',
  prior_record: 0, accomplice_count: 0, evidence_recovered: 0,
  digital_evidence: 0, severity_score: 5,
};

// ── Sparkline (SVG mini chart) ─────────────────────────────────────────────
function Sparkline({ data, color = '#6366f1', height = 48 }) {
  if (!data || data.length < 2) return null;
  const w = 280, h = height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={pts.split(' ').pop().split(',')[0]} cy={pts.split(' ').pop().split(',')[1]} r={4} fill={color} />
    </svg>
  );
}

// ── Model metrics panel ────────────────────────────────────────────────────
function ModelMetricsPanel() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/ml/model-metrics`)
      .then(r => r.json())
      .then(d => { setMetrics(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#64748b', padding: 32, textAlign: 'center' }}>Loading model metrics...</div>;
  if (!metrics || Object.keys(metrics).length === 0) return (
    <div style={{ color: '#94a3b8', padding: 32, textAlign: 'center' }}>
      Models not yet trained. Run <code style={{ color: '#a5b4fc' }}>python ml_model/train_models.py</code> first.
    </div>
  );

  const MODEL_META = {
    lstm:               { name: 'LSTM', color: '#6366f1', task: 'Crime Type Prediction',       icon: '◈' },
    random_forest:      { name: 'Random Forest', color: '#10b981', task: 'Crime Classification',    icon: '◉' },
    logistic_regression:{ name: 'Logistic Regression', color: '#f59e0b', task: 'Recidivism Risk',  icon: '◍' },
    gradient_boosting:  { name: 'Gradient Boosting', color: '#f97316', task: 'Suspect Priority',   icon: '◎' },
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
      {Object.entries(metrics).map(([key, m]) => {
        const meta = MODEL_META[key] || { name: key, color: '#6366f1', task: '', icon: '○' };
        const acc = m.accuracy ?? m.f1 ?? 0;
        const trainHistory = m.train_acc_history;
        const valHistory   = m.val_acc_history;
        return (
          <Card key={key} style={{ borderColor: meta.color + '44' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ color: meta.color, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                  {meta.icon} {meta.name}
                </div>
                <div style={{ color: '#64748b', fontSize: 12 }}>{meta.task}</div>
              </div>
              <Badge label={`${(acc * 100).toFixed(1)}% ACC`} color={meta.color} />
            </div>

            {m.f1_weighted && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>F1 Weighted</div>
                <MiniBar value={m.f1_weighted} color={meta.color} />
                <div style={{ color: '#e2e8f0', fontSize: 13, marginTop: 4 }}>{(m.f1_weighted * 100).toFixed(1)}%</div>
              </div>
            )}
            {m.auc_roc && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>AUC-ROC</div>
                <MiniBar value={m.auc_roc} color={meta.color} />
                <div style={{ color: '#e2e8f0', fontSize: 13, marginTop: 4 }}>{(m.auc_roc * 100).toFixed(1)}%</div>
              </div>
            )}

            {trainHistory && (
              <div>
                <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>
                  Training accuracy — {m.epochs_trained} epochs
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: 10, marginBottom: 2 }}>Train</div>
                    <Sparkline data={trainHistory} color={meta.color} height={40} />
                  </div>
                  {valHistory && (
                    <div>
                      <div style={{ color: '#64748b', fontSize: 10, marginBottom: 2 }}>Val</div>
                      <Sparkline data={valHistory} color={meta.color + '88'} height={40} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {m.architecture && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, color: '#64748b', fontSize: 11, fontFamily: 'monospace' }}>
                {m.architecture}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

// ── Crime Type Predictor ───────────────────────────────────────────────────
function CrimeTypePredictor() {
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [result, setResult] = useState(null);
  const [lstmResult, setLstmResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setFeatures(f => ({ ...f, [name]: isNaN(value) ? value : Number(value) }));
  };

  const predict = async () => {
    setLoading(true);
    setResult(null); setLstmResult(null);
    try {
      const [rfRes, lstmRes] = await Promise.all([
        fetch(`${API}/api/ml/predict-crime-type`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(features) }).then(r => r.json()),
        fetch(`${API}/api/ml/predict-crime-type-lstm`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(features) }).then(r => r.json()),
      ]);
      setResult(rfRes);
      setLstmResult(lstmRes);
    } catch (e) {
      setResult({ error: 'Request failed. Is the backend running?' });
    }
    setLoading(false);
  };

  const topProbs = result?.class_probabilities
    ? Object.entries(result.class_probabilities).sort((a, b) => b[1] - a[1]).slice(0, 6)
    : [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {/* Input */}
      <Card title="FIR Feature Input">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Select label="Location Type" name="location_type" value={features.location_type} onChange={handleChange} options={LOC_OPTS} />
          <Select label="Time of Day"   name="time_of_day"   value={features.time_of_day}   onChange={handleChange} options={TIME_OPTS} />
          <Select label="Weapon Used"   name="weapon_used"   value={features.weapon_used}   onChange={handleChange} options={WEAPON_OPTS} />
          <Select label="Entry Method"  name="entry_method"  value={features.entry_method}  onChange={handleChange} options={ENTRY_OPTS} />
          <Select label="Target Type"   name="target_type"   value={features.target_type}   onChange={handleChange} options={TARGET_OPTS} />
          <Select label="Suspect Age"   name="suspect_age_group" value={features.suspect_age_group} onChange={handleChange} options={AGE_OPTS} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Prior Record', name: 'prior_record', max: 1 },
            { label: 'Accomplices',  name: 'accomplice_count', max: 4 },
            { label: 'Severity (1-10)', name: 'severity_score', max: 10 },
          ].map(({ label, name, max }) => (
            <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
              <input type="number" name={name} value={features[name]} min={0} max={max} onChange={handleChange} style={{
                background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8, color: '#e2e8f0', padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
              }} />
            </div>
          ))}
        </div>
        <button onClick={predict} disabled={loading} style={{
          width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
          background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'opacity 0.2s',
        }}>
          {loading ? 'Predicting...' : 'Run Prediction'}
        </button>
      </Card>

      {/* Output */}
      <Card title="Prediction Results">
        {!result && !loading && (
          <div style={{ color: '#475569', textAlign: 'center', paddingTop: 60, fontSize: 14 }}>
            Configure features and click Run Prediction
          </div>
        )}
        {result?.error && <div style={{ color: '#f87171' }}>{result.error}</div>}
        {result && !result.error && (
          <div>
            {/* RF result */}
            <div style={{ marginBottom: 20, padding: 16, background: 'rgba(99,102,241,0.1)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.2)' }}>
              <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>RANDOM FOREST PREDICTION</div>
              <div style={{ color: CRIME_COLORS[result.predicted_crime_type] || '#6366f1', fontSize: 22, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                {result.predicted_crime_type?.replace(/_/g, ' ')}
              </div>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                Confidence: <span style={{ color: '#a5b4fc' }}>{(result.confidence * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* LSTM result */}
            {lstmResult && !lstmResult.error && (
              <div style={{ marginBottom: 20, padding: 16, background: 'rgba(16,185,129,0.08)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ color: '#6ee7b7', fontSize: 12, marginBottom: 8 }}>LSTM PREDICTION</div>
                <div style={{ color: CRIME_COLORS[lstmResult.predicted_crime_type] || '#10b981', fontSize: 22, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {lstmResult.predicted_crime_type?.replace(/_/g, ' ')}
                </div>
                <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
                  Confidence: <span style={{ color: '#6ee7b7' }}>{(lstmResult.confidence * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}

            {/* Class probabilities */}
            <div>
              <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>CLASS PROBABILITY DISTRIBUTION</div>
              {topProbs.map(([cls, prob]) => (
                <div key={cls} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ color: '#cbd5e1', fontSize: 13 }}>{cls.replace(/_/g, ' ')}</span>
                    <span style={{ color: CRIME_COLORS[cls] || '#6366f1', fontSize: 13, fontWeight: 600 }}>{(prob * 100).toFixed(1)}%</span>
                  </div>
                  <MiniBar value={prob} color={CRIME_COLORS[cls] || '#6366f1'} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Recidivism & Priority predictor ───────────────────────────────────────
function RiskAssessment() {
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [moText, setMoText] = useState('Suspect conducted prior surveillance of the target. Evidence of planned operation. Escape vehicle used.');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setFeatures(f => ({ ...f, [name]: isNaN(value) ? value : Number(value) }));
  };

  const predict = async () => {
    setLoading(true); setResult(null);
    try {
      const [recRes, priRes] = await Promise.all([
        fetch(`${API}/api/ml/predict-recidivism`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...features, mo_text: moText }) }).then(r => r.json()),
        fetch(`${API}/api/ml/predict-suspect-priority`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(features) }).then(r => r.json()),
      ]);
      setResult({ recidivism: recRes, priority: priRes });
    } catch (e) { setResult({ error: 'Request failed' }); }
    setLoading(false);
  };

  const RISK_COLORS = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <Card title="Suspect & Case Features">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <Select label="Crime Type"  name="crime_type"       value={features.crime_type}       onChange={handleChange} options={CRIME_OPTS} />
          <Select label="Target Type" name="target_type"      value={features.target_type}      onChange={handleChange} options={TARGET_OPTS} />
          <Select label="Weapon"      name="weapon_used"      value={features.weapon_used}      onChange={handleChange} options={WEAPON_OPTS} />
          <Select label="Suspect Age" name="suspect_age_group" value={features.suspect_age_group} onChange={handleChange} options={AGE_OPTS} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {[
            { label: 'Prior Record (0/1)', name: 'prior_record', max: 1 },
            { label: 'Severity Score (1-10)', name: 'severity_score', max: 10 },
          ].map(({ label, name, max }) => (
            <div key={name}>
              <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>{label}</label>
              <input type="number" name={name} value={features[name]} min={0} max={max} onChange={handleChange} style={{
                background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 8, color: '#e2e8f0', padding: '8px 12px', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
              }} />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>Modus Operandi Description</label>
          <textarea value={moText} onChange={e => setMoText(e.target.value)} rows={4} style={{
            width: '100%', boxSizing: 'border-box', background: 'rgba(30,41,59,0.9)',
            border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#e2e8f0',
            padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'vertical',
          }} />
        </div>
        <button onClick={predict} disabled={loading} style={{
          width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
          background: loading ? 'rgba(249,115,22,0.3)' : 'linear-gradient(135deg, #f97316, #ef4444)',
          color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Analysing...' : 'Assess Risk'}
        </button>
      </Card>

      <Card title="Risk Assessment Results">
        {!result && !loading && (
          <div style={{ color: '#475569', textAlign: 'center', paddingTop: 60, fontSize: 14 }}>
            Fill in the form and click Assess Risk
          </div>
        )}
        {result?.error && <div style={{ color: '#f87171' }}>{result.error}</div>}
        {result && !result.error && (() => {
          const r = result.recidivism;
          const p = result.priority;
          const rColor = RISK_COLORS[r?.risk_level] || '#6366f1';
          const pColor = RISK_COLORS[p?.priority_level] || '#6366f1';
          const rPct = (r?.recidivism_probability || 0) * 100;
          return (
            <div>
              {/* Recidivism gauge */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 12 }}>RECIDIVISM RISK  —  Logistic Regression</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: `conic-gradient(${rColor} ${rPct * 3.6}deg, rgba(255,255,255,0.05) 0)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: rColor, fontWeight: 800, fontSize: 16 }}>{rPct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <Badge label={r?.risk_level + ' Risk'} color={rColor} />
                    <div style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>Model: {r?.model}</div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: '#94a3b8', fontSize: 13 }}>No Recidivism</span>
                    <span style={{ color: '#10b981', fontSize: 13 }}>{(r?.no_recidivism_probability * 100).toFixed(1)}%</span>
                  </div>
                  <MiniBar value={r?.no_recidivism_probability} color="#10b981" />
                </div>
              </div>

              {/* Priority */}
              <div style={{ padding: 16, background: `rgba(${pColor === '#10b981' ? '16,185,129' : pColor === '#f59e0b' ? '245,158,11' : '239,68,68'},0.1)`, borderRadius: 12, border: `1px solid ${pColor}33` }}>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>INVESTIGATION PRIORITY  —  Gradient Boosting</div>
                <Badge label={p?.priority_level + ' Priority'} color={pColor} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                  {Object.entries(p?.probabilities || {}).map(([lvl, prob]) => (
                    <div key={lvl} style={{ textAlign: 'center' }}>
                      <div style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', marginBottom: 4 }}>{lvl}</div>
                      <div style={{ color: RISK_COLORS[lvl.charAt(0).toUpperCase() + lvl.slice(1)] || '#6366f1', fontSize: 16, fontWeight: 700 }}>{(prob * 100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </Card>
    </div>
  );
}

// ── MO Similarity panel ────────────────────────────────────────────────────
function MOSimilarity() {
  const [textA, setTextA] = useState('Suspect conducted prior surveillance. Planned operation using insider help.');
  const [textB, setTextB] = useState('Evidence of pre-planned operation. Suspect demonstrated local knowledge of the area.');
  const [result, setResult] = useState(null);
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true); setResult(null); setMatches(null);
    try {
      const [simRes, matchRes] = await Promise.all([
        fetch(`${API}/api/ml/mo-similarity`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text_a: textA, text_b: textB }) }).then(r => r.json()),
        fetch(`${API}/api/ml/mo-top-matches`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mo_text: textA, k: 5 }) }).then(r => r.json()),
      ]);
      setResult(simRes); setMatches(matchRes);
    } catch { setResult({ error: 'Request failed' }); }
    setLoading(false);
  };

  const SIM_COLOR = result ? (result.similarity_score > 0.7 ? '#10b981' : result.similarity_score > 0.4 ? '#f59e0b' : '#ef4444') : '#6366f1';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      <Card title="Modus Operandi Similarity">
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>FIR A — Modus Operandi</label>
          <textarea value={textA} onChange={e => setTextA(e.target.value)} rows={4} style={{
            width: '100%', boxSizing: 'border-box', background: 'rgba(30,41,59,0.9)',
            border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#e2e8f0',
            padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'vertical',
          }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 }}>FIR B — Modus Operandi</label>
          <textarea value={textB} onChange={e => setTextB(e.target.value)} rows={4} style={{
            width: '100%', boxSizing: 'border-box', background: 'rgba(30,41,59,0.9)',
            border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#e2e8f0',
            padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'vertical',
          }} />
        </div>
        <button onClick={analyze} disabled={loading} style={{
          width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
          background: loading ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
          color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Analysing...' : 'Compute Similarity'}
        </button>
      </Card>

      <Card title="Similarity Results">
        {!result && !loading && <div style={{ color: '#475569', textAlign: 'center', paddingTop: 60, fontSize: 14 }}>Enter two MO descriptions and click Compute Similarity</div>}
        {result?.error && <div style={{ color: '#f87171' }}>{result.error}</div>}
        {result && !result.error && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 56, fontWeight: 900, color: SIM_COLOR, lineHeight: 1 }}>
                {(result.similarity_score * 100).toFixed(0)}%
              </div>
              <Badge label={result.similarity_label + ' Similarity'} color={SIM_COLOR} />
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>{result.interpretation}</div>
            </div>

            {matches?.top_matches && (
              <div>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>TOP 5 HISTORICALLY SIMILAR FIRs</div>
                {matches.top_matches.map(m => (
                  <div key={m.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#475569', fontSize: 12, width: 20, textAlign: 'right' }}>#{m.rank}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#cbd5e1', fontSize: 13 }}>{m.meta?.fir_id}</div>
                      <div style={{ color: '#64748b', fontSize: 12 }}>{m.meta?.crime_type?.replace(/_/g, ' ')} · Severity {m.meta?.severity_score}</div>
                    </div>
                    <Badge label={`${(m.similarity_score * 100).toFixed(0)}%`} color={SIM_COLOR} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'models',    label: 'Model Overview' },
  { id: 'predictor', label: 'Crime Predictor' },
  { id: 'risk',      label: 'Risk Assessment' },
  { id: 'mo',        label: 'MO Similarity' },
];

export default function MLDashboard() {
  const [tab, setTab] = useState('models');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #0f172a 40%, #0a0a1a 100%)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: '#e2e8f0',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(99,102,241,0.2)', background: 'rgba(10,10,26,0.9)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/dashboard" style={{ color: '#475569', fontSize: 13, textDecoration: 'none' }}>Dashboard</a>
            <span style={{ color: '#334155' }}>/</span>
            <span style={{ color: '#a5b4fc', fontSize: 14, fontWeight: 600 }}>ML Intelligence</span>
          </div>
          <div style={{ color: '#6366f1', fontSize: 20, fontWeight: 800, letterSpacing: 2 }}>CRIMETRYX AI</div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 32px' }}>
        {/* Page title */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, background: 'linear-gradient(135deg, #a5b4fc, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ML Intelligence Layer
          </h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 15, lineHeight: 1.6 }}>
            Four trained models — LSTM, Random Forest, Logistic Regression, Gradient Boosting — working on a 3,000-record synthetic FIR dataset for crime pattern prediction and modus operandi analysis.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 32, background: 'rgba(17,24,39,0.6)', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: tab === t.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
              color: tab === t.id ? '#fff' : '#64748b',
              fontSize: 14, fontWeight: tab === t.id ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'models'    && <ModelMetricsPanel />}
        {tab === 'predictor' && <CrimeTypePredictor />}
        {tab === 'risk'      && <RiskAssessment />}
        {tab === 'mo'        && <MOSimilarity />}
      </div>
    </div>
  );
}
