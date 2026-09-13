import React, { useState, useEffect } from 'react';

export default function KinematicsPlayerView({ sessionMeta, showToast }) {
  const patientName = sessionMeta?.patientName || 'Marcus Chen';
  const sessionNo = sessionMeta?.sessionNo || '34';

  const [isPlaying, setIsPlaying] = useState(false);
  const [isSlowMo, setIsSlowMo] = useState(false);
  const [playheadPos, setPlayheadPos] = useState(52); // percentage
  const [selectedRep, setSelectedRep] = useState(4);
  const [reviewDecision, setReviewDecision] = useState('Acceptable with compensation note');
  const [reviewCorrection, setReviewCorrection] = useState('Reinforce scapular retraction before overhead drive');
  const [reviewNotes, setReviewNotes] = useState('Patient exhibits mild fatigue in left shoulder past rep 3.');
  const [reviewSaved, setReviewSaved] = useState(false);

  // Playback timer simulation
  useEffect(() => {
    let interval;
    if (isPlaying) {
      const step = isSlowMo ? 0.4 : 1.2;
      interval = setInterval(() => {
        setPlayheadPos((prev) => {
          if (prev >= 100) return 0;
          return prev + step;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isSlowMo]);

  const handleSaveReview = (e) => {
    e.preventDefault();
    setReviewSaved(true);
    showToast(`Kinematic review saved for Session #${sessionNo}`, 'verified');
  };

  const reps = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 gap-5">
      {/* Session Quick Meta Header */}
      <section className="bg-surface-container-low rounded-xl p-5 shadow-sm border border-surface-container flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-label-mono text-xs text-tertiary uppercase font-semibold">
              TrueDepth 60fps Tracked
            </span>
          </div>
          <span className="font-label-mono text-xs text-on-surface-variant">
            Today, 08:42 AM
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-surface font-bold truncate">
              {patientName}
            </h1>
            <p className="font-body-sm text-xs text-on-surface-variant truncate">
              Session #{sessionNo} • Overhead Shoulder Press (Bilateral)
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container-high text-on-surface px-3 py-1.5 rounded-lg shrink-0 border border-surface-container">
            <span className="material-symbols-outlined text-[18px] text-primary">analytics</span>
            <span className="font-badge text-xs font-bold">REV-{sessionNo}</span>
          </div>
        </div>
      </section>

      {/* Kinematic Biomechanical Player Canvas Area */}
      <section className="relative w-full rounded-2xl bg-[#071322] text-inverse-on-surface overflow-hidden shadow-lg border border-[#1e293b]">
        <div className="relative w-full h-80 sm:h-96 bg-[#071322] flex items-center justify-center overflow-hidden select-none">
          {/* Simulated Depth Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-transparent to-black/80 pointer-events-none"></div>

          {/* Real Patient Frame Background Image */}
          <img
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
            alt="Patient kinematic recording"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuARz49IigpCiIbhLlhsahf7gr94H5jcuXggqtAaJa956nsqxYShR6GsGEOKkhtHjpJH9vRrU6ZebHB6uzlO6guQf8WVF3hhm6h0MZ35BmQtaGZTYlct7oRsWYQl9B3H2Po5WAiFkQAOUaM-bH1qV8jRfvEawAoccAcPqusEGGGP-EJsZgiYUtjX97SE01Egs2H-ACCf3oOoMKXdhEUMqaJRxcHhzbZyU7TN_x-q17f7WtKejZBSNVV_"
          />

          {/* Real-time SVG Skeletal & Kinematic Angle Vector Overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" fill="none" viewBox="0 0 390 320" preserveAspectRatio="xMidYMid meet">
            {/* Depth Grid Lines */}
            <line stroke="#93ccff" strokeDasharray="3 3" strokeOpacity="0.12" x1="20" x2="370" y1="160" y2="160" />
            <line stroke="#93ccff" strokeDasharray="3 3" strokeOpacity="0.12" x1="195" x2="195" y1="30" y2="290" />

            {/* Lumbar Base & Spine */}
            <circle cx="195" cy="245" fill="#4cd7f6" r="4.5" />
            <line stroke="#4cd7f6" strokeLinecap="round" strokeWidth="2.5" x1="195" x2="195" y1="245" y2="155" />
            <circle cx="195" cy="155" fill="#4cd7f6" r="4" />

            {/* Neck to Head */}
            <line stroke="#4cd7f6" strokeWidth="2" x1="195" x2="195" y1="155" y2="115" />
            <circle cx="195" cy="100" fill="none" r="10" stroke="#4cd7f6" strokeWidth="2" />

            {/* Shoulder Girdle Clavicle Bar */}
            <line stroke="#4cd7f6" strokeLinecap="round" strokeWidth="2.5" x1="135" x2="255" y1="158" y2="158" />

            {/* Right Arm Chain (Patient Right / Screen Left) */}
            <line stroke="#4cd7f6" strokeLinecap="round" strokeWidth="3" x1="135" x2="90" y1="158" y2="110" />
            <line stroke="#acedff" strokeLinecap="round" strokeWidth="2.5" x1="90" x2="98" y1="110" y2="48" />
            <circle cx="135" cy="158" fill="#acedff" r="5" stroke="#006194" strokeWidth="1.5" />
            <circle cx="90" cy="110" fill="#ffffff" r="5.5" stroke="#4cd7f6" strokeWidth="2" />
            <circle cx="98" cy="48" fill="#acedff" r="4" />

            {/* Left Arm Chain (Flagged Compensation Angle) */}
            <line stroke="#ffdad6" strokeLinecap="round" strokeWidth="3" x1="255" x2="296" y1="158" y2="124" />
            <line stroke="#ffdad6" strokeDasharray="2 2" strokeLinecap="round" strokeWidth="2.5" x1="296" x2="282" y1="124" y2="62" />
            <circle cx="255" cy="158" fill="#ba1a1a" r="5" stroke="#ffffff" strokeWidth="1.5" />
            <circle cx="296" cy="124" fill="#ffffff" r="5.5" stroke="#ba1a1a" strokeWidth="2" />
            <circle cx="282" cy="62" fill="#ffdad6" r="4" />

            {/* Arc Angle Overlay on Right Shoulder */}
            <path d="M 135 138 A 20 20 0 0 1 120 152" fill="none" stroke="#4cd7f6" strokeWidth="2" />
            <text fill="#4cd7f6" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="600" x="76" y="145">164°</text>

            {/* Arc Angle Overlay on Left Shoulder (Flagged Asymmetry) */}
            <path d="M 255 138 A 20 20 0 0 0 273 150" fill="none" stroke="#ffdad6" strokeWidth="2" />
            <text fill="#ffdad6" fontFamily="'JetBrains Mono', monospace" fontSize="11" fontWeight="600" x="270" y="142">151°</text>

            {/* Pelvic Tilt Compensation Indicator */}
            <path d="M 180 248 Q 195 240 210 248" fill="none" stroke="#ffdad6" strokeDasharray="2 2" strokeWidth="2" />
            <text fill="#ffdad6" fontFamily="'Inter', sans-serif" fontSize="9" x="216" y="252">Lordosis +4°</text>
          </svg>

          {/* Live Floating HUD Top Bar */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="bg-[#0b1c30]/85 backdrop-blur-md px-3 py-1 rounded-lg flex items-center gap-2 shadow-sm border border-white/10">
              <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
              <span className="font-label-mono text-xs text-white">Rep {selectedRep}/8</span>
              <span className="font-label-mono text-xs text-white/40">•</span>
              <span className="font-label-mono text-xs text-tertiary-fixed font-semibold">
                {playheadPos > 50 && playheadPos < 70 ? 'Peak Concentric' : playheadPos <= 50 ? 'Concentric Lift' : 'Eccentric Descent'}
              </span>
            </div>
            <div className="bg-[#0b1c30]/85 backdrop-blur-md px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm border border-white/10">
              <span className="material-symbols-outlined text-[15px] text-tertiary-fixed">verified</span>
              <span className="font-label-mono text-xs text-white">98.4% Conf</span>
            </div>
          </div>

          {/* Live Biomechanical Angle Banner Floating on Player */}
          <div className="absolute bottom-3 left-3 right-3 bg-[#0b1c30]/90 backdrop-blur-md rounded-xl p-3 flex items-center justify-between shadow-sm border border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-label-mono text-[9px] text-white/60 leading-none uppercase">R-SHOULDER</span>
                <span className="font-display-metric text-base text-tertiary-fixed font-bold leading-tight">164°</span>
              </div>
              <div className="h-6 w-[1px] bg-white/20"></div>
              <div className="flex flex-col">
                <span className="font-label-mono text-[9px] text-white/60 leading-none uppercase">L-SHOULDER</span>
                <span className="font-display-metric text-base text-error-container font-bold leading-tight">151°</span>
              </div>
            </div>
            <div className="bg-error-container text-on-error-container px-2.5 py-1 rounded-md flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              <span className="font-label-mono text-[10px] font-bold">ASYM: 7.9%</span>
            </div>
          </div>
        </div>

        {/* Timeline & Playback Scrub Chrome */}
        <div className="bg-[#0b1c30] px-5 py-4 flex flex-col gap-2 select-none border-t border-white/10">
          {/* Scrub Bar with Color-Coded Kinematic Phases */}
          <div className="flex flex-col gap-1 w-full">
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pos = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                setPlayheadPos(pos);
              }}
              className="relative w-full h-3.5 bg-surface-variant/20 rounded-full overflow-hidden flex cursor-pointer"
            >
              {/* Phase 1: Setup / Isometric (Blue) */}
              <div className="h-full bg-primary" style={{ width: '18%' }} title="Phase 1: Setup (ISO)"></div>
              {/* Phase 2: Concentric Lift (Green/Tertiary) */}
              <div className="h-full bg-tertiary-container" style={{ width: '34%' }} title="Phase 2: Concentric (CONC)"></div>
              {/* Phase 3: Peak Hold (Cyan) */}
              <div className="h-full bg-tertiary-fixed-dim" style={{ width: '18%' }} title="Phase 3: Peak Hold (PEAK)"></div>
              {/* Phase 4: Eccentric Lowering (Amber) */}
              <div className="h-full bg-[#f59e0b]" style={{ width: '30%' }} title="Phase 4: Eccentric Lowering (ECCN)"></div>

              {/* Playhead Needle */}
              <div
                className="absolute top-0 bottom-0 w-1.5 bg-white rounded-full shadow-[0_0_8px_#ffffff] transition-all"
                style={{ left: `${playheadPos}%` }}
              ></div>
            </div>

            {/* Micro Phase Labels */}
            <div className="flex justify-between font-label-mono text-[10px] text-white/50 pt-0.5">
              <span className="text-primary-fixed">ISO (0.0-0.4s)</span>
              <span className="text-tertiary-fixed">CONC (0.4-1.2s)</span>
              <span className="text-tertiary-fixed-dim font-bold">PEAK (1.2-1.6s)</span>
              <span className="text-[#fcd34d]">ECCN (1.6-2.4s)</span>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPlayheadPos((p) => Math.max(0, p - 10))}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                title="Step Backward"
              >
                <span className="material-symbols-outlined text-[18px]">skip_previous</span>
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center shadow-md active:scale-95 transition-transform hover:bg-primary-container"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPlayheadPos((p) => Math.min(100, p + 10))}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                title="Step Forward"
              >
                <span className="material-symbols-outlined text-[18px]">skip_next</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSlowMo(!isSlowMo)}
                className={`px-2.5 py-1 rounded font-label-mono text-[11px] font-bold transition-colors ${
                  isSlowMo ? 'bg-secondary text-white' : 'bg-white/10 text-white/70 hover:text-white'
                }`}
              >
                0.5x SLOW
              </button>
              <span className="font-label-mono text-xs text-white">
                <span className="text-tertiary-fixed">
                  0{Math.floor((playheadPos * 2.4) / 60)}:{String(Math.floor((playheadPos * 2.4) % 60)).padStart(2, '0')}
                </span>{' '}
                / 02:40
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Repetition Selector Well */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-base font-bold text-on-surface">Repetition Log</h2>
          <span className="font-label-mono text-xs text-error font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-error"></span> 1 Flagged Compensatory
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
          {reps.map((rep) => {
            const isFlagged = rep === 4;
            const isSel = selectedRep === rep;
            return (
              <button
                key={rep}
                type="button"
                onClick={() => setSelectedRep(rep)}
                className={`px-3.5 py-2 rounded-xl font-label-mono text-xs shrink-0 transition-all flex items-center gap-1.5 ${
                  isFlagged
                    ? isSel
                      ? 'bg-error text-white font-bold shadow-sm ring-2 ring-error/40'
                      : 'bg-error-container text-on-error-container font-semibold'
                    : isSel
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {isFlagged && <span className="material-symbols-outlined text-[14px]">flag</span>}
                Rep {rep}
              </button>
            );
          })}
        </div>
      </section>

      {/* Diagnostic Cards Grid for Selected Rep */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Card 1: End-Range ROM Target vs Actual Deficit */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container flex flex-col gap-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">straighten</span>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">End-Range ROM Deficit</h3>
            </div>
            <span className="bg-error-container text-on-error-container font-badge text-xs px-2.5 py-0.5 rounded-full font-bold">
              -17° Deficit
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="font-label-mono text-xs text-on-surface-variant uppercase">Left Arm Peak</span>
              <div className="font-display-metric text-3xl text-error font-bold">148°</div>
            </div>
            <div className="text-right">
              <span className="font-label-mono text-xs text-on-surface-variant uppercase">Target Protocol</span>
              <div className="font-display-metric text-2xl text-on-surface font-bold">165°</div>
            </div>
          </div>

          {/* Custom Track Indicator */}
          <div className="relative w-full h-3.5 bg-surface-container-high rounded-full overflow-hidden mt-1">
            <div className="h-full bg-error rounded-full transition-all" style={{ width: '78%' }}></div>
            <div className="absolute top-0 bottom-0 left-[88%] w-1 bg-secondary rounded-full" title="Target: 165°"></div>
          </div>
          <div className="flex items-center justify-between font-label-mono text-xs text-on-surface-variant">
            <span>Current: 148° (Sub-target end-range)</span>
            <span className="text-secondary font-semibold">Baseline: 165°</span>
          </div>
        </div>

        {/* Card 2: Tempo Cadence */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-sm text-on-surface font-semibold">Tempo Cadence</span>
            <span className="material-symbols-outlined text-[18px] text-error">speed</span>
          </div>
          <div className="my-2">
            <div className="font-display-metric text-2xl text-error font-bold tracking-tight">
              1.4 · 0.5 · 1.1s
            </div>
            <p className="font-label-mono text-xs text-on-surface-variant mt-0.5">
              Target: 3.0 · 1.0 · 2.0s
            </p>
          </div>
          <span className="bg-error-container text-on-error-container font-label-mono text-xs px-2 py-0.5 rounded font-semibold w-max">
            Rush in Eccentric
          </span>
        </div>

        {/* Card 3: Symmetry Index */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-sm text-on-surface font-semibold">Symmetry Index</span>
            <span className="material-symbols-outlined text-[18px] text-primary">balance</span>
          </div>
          <div className="my-2">
            <div className="font-display-metric text-2xl text-primary font-bold">86%</div>
            <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden flex mt-1.5">
              <div className="h-full bg-primary" style={{ width: '58%' }} title="Right Arm Dominant"></div>
              <div className="h-full bg-surface-variant" style={{ width: '42%' }} title="Left Arm Deficit"></div>
            </div>
          </div>
          <span className="font-label-mono text-xs text-on-surface-variant">
            Right arm dominant (58% / 42%)
          </span>
        </div>
      </section>

      {/* Clinician Review Submission Card */}
      <section className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-[22px]">clinical_notes</span>
          <h2 className="font-headline-sm text-base font-bold text-on-surface">Clinician Assessment & Override</h2>
        </div>

        <form onSubmit={handleSaveReview} className="space-y-3">
          <div>
            <label className="font-label-md text-xs text-on-surface-variant block mb-1 font-semibold">
              Clinical Decision
            </label>
            <input
              type="text"
              value={reviewDecision}
              onChange={(e) => setReviewDecision(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-container rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              placeholder="e.g. Acceptable with compensation"
            />
          </div>

          <div>
            <label className="font-label-md text-xs text-on-surface-variant block mb-1 font-semibold">
              Correction Guidance
            </label>
            <input
              type="text"
              value={reviewCorrection}
              onChange={(e) => setReviewCorrection(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-container rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary"
              placeholder="e.g. Reduce band resistance"
            />
          </div>

          <div>
            <label className="font-label-md text-xs text-on-surface-variant block mb-1 font-semibold">
              Clinical Notes
            </label>
            <textarea
              rows="2"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-container rounded-lg px-3 py-2 text-sm text-on-surface focus:outline-none focus:border-primary resize-none"
              placeholder="Additional observational notes..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg bg-primary text-on-primary font-label-md text-sm font-semibold flex items-center justify-center gap-2 shadow-sm hover:bg-primary-container transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{reviewSaved ? 'Review Saved • Synced' : 'Submit & Save Review'}</span>
          </button>
        </form>
      </section>
    </div>
  );
}
