import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function App() {
  // --- Basic Mode Variables ---
  const [rpm, setRpm] = useState(3000);
  const [eta0, setEta0] = useState(0.05); // Initial Viscosity
  const [h0, setH0] = useState(100);      // Initial Thickness
  const [E, setE] = useState(1e-7);       // Evaporation Rate
  const [radius, setRadius] = useState(150); // Wafer Radius

  const [timeData, setTimeData] = useState([]);
  const [radialData, setRadialData] = useState([]);
  const [tGel, setTGel] = useState(0);
  const [finalH, setFinalH] = useState(0);

  // --- Challenge Mode Variables (Multi-step Recipe) ---
  const [step1Rpm, setStep1Rpm] = useState(1000);
  const [step1Time, setStep1Time] = useState(10);
  const [step2Rpm, setStep2Rpm] = useState(4000);
  const [step2Time, setStep2Time] = useState(30);
  const [challengeData, setChallengeData] = useState([]);
  const [challengeFinalH, setChallengeFinalH] = useState(0);

  // Physical Constants
  const density = 1000; // PR density (kg/m^3)

  // [Physics Engine 1] Basic Mode Calculation
  useEffect(() => {
    let h = h0 * 1e-6;
    const dt = 0.5;
    const t_max = 60;
    const omega = rpm * (2 * Math.PI / 60);
    let simTimeData = [];
    let gelTime = null;
    let finalThicknessValue = 0;

    for (let t = 0; t <= t_max; t += dt) {
      let currentViscosity = eta0 * (1 + 0.15 * t); 
      const centrifugalTerm = (2 * density * Math.pow(omega, 2) * Math.pow(h, 3)) / (3 * currentViscosity);
      const evapTerm = E; 

      if (centrifugalTerm < evapTerm * 0.05 && gelTime === null) {
        gelTime = t;
      }

      const dh_dt = -centrifugalTerm - evapTerm;
      h = h + dh_dt * dt;
      if (h < 1e-7) h = 1e-7;

      simTimeData.push({ time: t, thickness: h * 1e6 });
      finalThicknessValue = h * 1e6;
    }

    setTimeData(simTimeData);
    setTGel(gelTime || t_max);
    setFinalH(finalThicknessValue);

    // Edge Bead Calculation
    let simRadialData = [];
    const capillaryLength = 3; 
    for (let r = 0; r <= radius; r += radius / 50) {
      let localH = finalThicknessValue; 
      if (r > radius - capillaryLength * 3) {
        const distFromEdge = radius - r;
        const beadHeight = finalThicknessValue * 0.8 * Math.exp(-distFromEdge / capillaryLength);
        localH += beadHeight;
      }
      simRadialData.push({ radius: r, thickness: localH });
    }
    setRadialData(simRadialData);
  }, [rpm, eta0, h0, E, radius]);

  // [Physics Engine 2] Challenge Mode Calculation (Dynamic RPM Profile)
  useEffect(() => {
    let h = h0 * 1e-6;
    const dt = 0.5;
    const totalTime = step1Time + step2Time;
    let simChallengeData = [];
    let finalThicknessValue = 0;

    for (let t = 0; t <= totalTime; t += dt) {
      const currentRpm = t <= step1Time ? step1Rpm : step2Rpm;
      const omega = currentRpm * (2 * Math.PI / 60);
      
      let currentViscosity = eta0 * (1 + 0.15 * t);
      const centrifugalTerm = (2 * density * Math.pow(omega, 2) * Math.pow(h, 3)) / (3 * currentViscosity);
      const dh_dt = -centrifugalTerm - E;

      h = h + dh_dt * dt;
      if (h < 1e-7) h = 1e-7;

      simChallengeData.push({
        time: t,
        rpm: currentRpm,
        thickness: h * 1e6
      });
      finalThicknessValue = h * 1e6;
    }
    setChallengeData(simChallengeData);
    setChallengeFinalH(finalThicknessValue);
  }, [step1Rpm, step1Time, step2Rpm, step2Time, h0, eta0, E]);

  return (
    <div style={{ padding: '30px', fontFamily: 'system-ui, sans-serif', maxWidth: '1100px', margin: '0 auto', backgroundColor: '#fcfcfc' }}>
      
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#0f172a', marginBottom: '5px' }}>Semiconductor Spin Coating Simulator</h1>
        <h3 style={{ color: '#475569', marginTop: 0, fontWeight: 'normal' }}>Thin-Film Uniformity & Process Optimization</h3>
      </div>

      {/* ==========================================
          SECTION 1: BASIC ANALYSIS MODE
      ========================================== */}
      <div style={{ marginBottom: '50px' }}>
        <h2 style={{ borderBottom: '3px solid #2563eb', paddingBottom: '10px', color: '#1e3a8a' }}>Part 1: Fundamental Analysis (Meyerhofer Model)</h2>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', marginTop: '20px' }}>
          
          {/* Inputs */}
          <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, color: '#334155' }}>Control Parameters (Inputs)</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '14px', color: '#475569' }}>Rotation Speed (RPM): <strong style={{ color: '#000' }}>{rpm}</strong></label>
              <input type="range" min="500" max="6000" step="100" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} style={{ width: '100%', marginTop: '5px' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '14px', color: '#475569' }}>Initial Viscosity η₀ (Pa·s): <strong style={{ color: '#000' }}>{eta0.toFixed(3)}</strong></label>
              <input type="range" min="0.01" max="0.2" step="0.01" value={eta0} onChange={(e) => setEta0(Number(e.target.value))} style={{ width: '100%', marginTop: '5px' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '14px', color: '#475569' }}>Initial Thickness h₀ (µm): <strong style={{ color: '#000' }}>{h0}</strong></label>
              <input type="range" min="50" max="300" step="10" value={h0} onChange={(e) => setH0(Number(e.target.value))} style={{ width: '100%', marginTop: '5px' }} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '14px', color: '#475569' }}>Evaporation Rate E (m/s): <strong style={{ color: '#000' }}>{E.toExponential(1)}</strong></label>
              <input type="range" min="1e-8" max="5e-7" step="1e-8" value={E} onChange={(e) => setE(Number(e.target.value))} style={{ width: '100%', marginTop: '5px' }} />
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#475569' }}>Wafer Radius (mm): <strong style={{ color: '#000' }}>{radius}</strong></label>
              <input type="range" min="50" max="200" step="10" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: '100%', marginTop: '5px' }} />
            </div>
          </div>

          {/* Outputs */}
          <div style={{ flex: 1, backgroundColor: '#eff6ff', padding: '25px', borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>Simulation Predictions (Outputs)</h3>
            
            <h1 style={{ color: '#2563eb', margin: '15px 0 5px 0', fontSize: '2rem' }}>t_gel: {tGel.toFixed(1)} s</h1>
            <p style={{ color: '#64748b', fontSize: '15px', marginTop: 10, lineHeight: '1.4' }}>Gelation time: The critical point where radial fluid flow ceases and evaporation becomes the absolute dominant factor.</p>
            
            <h2 style={{ color: '#0f172a', margin: '25px 0 5px 0', fontSize: '1.5rem' }}>Final Thickness: {finalH.toFixed(2)} µm</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: 0 }}>Steady-state uniform film thickness at the geometric center of the wafer.</p>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, height: 320, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h4 style={{ textAlign: 'center', margin: '5px 0 15px 0', color: '#334155' }}>Film Thickness Evolution h(t)</h4>
            <ResponsiveContainer>
              <LineChart data={timeData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" label={{ value: 'Time (s)', position: 'insideBottom', offset: -10 }} />
                <YAxis label={{ value: 'Thickness (µm)', angle: -90, position: 'insideLeft', offset: 15 }} />
                <Tooltip />
                <Line type="monotone" dataKey="thickness" stroke="#2563eb" strokeWidth={3} dot={false} name="Thickness (µm)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ flex: 1, height: 320, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h4 style={{ textAlign: 'center', margin: '5px 0 15px 0', color: '#334155' }}>Radial Thickness Profile h(r) - Edge Bead</h4>
            <ResponsiveContainer>
              <AreaChart data={radialData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="radius" label={{ value: 'Radial Position (mm)', position: 'insideBottom', offset: -10 }} />
                <YAxis domain={['auto', 'auto']} label={{ value: 'Thickness (µm)', angle: -90, position: 'insideLeft', offset: 15 }} />
                <Tooltip />
                <Area type="monotone" dataKey="thickness" stroke="#ea580c" fill="#fdba74" name="Thickness Profile" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ==========================================
          SECTION 2: CHALLENGE MODE (MULTI-STEP)
      ========================================== */}
      <div style={{ marginTop: '50px' }}>
        <h2 style={{ borderBottom: '3px solid #10b981', paddingBottom: '10px', color: '#064e3b' }}>Part 2: Advanced Process Window (Challenge Mode)</h2>
        <p style={{ color: '#475569', fontSize: '15px', marginBottom: '20px' }}>Simulating real-time numerical solutions under dynamic, discontinuous RPM conditions commonly utilized in modern fab environments.</p>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          
          {/* Challenge Inputs */}
          <div style={{ flex: 1, backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '10px', border: '1px solid #a7f3d0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#065f46' }}>Multi-Step Recipe Settings</h3>
            
            <div style={{ borderBottom: '1px dashed #6ee7b7', paddingBottom: '15px', marginBottom: '15px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#059669' }}>Step 1: PR Dispense & Initial Spread</h4>
              <label style={{ fontSize: '14px', color: '#064e3b' }}>Step 1 RPM: <strong>{step1Rpm}</strong></label>
              <input type="range" min="300" max="2000" step="100" value={step1Rpm} onChange={(e) => setStep1Rpm(Number(e.target.value))} style={{ width: '100%', marginBottom: '10px', marginTop: '5px' }} />
              <label style={{ fontSize: '14px', color: '#064e3b' }}>Step 1 Duration (s): <strong>{step1Time}</strong></label>
              <input type="range" min="5" max="20" step="1" value={step1Time} onChange={(e) => setStep1Time(Number(e.target.value))} style={{ width: '100%', marginTop: '5px' }} />
            </div>
            
            <div>
              <h4 style={{ margin: '0 0 10px 0', color: '#059669' }}>Step 2: Main Spin (High-Speed Thinning)</h4>
              <label style={{ fontSize: '14px', color: '#064e3b' }}>Step 2 RPM: <strong>{step2Rpm}</strong></label>
              <input type="range" min="2000" max="6000" step="100" value={step2Rpm} onChange={(e) => setStep2Rpm(Number(e.target.value))} style={{ width: '100%', marginBottom: '10px', marginTop: '5px' }} />
              <label style={{ fontSize: '14px', color: '#064e3b' }}>Step 2 Duration (s): <strong>{step2Time}</strong></label>
              <input type="range" min="10" max="50" step="1" value={step2Time} onChange={(e) => setStep2Time(Number(e.target.value))} style={{ width: '100%', marginTop: '5px' }} />
            </div>
          </div>

          {/* Challenge Outputs */}
          <div style={{ flex: 1, backgroundColor: '#ecfdf5', padding: '25px', borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid #a7f3d0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#065f46' }}>Dynamic Recipe Results</h3>
            <h1 style={{ color: '#10b981', margin: '15px 0 5px 0', fontSize: '1.75rem' }}>Final Thickness: {challengeFinalH.toFixed(2)} µm</h1>
            <p style={{ color: '#064e3b', fontSize: '15px', lineHeight: '1.5' }}>Observe how the discontinuity in centrifugal force (due to the sudden step-change in angular velocity) affects the thinning gradient in the real-time simulation below.</p>
          </div>
        </div>

        {/* Challenge Chart */}
        <div style={{ height: 400, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <h4 style={{ textAlign: 'center', margin: '5px 0 15px 0', color: '#334155' }}>Real-Time Thickness Decay under Multi-Step RPM Profile</h4>
          <ResponsiveContainer>
            <LineChart data={challengeData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="time" label={{ value: 'Time (s)', position: 'insideBottom', offset: -10 }} />
              <YAxis yAxisId="left" label={{ value: 'Thickness (µm)', angle: -90, position: 'insideLeft', offset: 15 }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Angular Velocity (RPM)', angle: 90, position: 'insideRight', offset: 0 }} />
              <Tooltip />
              <Legend verticalAlign="top" height={36}/>
              <Line yAxisId="left" type="monotone" dataKey="thickness" stroke="#10b981" strokeWidth={3} dot={false} name="Film Thickness (µm)" />
              <Line yAxisId="right" type="stepAfter" dataKey="rpm" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Real-Time RPM" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}