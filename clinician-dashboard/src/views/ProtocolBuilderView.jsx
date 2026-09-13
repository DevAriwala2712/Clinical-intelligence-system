import React, { useState } from 'react';

export default function ProtocolBuilderView({ showToast }) {
  const [activeTab, setActiveTab] = useState('builder'); // 'catalog' or 'builder'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Protocol specs
  const [selectedExercise, setSelectedExercise] = useState({
    name: 'Terminal Knee Extension',
    tag: 'Active Focus',
    subtext: 'Right Knee (Post-Surgical Anterior Axis)',
    plane: 'Sagittal',
  });

  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [holdSec, setHoldSec] = useState(3);
  const [restSec, setRestSec] = useState(60);
  const [bandColor, setBandColor] = useState('Medium Red (15-20 lbs)');

  // ML Gating Criteria
  const [romMin, setRomMin] = useState(0);
  const [romMax, setRomMax] = useState(115);
  const [weightRom, setWeightRom] = useState(45);
  const [weightTempo, setWeightTempo] = useState(30);
  const [weightComp, setWeightComp] = useState(25);

  const [tempoConc, setTempoConc] = useState(1.5);
  const [tempoEcc, setTempoEcc] = useState(3.0);
  const [valgusLimit, setValgusLimit] = useState(4.0);

  const exercises = [
    {
      id: 'tke',
      name: 'Terminal Knee Extension (TKE)',
      focus: 'Lower Extremity',
      tag: 'Active Focus',
      subtext: 'Closed-chain quad isolation with elastic band overload',
      plane: 'Sagittal',
    },
    {
      id: 'split-squat',
      name: 'Single-Leg Bulgarian Split Squat',
      focus: 'Lower Extremity',
      tag: 'Strength & Balance',
      subtext: 'Unilateral load, depth validation at 90° knee flexion',
      plane: 'Frontal / Sagittal',
    },
    {
      id: 'rdl',
      name: 'Romanian Deadlift (Eccentric)',
      focus: 'Hamstring Deceleration',
      tag: 'Hamstring Decel',
      subtext: '4s tempo descent with pelvic level alignment scoring',
      plane: 'Sagittal',
    },
    {
      id: 'side-plank',
      name: 'Side Plank with Hip Abduction',
      focus: 'Proprioception',
      tag: 'Coronal Stability',
      subtext: 'Coronal stability with valgus anti-compensation gating',
      plane: 'Coronal',
    },
  ];

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ex.subtext.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'All' || ex.focus === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleSaveProtocol = () => {
    showToast(`Deployed updated criteria for ${selectedExercise.name} to patient sensor`, 'verified');
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 gap-5">
      {/* Dynamic Notification / Top Protocol Draft Banner */}
      <section className="bg-surface-container-high text-on-surface rounded-2xl p-5 shadow-sm border border-surface-container">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">clinical_notes</span>
            <span className="font-label-mono text-xs uppercase tracking-wider text-primary font-bold">
              Protocol Draft v2.1
            </span>
          </div>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-badge text-xs font-semibold">
            Draft Active
          </span>
        </div>
        <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-surface font-bold tracking-tight">
          Phase 3 Knee Stabilization
        </h1>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <p className="font-body-sm text-xs text-on-surface-variant font-semibold">Elena Rostova</p>
          </div>
          <span className="text-outline-variant">•</span>
          <span className="font-label-md text-xs text-on-surface-variant">Post-Op ACL (Day 45)</span>
        </div>
      </section>

      {/* Segmented Controller Tabs */}
      <section className="bg-surface-container-low p-1.5 rounded-2xl flex items-center shadow-sm border border-surface-container">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-label-md text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'catalog'
              ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">library_add</span>
          <span>Catalog ({exercises.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-label-md text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'builder'
              ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
          <span>ML Criteria Engine</span>
          <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
        </button>
      </section>

      {/* View 1: Catalog Selection Drawer */}
      {activeTab === 'catalog' && (
        <section className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest text-on-surface placeholder-on-surface-variant/60 font-body-sm text-sm rounded-xl shadow-sm border border-surface-container focus:outline-none focus:border-primary transition-colors"
              placeholder="Search kinematics (e.g., Squat, ROM, Extension)..."
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
            {['All', 'Lower Extremity', 'Hamstring Deceleration', 'Proprioception'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-full font-label-md text-xs whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Catalog Exercise List */}
          <div className="space-y-3">
            {filteredExercises.map((ex) => {
              const isSelected = selectedExercise.name.includes(ex.name) || ex.name.includes(selectedExercise.name);
              return (
                <div
                  key={ex.id}
                  className={`bg-surface-container-lowest p-4 rounded-xl shadow-sm border transition-all relative overflow-hidden flex items-center justify-between gap-3 ${
                    isSelected ? 'border-primary ring-1 ring-primary/30' : 'border-surface-container'
                  }`}
                >
                  {isSelected && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary"></div>}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-primary-fixed text-on-primary-fixed font-badge text-xs px-2 py-0.5 rounded font-semibold">
                        {ex.tag}
                      </span>
                      <span className="font-label-mono text-xs text-tertiary">
                        ML Tracked: {ex.plane}
                      </span>
                    </div>
                    <h2 className="font-headline-sm text-base font-bold text-on-surface">{ex.name}</h2>
                    <p className="font-body-sm text-xs text-on-surface-variant">{ex.subtext}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedExercise(ex);
                      setActiveTab('builder');
                      showToast(`Selected ${ex.name} for ML Criteria calibration`, 'tune');
                    }}
                    className="bg-surface-container text-primary p-2.5 rounded-xl hover:bg-primary hover:text-white transition-all shrink-0 flex items-center gap-1 font-label-md text-xs font-semibold"
                  >
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                    <span className="hidden sm:inline">Calibrate</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* View 2: Active Protocol & ML Criteria Engine */}
      {activeTab === 'builder' && (
        <section className="space-y-4">
          {/* Active Selected Exercise Card */}
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container">
            <div className="flex items-center justify-between mb-2">
              <span className="font-label-mono text-xs text-tertiary flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">sensors</span>
                Vision Pipeline: 60 FPS On-Device
              </span>
              <button
                onClick={() => setActiveTab('catalog')}
                className="text-primary font-label-md text-xs font-semibold flex items-center gap-1 hover:underline"
              >
                <span>Change Exercise</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[26px]">accessibility_new</span>
              </div>
              <div>
                <h2 className="font-headline-sm text-lg font-bold text-on-surface leading-tight">
                  {selectedExercise.name}
                </h2>
                <p className="font-body-sm text-xs text-on-surface-variant">
                  Right Knee (Post-Surgical Anterior Axis)
                </p>
              </div>
            </div>

            {/* Prescribed Volume & Load Form Grid */}
            <div className="mt-4 pt-2 bg-surface-container-low p-4 rounded-xl border border-surface-container">
              <span className="font-label-mono text-xs uppercase text-on-surface-variant block mb-2.5 font-bold">
                Dosage & Volume Specifications
              </span>
              <div className="grid grid-cols-4 gap-2.5 text-center">
                <div className="bg-surface-container-lowest p-2.5 rounded-lg shadow-sm border border-surface-container">
                  <span className="font-label-mono text-[11px] text-on-surface-variant block">Sets</span>
                  <input
                    type="number"
                    value={sets}
                    onChange={(e) => setSets(Number(e.target.value))}
                    className="w-full text-center font-display-metric text-xl font-bold text-on-surface bg-transparent focus:outline-none"
                  />
                </div>
                <div className="bg-surface-container-lowest p-2.5 rounded-lg shadow-sm border border-surface-container">
                  <span className="font-label-mono text-[11px] text-on-surface-variant block">Reps</span>
                  <input
                    type="number"
                    value={reps}
                    onChange={(e) => setReps(Number(e.target.value))}
                    className="w-full text-center font-display-metric text-xl font-bold text-on-surface bg-transparent focus:outline-none"
                  />
                </div>
                <div className="bg-surface-container-lowest p-2.5 rounded-lg shadow-sm border border-surface-container">
                  <span className="font-label-mono text-[11px] text-on-surface-variant block">Hold (s)</span>
                  <input
                    type="number"
                    value={holdSec}
                    onChange={(e) => setHoldSec(Number(e.target.value))}
                    className="w-full text-center font-display-metric text-xl font-bold text-on-surface bg-transparent focus:outline-none"
                  />
                </div>
                <div className="bg-surface-container-lowest p-2.5 rounded-lg shadow-sm border border-surface-container">
                  <span className="font-label-mono text-[11px] text-on-surface-variant block">Rest (s)</span>
                  <input
                    type="number"
                    value={restSec}
                    onChange={(e) => setRestSec(Number(e.target.value))}
                    className="w-full text-center font-display-metric text-xl font-bold text-on-surface bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-3 bg-surface-container-lowest p-3 rounded-lg shadow-sm border border-surface-container flex items-center justify-between">
                <span className="font-label-md text-xs text-on-surface-variant font-semibold">Band Resistance:</span>
                <select
                  value={bandColor}
                  onChange={(e) => setBandColor(e.target.value)}
                  className="bg-surface-container font-label-mono text-xs font-semibold text-on-surface px-2.5 py-1 rounded-md border-none focus:outline-none"
                >
                  <option>Light Yellow (8-12 lbs)</option>
                  <option>Medium Red (15-20 lbs)</option>
                  <option>Heavy Blue (25-30 lbs)</option>
                  <option>Extra-Heavy Silver (35+ lbs)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Advanced ML Calibrated Criteria */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">smart_toy</span>
                <h2 className="font-headline-sm text-base font-bold text-on-surface">ML Kinematic Gating Criteria</h2>
              </div>
              <span className="bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full font-badge text-xs font-semibold">
                3 Gated Metrics
              </span>
            </div>
            <p className="font-body-sm text-xs text-on-surface-variant">
              Threshold tolerances for on-device machine learning evaluation and rep auto-validation.
            </p>

            {/* Metric 1: ROM Range */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-primary-fixed text-primary flex items-center justify-center font-label-mono text-xs font-bold">
                    M1
                  </span>
                  <div>
                    <h3 className="font-headline-sm text-sm font-bold text-on-surface">Range of Motion (ROM)</h3>
                    <p className="font-label-mono text-xs text-on-surface-variant">Sagittal Knee Angle Envelope</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-display-metric text-xl text-primary font-bold">
                    {romMin}° - {romMax}°
                  </span>
                  <span className="block font-label-mono text-[10px] text-on-surface-variant uppercase">Target Envelope</span>
                </div>
              </div>

              {/* Dual-Handle Slider Simulator */}
              <div className="pt-3 pb-1">
                <div className="relative w-full h-8 flex items-center">
                  <div className="absolute inset-x-0 h-2 bg-surface-container rounded-full"></div>
                  <div
                    className="absolute h-2 bg-primary/30 rounded-full"
                    style={{ left: `${(romMin / 140) * 100}%`, right: `${100 - (romMax / 140) * 100}%` }}
                  ></div>
                  <div
                    className="absolute right-0 h-2 bg-error/30 rounded-r-full"
                    style={{ width: `${Math.max(0, 100 - (romMax / 140) * 100)}%` }}
                  ></div>

                  {/* Left Handle */}
                  <div
                    className="absolute -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${(romMin / 140) * 100}%` }}
                  >
                    <span className="absolute -top-6 bg-surface-container-highest px-1.5 py-0.5 rounded font-label-mono text-[10px] text-on-surface font-semibold">
                      {romMin}°
                    </span>
                    <div className="w-5 h-5 rounded-full bg-white shadow-md border-2 border-primary flex items-center justify-center cursor-pointer">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                  </div>

                  {/* Right Handle Slider */}
                  <div
                    className="absolute -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${(romMax / 140) * 100}%` }}
                  >
                    <span className="absolute -top-6 bg-primary text-white px-1.5 py-0.5 rounded font-label-mono text-[10px] font-bold">
                      {romMax}°
                    </span>
                    <div className="w-5 h-5 rounded-full bg-white shadow-md border-2 border-primary flex items-center justify-center cursor-pointer">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <label className="text-xs font-label-mono text-on-surface-variant flex items-center gap-2">
                    <span>Min Ext:</span>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={romMin}
                      onChange={(e) => setRomMin(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </label>
                  <label className="text-xs font-label-mono text-on-surface-variant flex items-center gap-2">
                    <span>Flexion Max:</span>
                    <input
                      type="range"
                      min="60"
                      max="140"
                      value={romMax}
                      onChange={(e) => setRomMax(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </label>
                </div>

                <div className="flex items-center justify-between text-on-surface-variant font-label-mono text-xs mt-2">
                  <span>0° Full Ext</span>
                  <span className="text-tertiary">Acceptable Envelope (0° - {romMax}°)</span>
                  <span className="text-error">&gt;{romMax}° Pain Risk</span>
                </div>
              </div>

              {/* Scoring Weight Slider */}
              <div className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between gap-3 border border-surface-container">
                <div className="flex items-center gap-1.5 min-w-max">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">balance</span>
                  <span className="font-label-md text-xs text-on-surface font-semibold">ML Scoring Weight:</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={weightRom}
                    onChange={(e) => setWeightRom(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-highest accent-primary rounded-full cursor-pointer"
                  />
                  <span className="font-label-mono text-xs text-primary font-bold min-w-[36px] text-right">
                    {weightRom}%
                  </span>
                </div>
              </div>
            </div>

            {/* Metric 2: Tempo Cadence */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center font-label-mono text-xs font-bold">
                    M2
                  </span>
                  <div>
                    <h3 className="font-headline-sm text-sm font-bold text-on-surface">Tempo Cadence Profiler</h3>
                    <p className="font-label-mono text-xs text-on-surface-variant">Concentric vs Eccentric Control</p>
                  </div>
                </div>
                <span className="font-display-metric text-lg text-tertiary font-bold">
                  {tempoConc}s · 1.0s · {tempoEcc}s
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container-low p-3 rounded-lg border border-surface-container">
                  <span className="font-label-mono text-[10px] text-on-surface-variant uppercase block">
                    Concentric Lift Duration
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      min="0.5"
                      max="4.0"
                      step="0.5"
                      value={tempoConc}
                      onChange={(e) => setTempoConc(Number(e.target.value))}
                      className="w-full accent-tertiary"
                    />
                    <span className="font-label-mono text-xs font-bold text-on-surface min-w-[30px]">
                      {tempoConc}s
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-low p-3 rounded-lg border border-surface-container">
                  <span className="font-label-mono text-[10px] text-on-surface-variant uppercase block">
                    Eccentric Descent Duration
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      min="1.0"
                      max="6.0"
                      step="0.5"
                      value={tempoEcc}
                      onChange={(e) => setTempoEcc(Number(e.target.value))}
                      className="w-full accent-tertiary"
                    />
                    <span className="font-label-mono text-xs font-bold text-on-surface min-w-[30px]">
                      {tempoEcc}s
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between gap-3 border border-surface-container">
                <div className="flex items-center gap-1.5 min-w-max">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">balance</span>
                  <span className="font-label-md text-xs text-on-surface font-semibold">ML Scoring Weight:</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={weightTempo}
                    onChange={(e) => setWeightTempo(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-highest accent-tertiary rounded-full cursor-pointer"
                  />
                  <span className="font-label-mono text-xs text-tertiary font-bold min-w-[36px] text-right">
                    {weightTempo}%
                  </span>
                </div>
              </div>
            </div>

            {/* Metric 3: Compensatory Threshold */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center font-label-mono text-xs font-bold">
                    M3
                  </span>
                  <div>
                    <h3 className="font-headline-sm text-sm font-bold text-on-surface">Compensatory Valgus Gating</h3>
                    <p className="font-label-mono text-xs text-on-surface-variant">Frontal Plane Knee Collapse Limit</p>
                  </div>
                </div>
                <span className="font-display-metric text-lg text-error font-bold">
                  &lt;{valgusLimit}° Limit
                </span>
              </div>

              <div className="bg-surface-container-low p-3 rounded-xl border border-surface-container">
                <div className="flex items-center justify-between text-xs font-label-mono mb-1.5">
                  <span>Frontal Valgus Deviation Tolerance</span>
                  <span className="font-bold text-error">{valgusLimit}°</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={valgusLimit}
                  onChange={(e) => setValgusLimit(Number(e.target.value))}
                  className="w-full accent-error"
                />
              </div>

              <div className="bg-surface-container-low p-3 rounded-xl flex items-center justify-between gap-3 border border-surface-container">
                <div className="flex items-center gap-1.5 min-w-max">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">balance</span>
                  <span className="font-label-md text-xs text-on-surface font-semibold">ML Scoring Weight:</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={weightComp}
                    onChange={(e) => setWeightComp(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-highest accent-error rounded-full cursor-pointer"
                  />
                  <span className="font-label-mono text-xs text-error font-bold min-w-[36px] text-right">
                    {weightComp}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Save & Deploy Protocol Button */}
          <button
            onClick={handleSaveProtocol}
            className="w-full py-3.5 px-6 rounded-xl bg-primary text-on-primary font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary-container active:scale-[0.99] transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">publish</span>
            <span>Save & Deploy Protocol to Elena&apos;s Mobile App</span>
          </button>
        </section>
      )}
    </div>
  );
}
