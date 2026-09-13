import React, { useState } from 'react';

export default function PatientProfileView({ initialPatient, onNavigate, showToast }) {
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatient?.id || 'sarah');
  const [subTab, setSubTab] = useState('overview');

  const patients = {
    sarah: {
      id: 'sarah',
      name: 'Sarah Jenkins',
      age: 48,
      gender: 'F',
      mrn: '#PT-88392',
      status: 'In Protocol',
      week: 'Week 5 of 12',
      diagnosis: 'Right Rotator Cuff Supraspinatus Tendinopathy & Subacromial Impingement',
      meds: 'Meloxicam 15mg QD',
      crp: 'CRP 1.2 mg/L',
      type: 'Conservative Non-op',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDthb6Tt9LnA37zxq06iQo-16IZoOteTntVSx_XpIX8XiG9qfufwrEZPwkjuqCsc8Bysa63wnjms_8dNUPItyb68hUcmkRIJ5702LKDU8FgfM6WJJkPkbb6VapUjLA77ydzWI5sGp4et1Yh9h5sljILYSoymHh7UN92VZNfrAgajiHm7U2KXw6la6oxAA-oZkwEC1Z6yEk-AxMfKXa6qC56-ppHUnGQ2rXxu20BjT8EAz0Rl-FC80Bd',
      romDelta: '+59°',
      romPercent: '+62.1%',
      vasDelta: '-5 pts',
      vasProgression: 'VAS 7 → 2',
      adherence: 92,
      sessionsCount: '23/25',
      stability: 94.2,
      stabilityGrade: 'Grade A- (Symmetric)',
      programTitle: 'Controlled Hypertrophy & End-Range Mobilization',
      programSchedule: '3 Rep Cycles Daily • Scapular Setting Required',
    },
    elena: {
      id: 'elena',
      name: 'Elena Rostova',
      age: 27,
      gender: 'F',
      mrn: '#PT-50192',
      status: 'Advancing',
      week: 'Week 6 of 16',
      diagnosis: 'Post-Op ACL Reconstruction (Hamstring Autograft)',
      meds: 'Acetaminophen PRN',
      crp: 'CRP 0.8 mg/L',
      type: 'Post-Surgical Rehab',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPxxNtacKXd0Anhufed1IAhbmFW6eph381m-vnLAnAOOAVws5Hv8o2D7vLCEzW0G-gNPKgktHMPPw14mdBe66oD23M2dh0MKDNfdrSdZmzt1LBHN5mJwewACa1d5oItC3mQH0uSK0bdm7wK8DOR9FDY_NnwzBXqCC-GLF-58JnFqfKygzGChM14EQHs1SR7u_7lN0jU2v6VoQCM3gEHFcvElFXHBgATL2gzjR5QXSgSazNp90O_xaf',
      romDelta: '+48°',
      romPercent: '+57.1%',
      vasDelta: '-4 pts',
      vasProgression: 'VAS 6 → 2',
      adherence: 96,
      sessionsCount: '29/30',
      stability: 96.5,
      stabilityGrade: 'Grade A (High Precision)',
      programTitle: 'Terminal Knee Extension & Kinetic Chain Stability',
      programSchedule: '2 Cycles Daily • Sagittal Tracking Monitored',
    },
    marcus: {
      id: 'marcus',
      name: 'Marcus Chen',
      age: 35,
      gender: 'M',
      mrn: '#PT-73012',
      status: 'Review Queue',
      week: 'Week 6 of 12',
      diagnosis: 'Rotator Cuff Supraspinatus Tear Repair',
      meds: 'Ibuprofen 400mg PRN',
      crp: 'CRP 1.0 mg/L',
      type: 'Post-Surgical Rehab',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUFnbZqfTLShXjVLg95HZUk7fC-hQYL6UoaKP0wab9NpVCaGsqYRT2AdPLrkGEBjZ9ucU8yq9YrcDMg9_vuOjSVPabYh3QnHykDeS8vzO2Q2Lj5lhyngrlu8uz2B1mOjpUFFFqMlJgFGDKlGh4vbYp4e0KhpscehezcY84HAaxiHRDP8uuZg_F6aCvK02gTpVWhrHV1Jz7gJ5kK7OZGNsDRPQVacJK3O2BCo5nR3qUYxZw7A3NS69u',
      romDelta: '+36°',
      romPercent: '+40.0%',
      vasDelta: '-3 pts',
      vasProgression: 'VAS 5 → 2',
      adherence: 94,
      sessionsCount: '22/24',
      stability: 86.0,
      stabilityGrade: 'Grade B (Mild Asymmetry)',
      programTitle: 'Bilateral Scaption & Overhead Eccentric Control',
      programSchedule: 'Once Daily • 60 FPS Angle Vectoring',
    },
  };

  const patient = patients[selectedPatientId] || patients.sarah;

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 gap-5">
      {/* Patient Selector Switcher Pill Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        <span className="font-label-md text-xs text-on-surface-variant font-semibold shrink-0">
          Select Patient:
        </span>
        {Object.values(patients).map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPatientId(p.id)}
            className={`px-3 py-1.5 rounded-full font-label-md text-xs transition-all flex items-center gap-1.5 shrink-0 ${
              selectedPatientId === p.id
                ? 'bg-primary text-white font-bold shadow-sm'
                : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-tertiary"></span>
            {p.name}
          </button>
        ))}
      </div>

      {/* Clinical Header & Patient Dossier Card */}
      <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/20"
                alt={patient.name}
                src={patient.avatar}
              />
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-tertiary ring-2 ring-white"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="font-headline-sm text-lg font-bold text-on-surface">
                  {patient.name}
                </h1>
                <span className="font-label-mono text-xs text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                  {patient.age} {patient.gender}
                </span>
              </div>
              <span className="font-label-mono text-xs text-primary font-medium tracking-tight">
                MRN: {patient.mrn}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="font-label-md text-xs text-tertiary-container bg-surface-container-high px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">
              {patient.status}
            </span>
            <span className="font-label-mono text-xs text-on-surface-variant mt-1">
              {patient.week}
            </span>
          </div>
        </div>

        {/* Primary Clinical Diagnosis Notice */}
        <div className="bg-surface-container-low rounded-xl p-3 border border-surface-container flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0">
            clinical_notes
          </span>
          <div className="flex flex-col">
            <span className="font-label-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
              Primary Clinical Diagnosis
            </span>
            <span className="font-body-sm text-xs text-on-surface font-semibold leading-snug mt-0.5">
              {patient.diagnosis}
            </span>
          </div>
        </div>

        {/* Telemetry & Clinical Meta Badges */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-lg">
            <span className="material-symbols-outlined text-on-surface-variant text-[15px]">medication</span>
            <span className="font-label-mono text-xs text-on-surface-variant">{patient.meds}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-lg">
            <span className="material-symbols-outlined text-tertiary text-[15px]">bloodtype</span>
            <span className="font-label-mono text-xs text-on-surface-variant">{patient.crp}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-container px-2.5 py-1 rounded-lg">
            <span className="material-symbols-outlined text-primary text-[15px]">healing</span>
            <span className="font-label-mono text-xs text-on-surface-variant">{patient.type}</span>
          </div>
        </div>
      </section>

      {/* Segmented Navigation Well */}
      <section className="bg-surface-container-high p-1 rounded-xl flex items-center justify-between gap-1 shadow-sm">
        {['overview', 'program', 'sessions', 'notes'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`flex-1 py-2 px-3 rounded-lg font-label-md text-xs text-center transition-all capitalize ${
              subTab === tab
                ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab === 'program' ? 'Active Program' : tab}
          </button>
        ))}
      </section>

      {/* Hero Kinetic Recovery Chart */}
      <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">query_stats</span>
              <h2 className="font-headline-sm text-base font-bold text-on-surface">30-Day Recovery Metrics</h2>
            </div>
            <span className="font-body-sm text-xs text-on-surface-variant">
              Max Flexion ROM (°) vs. Reported Pain Score (VAS)
            </span>
          </div>
          <button
            onClick={() => showToast('Calibration data exported as CSV', 'download')}
            className="p-1.5 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-primary transition-colors"
            title="Export Calibration Data"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </div>

        {/* Chart Legend & Status Bar */}
        <div className="flex items-center justify-between bg-surface-container-low px-3 py-1.5 rounded-lg border border-surface-container">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-primary"></span>
              <span className="font-label-mono text-xs text-on-surface">Flexion (°)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-error"></span>
              <span className="font-label-mono text-xs text-on-surface">VAS Pain (0-10)</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-secondary border-dashed"></span>
            <span className="font-label-mono text-xs text-secondary font-semibold">Target 160°</span>
          </div>
        </div>

        {/* Inline SVG High-Density Clinical Graph */}
        <div className="relative w-full pt-2">
          <svg className="w-full h-44 overflow-visible" preserveAspectRatio="none" viewBox="0 0 340 160">
            <defs>
              <linearGradient id="romGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#006194" stopOpacity="0.22"></stop>
                <stop offset="100%" stopColor="#006194" stopOpacity="0.0"></stop>
              </linearGradient>
            </defs>

            {/* Y-Grid Guides */}
            <line stroke="#dce9ff" strokeDasharray="2 3" strokeWidth="1" x1="26" x2="330" y1="18" y2="18"></line>
            <line stroke="#dce9ff" strokeDasharray="2 3" strokeWidth="1" x1="26" x2="330" y1="58" y2="58"></line>
            <line stroke="#dce9ff" strokeDasharray="2 3" strokeWidth="1" x1="26" x2="330" y1="98" y2="98"></line>
            <line stroke="#dce9ff" strokeWidth="1" x1="26" x2="330" y1="138" y2="138"></line>

            {/* Target Milestone Guideline (160 deg baseline) */}
            <line stroke="#4b41e1" strokeDasharray="4 3" strokeWidth="1.5" x1="26" x2="330" y1="28" y2="28"></line>
            <text fill="#4b41e1" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="end" x="328" y="24">Goal: 160°</text>

            {/* Y-Axis ROM Labels */}
            <text fill="#707881" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end" x="20" y="32">160°</text>
            <text fill="#707881" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end" x="20" y="70">130°</text>
            <text fill="#707881" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end" x="20" y="110">100°</text>
            <text fill="#707881" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end" x="20" y="142">70°</text>

            {/* Area Fill under ROM Path */}
            <path d="M 32 124 Q 90 108, 130 92 T 230 52 T 325 34 L 325 138 L 32 138 Z" fill="url(#romGradient)"></path>

            {/* ROM Flexion Polyline Curve */}
            <path d="M 32 124 Q 90 108, 130 92 T 230 52 T 325 34" fill="none" stroke="#006194" strokeLinecap="round" strokeWidth="2.5"></path>

            {/* VAS Pain Polyline Curve (Dropping) */}
            <path d="M 32 48 Q 90 62, 130 84 T 230 114 T 325 128" fill="none" stroke="#ba1a1a" strokeDasharray="3 3" strokeLinecap="round" strokeWidth="2"></path>

            {/* Key Milestones Points */}
            <circle cx="32" cy="124" fill="#ffffff" r="3.5" stroke="#006194" strokeWidth="2"></circle>
            <circle cx="130" cy="92" fill="#ffffff" r="3" stroke="#006194" strokeWidth="2"></circle>
            <circle cx="230" cy="52" fill="#ffffff" r="3" stroke="#006194" strokeWidth="2"></circle>
            <circle cx="325" cy="34" fill="#006194" r="4.5" stroke="#ffffff" strokeWidth="2"></circle>
            <circle cx="325" cy="128" fill="#ba1a1a" r="3.5" stroke="#ffffff" strokeWidth="1.5"></circle>

            {/* Callout Tooltip at Day 30 */}
            <g transform="translate(242, 4)">
              <rect fill="#0b1c30" height="26" opacity="0.92" rx="4" width="86" x="0" y="0"></rect>
              <text fill="#fdfcff" fontFamily="Inter" fontSize="8.5" fontWeight="600" x="6" y="11">Day 30 Live Peak</text>
              <text fill="#4cd7f6" fontFamily="JetBrains Mono" fontSize="9.5" fontWeight="700" x="6" y="21">154° <tspan fill="#ffdad6">(VAS 2)</tspan></text>
            </g>
          </svg>

          {/* X-Axis Labels */}
          <div className="flex justify-between pl-7 pr-1 mt-2 text-on-surface-variant font-label-mono text-xs">
            <span>Day 1 (95°)</span>
            <span>Day 10 (118°)</span>
            <span>Day 20 (138°)</span>
            <span className="text-primary font-bold">Day 30 (154°)</span>
          </div>
        </div>

        {/* Telemetry Delta Summary Strip */}
        <div className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between mt-2 border border-surface-container">
          <div className="flex flex-col">
            <span className="font-label-mono text-[10px] text-on-surface-variant uppercase font-semibold">
              Net ROM Recovery
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display-metric text-xl text-primary font-bold">{patient.romDelta}</span>
              <span className="font-label-mono text-xs text-tertiary font-semibold">({patient.romPercent})</span>
            </div>
          </div>
          <div className="w-px h-8 bg-surface-container-highest"></div>
          <div className="flex flex-col items-end">
            <span className="font-label-mono text-[10px] text-on-surface-variant uppercase font-semibold">
              Symptom Relief
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display-metric text-xl text-error font-bold">{patient.vasDelta}</span>
              <span className="font-label-mono text-xs text-on-surface-variant font-medium">{patient.vasProgression}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Adherence & Stability Module */}
      <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
            <h3 className="font-headline-sm text-base font-bold text-on-surface">Pathway & Compliance</h3>
          </div>
          <span className="font-label-mono text-xs px-2.5 py-0.5 rounded-full bg-surface-container text-secondary font-semibold">
            Phase II Validated
          </span>
        </div>

        <div className="p-3 bg-surface-container-low rounded-xl border border-surface-container flex flex-col gap-1">
          <span className="font-label-mono text-[10px] text-on-surface-variant uppercase font-semibold">
            Current Prescribed Program
          </span>
          <span className="font-body-sm text-xs font-semibold text-on-surface">
            {patient.programTitle}
          </span>
          <span className="font-label-mono text-[11px] text-tertiary">
            {patient.programSchedule}
          </span>
        </div>

        {/* Metrics Bento Pair */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
          {/* Adherence Card */}
          <div className="bg-surface-container-low rounded-xl p-4 border border-surface-container flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-mono text-[11px] text-on-surface-variant uppercase font-semibold">Adherence</span>
              <span className="material-symbols-outlined text-tertiary text-[18px]">task_alt</span>
            </div>
            <div className="flex items-center gap-3 my-2">
              <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-highest"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-tertiary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${patient.adherence}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-display-metric text-xs text-on-surface font-bold">
                  {patient.adherence}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-base font-bold text-on-surface leading-tight">
                  {patient.sessionsCount}
                </span>
                <span className="font-label-mono text-xs text-on-surface-variant">Sessions Completed</span>
              </div>
            </div>
            <span className="font-label-mono text-xs text-tertiary font-medium">On pace with protocol</span>
          </div>

          {/* ML Pose Stability Card */}
          <div className="bg-surface-container-low rounded-xl p-4 border border-surface-container flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-mono text-[11px] text-on-surface-variant uppercase font-semibold">Pose Stability</span>
              <span className="material-symbols-outlined text-primary text-[18px]">accessibility_new</span>
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-1">
                <span className="font-display-metric text-3xl text-on-surface font-bold tracking-tight">
                  {patient.stability}
                </span>
                <span className="font-label-mono text-xs text-on-surface-variant">%</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <span className="font-label-mono text-xs text-tertiary font-semibold">
                  {patient.stabilityGrade}
                </span>
              </div>
            </div>
            <span className="font-label-mono text-xs text-on-surface-variant">
              Compensatory shrugs: &lt;4%
            </span>
          </div>
        </div>
      </section>

      {/* Anatomical Joint Telemetry Pods */}
      <section className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm border border-surface-container flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">motion_sensor_active</span>
            <h3 className="font-headline-sm text-base font-bold text-on-surface">Kinematic Telemetry</h3>
          </div>
          <span className="font-label-mono text-xs text-tertiary">In-clinic + ML Edge</span>
        </div>

        <div className="space-y-2">
          {/* Telemetry Row 1: Active Abduction */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">north_east</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-sm text-xs font-semibold text-on-surface">Active Abduction</span>
                <span className="font-label-mono text-[11px] text-on-surface-variant">Baseline: 88° (Prior Exam)</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display-metric text-lg text-on-surface font-bold">142°</span>
                <span className="font-label-mono text-xs text-tertiary font-bold">+54°</span>
              </div>
              <span className="font-label-mono text-[10px] text-on-surface-variant">Conf: 98.4%</span>
            </div>
          </div>

          {/* Telemetry Row 2: External Rotation */}
          <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary shrink-0">
                <span className="material-symbols-outlined text-[20px]">rotate_right</span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-sm text-xs font-semibold text-on-surface">External Rotation</span>
                <span className="font-label-mono text-[11px] text-on-surface-variant">Baseline: 42° (Prior Exam)</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display-metric text-lg text-on-surface font-bold">64°</span>
                <span className="font-label-mono text-xs text-tertiary font-bold">+22°</span>
              </div>
              <span className="font-label-mono text-[10px] text-on-surface-variant">Conf: 97.1%</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('kinematics', { patientName: patient.name, sessionNo: '23' })}
          className="w-full mt-2 py-2.5 px-4 rounded-xl bg-primary text-on-primary font-label-md text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary-container transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">play_circle</span>
          <span>Review Latest Session Kinematics</span>
        </button>
      </section>
    </div>
  );
}
