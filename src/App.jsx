import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function App() {
  // --- 1. Basic Mode & Geometry Variables (5 Inputs + Shape) ---
  const [rpm, setRpm] = useState(3000);
  const [eta0, setEta0] = useState(0.05); 
  const [h0, setH0] = useState(100);      
  const [E, setE] = useState(1e-7);       
  const [radius, setRadius] = useState(150); 
  const [waferShape, setWaferShape] = useState('circle');

  const [timeData, setTimeData] = useState([]);
  const [radialData, setRadialData] = useState([]);
  const [tGel, setTGel] = useState(0);
  const [finalH, setFinalH] = useState(0);

  // --- 2. Challenge Mode Variables (Multi-step Recipe) ---
  const [step1Rpm, setStep1Rpm] = useState(1000);
  const [step1Time, setStep1Time] = useState(10);
  const [step2Rpm, setStep2Rpm] = useState(4000);
  const [step2Time, setStep2Time] = useState(30);
  const [challengeData, setChallengeData] = useState([]);
  const [challengeFinalH, setChallengeFinalH] = useState(0);

  const density = 1000; // PR density (kg/m^3)

  // [Physics Engine 1] 수치해석 vs 해석해 & 에지 비드(Geometry)
  useEffect(() => {
    let h_num = h0 * 1e-6; 
    const dt = 0.5;
    const t_max = 60;
    const omega = rpm * (2 * Math.PI / 60);
    
    let simTimeData = [];
    let gelTime = null;
    let finalThicknessValue = 0;

    // 해석해(Analytical Solution) 상수 K
    const K_ana = (4 * density * Math.pow(omega, 2) * Math.pow(h0 * 1e-6, 2)) / (3 * eta0);

    for (let t = 0; t <= t_max; t += dt) {
      // 1. Numerical Solution (증발 포함)
      let currentViscosity = eta0 * (1 + 0.15 * t); 
      const centrifugalTerm = (2 * density * Math.pow(omega, 2) * Math.pow(h_num, 3)) / (3 * currentViscosity);
      const evapTerm = E; 

      if (centrifugalTerm < evapTerm * 0.05 && gelTime === null) {
        gelTime = t;
      }

      const dh_dt = -centrifugalTerm - evapTerm;
      h_num = h_num + dh_dt * dt;
      if (h_num < 1e-7) h_num = 1e-7;

      // 2. Analytical Solution (순수 원심력 이론값)
      const h_ana = (h0 * 1e-6) / Math.sqrt(1 + K_ana * t);

      simTimeData.push({ 
        time: t, 
        numerical: h_num * 1e6,
        analytical: h_ana * 1e6 
      });
      finalThicknessValue = h_num * 1e6;
    }

    setTimeData(simTimeData);
    setTGel(gelTime || t_max);
    setFinalH(finalThicknessValue);

    // Geometry 기반 반경 방향 두께 프로파일 계산
    let simRadialData = [];
    const capillaryLength = 3; 
    const maxDistance = waferShape === 'circle' ? radius : radius * Math.sqrt(2);

    for (let r = 0; r <= maxDistance; r += maxDistance / 50) {
      let localH = finalThicknessValue; 
      if (r > maxDistance - capillaryLength * 3) {
        const distFromEdge = maxDistance - r;
        const beadMultiplier = waferShape === 'square' ? 1.5 : 0.8; // 사각형 코너에서 더 크게 뭉침
        const beadHeight = finalThicknessValue * beadMultiplier * Math.exp(-distFromEdge / capillaryLength);
        localH += beadHeight;
      }
      simRadialData.push({ radius: Number(r.toFixed(1)), thickness: localH });
    }
    setRadialData(simRadialData);
  }, [rpm, eta0, h0, E, radius, waferShape]);

  // [Physics Engine 2] Challenge Mode (다단계 RPM)
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
      
      h = h + (-centrifugalTerm - E) * dt;
      if (h < 1e-7) h = 1e-7;

      simChallengeData.push({ time: t, rpm: currentRpm, thickness: h * 1e6 });
      finalThicknessValue = h * 1e6;
    }
    setChallengeData(simChallengeData);
    setChallengeFinalH(finalThicknessValue);
  }, [step1Rpm, step1Time, step2Rpm, step2Time, h0, eta0, E]);

  return (
    <div style={{ padding: '30px', fontFamily: 'system-ui, sans-serif', maxWidth: '1100px', margin: '0 auto', backgroundColor: '#fcfcfc' }}>
      
      {/* 🟢 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#0f172a', marginBottom: '5px' }}>Semiconductor Spin Coating Simulator</h1>
        <h3 style={{ color: '#475569', marginTop: 0, fontWeight: 'normal' }}>Thin-Film Uniformity & Process Optimization</h3>
      </div>

      {/* ==========================================
          🟢 SECTION 1: 기본 분석 (변수 5개 + Geometry)
      ========================================== */}
      <div style={{ marginBottom: '50px' }}>
        <h2 style={{ borderBottom: '3px solid #2563eb', paddingBottom: '10px', color: '#1e3a8a' }}>Part 1: Fundamental Analysis & Validation View</h2>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', marginTop: '20px' }}>
          
          <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginTop: 0, color: '#334155' }}>Control Parameters (5 Inputs)</h3>
            
            {/* 누락되었던 5개의 변수를 모두 복구했습니다! */}
            <div style={{ marginBottom: '15px' }}><label>Rotation Speed (RPM): <strong>{rpm}</strong></label><input type="range" min="500" max="6000" step="100" value={rpm} onChange={(e) => setRpm(Number(e.target.value))} style={{ width: '100%' }} /></div>
            <div style={{ marginBottom: '15px' }}><label>Initial Viscosity η₀ (Pa·s): <strong>{eta0.toFixed(3)}</strong></label><input type="range" min="0.01" max="0.2" step="0.01" value={eta0} onChange={(e) => setEta0(Number(e.target.value))} style={{ width: '100%' }} /></div>
            <div style={{ marginBottom: '15px' }}><label>Initial Thickness h₀ (µm): <strong>{h0}</strong></label><input type="range" min="50" max="300" step="10" value={h0} onChange={(e) => setH0(Number(e.target.value))} style={{ width: '100%' }} /></div>
            <div style={{ marginBottom: '15px' }}><label>Evaporation Rate E (m/s): <strong>{E.toExponential(1)}</strong></label><input type="range" min="1e-8" max="5e-7" step="1e-8" value={E} onChange={(e) => setE(Number(e.target.value))} style={{ width: '100%' }} /></div>
            <div style={{ marginBottom: '20px' }}><label>Substrate Size (Radius/Width): <strong>{radius} mm</strong></label><input type="range" min="50" max="200" step="10" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: '100%' }} /></div>
            
            <h4 style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: '5px', color: '#475569', margin: '10px 0' }}>Design Exploration (Geometry Shape)</h4>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setWaferShape('circle')} style={{ flex: 1, padding: '8px', cursor: 'pointer', background: waferShape === 'circle' ? '#2563eb' : '#f1f5f9', color: waferShape === 'circle' ? '#fff' : '#000', border: 'none', borderRadius: '4px' }}>🟢 Circular Wafer</button>
              <button onClick={() => setWaferShape('square')} style={{ flex: 1, padding: '8px', cursor: 'pointer', background: waferShape === 'square' ? '#2563eb' : '#f1f5f9', color: waferShape === 'square' ? '#fff' : '#000', border: 'none', borderRadius: '4px' }}>🟦 Square Substrate</button>
            </div>
          </div>

          <div style={{ flex: 1, backgroundColor: '#eff6ff', padding: '25px', borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>Simulation Predictions</h3>
            <h1 style={{ color: '#2563eb', margin: '15px 0 5px 0', fontSize: '2.5rem' }}>t_gel: {tGel.toFixed(1)} s</h1>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: 0 }}>Gelation time based on centrifugal-evaporative balance.</p>
            <h2 style={{ color: '#0f172a', margin: '20px 0 5px 0', fontSize: '2rem' }}>Final Thickness: {finalH.toFixed(2)} µm</h2>
            <p style={{ color: '#64748b', fontSize: '14px', marginTop: 0 }}>Center-point steady-state film thickness.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Validation View (검증 뷰) */}
          <div style={{ flex: 1, height: 350, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px' }}>
            <h4 style={{ textAlign: 'center', margin: '5px 0 15px 0' }}>Validation View: Numerical vs Analytical</h4>
            <ResponsiveContainer>
              <LineChart data={timeData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" label={{ value: 'Time (s)', position: 'insideBottom', offset: -10 }} />
                <YAxis label={{ value: 'Thickness (µm)', angle: -90, position: 'insideLeft', offset: 15 }} />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Line type="monotone" dataKey="numerical" stroke="#2563eb" strokeWidth={3} dot={false} name="Numerical (with Evap.)" />
                <Line type="dashed" dataKey="analytical" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Analytical (EBP Exact)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* 에지 비드 (Geometry 적용) */}
          <div style={{ flex: 1, height: 350, backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '10px' }}>
            <h4 style={{ textAlign: 'center', margin: '5px 0 15px 0' }}>Radial Profile: {waferShape === 'circle' ? 'Edge Bead' : 'Corner Bead (Diagonal)'}</h4>
            <ResponsiveContainer>
              <AreaChart data={radialData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="radius" label={{ value: 'Distance from Center (mm)', position: 'insideBottom', offset: -10 }} />
                <YAxis domain={['auto', 'auto']} label={{ value: 'Thickness (µm)', angle: -90, position: 'insideLeft', offset: 15 }} />
                <Tooltip />
                <Area type="monotone" dataKey="thickness" stroke="#ea580c" fill="#fdba74" name="Thickness" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ==========================================
          🟢 SECTION 2: 챌린지 모드 (Multi-Step)
      ========================================== */}
      <div style={{ marginTop: '50px', paddingBottom: '50px' }}>
        <h2 style={{ borderBottom: '3px solid #10b981', paddingBottom: '10px', color: '#064e3b' }}>Part 2: Advanced Process Window (Challenge Mode)</h2>
        <p style={{ color: '#475569', fontSize: '15px', marginBottom: '20px' }}>Simulating real-time numerical solutions under dynamic, discontinuous RPM conditions commonly utilized in modern fab environments.</p>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          
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

          <div style={{ flex: 1, backgroundColor: '#ecfdf5', padding: '25px', borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', border: '1px solid #a7f3d0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, color: '#065f46' }}>Dynamic Recipe Results</h3>
            <h1 style={{ color: '#10b981', margin: '15px 0 5px 0', fontSize: '2.5rem' }}>Final Thickness: {challengeFinalH.toFixed(2)} µm</h1>
            <p style={{ color: '#064e3b', fontSize: '15px', lineHeight: '1.5' }}>Observe how the discontinuity in centrifugal force affects the thinning gradient in the real-time simulation below.</p>
          </div>
        </div>

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