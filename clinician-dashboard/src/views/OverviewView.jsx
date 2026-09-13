import React, { useState } from 'react';

export default function OverviewView({ onNavigate, showToast }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [approvedCards, setApprovedCards] = useState({});

  const handleApprove = (cardId, patientName) => {
    setApprovedCards((prev) => ({ ...prev, [cardId]: true }));
    showToast(`Approved protocol advancement for ${patientName}`, 'verified');
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-28 gap-5">
      {/* Top Clinician Greeting & Pulse Banner */}
      <section className="bg-surface-container-low rounded-xl p-5 shadow-sm border border-surface-container">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <span className="font-label-md text-label-md text-tertiary uppercase tracking-wider font-semibold">
              Clinic Station • Ortho PT
            </span>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-on-surface mt-1 font-bold">
              Good morning, Dr. Vance
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              DPT, OCS • Orthopedic Rehabilitation Clinic
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full shadow-sm">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-label-mono text-label-mono font-semibold">
              14 Active Live
            </span>
          </div>
        </div>

        {/* Quick Context Stat bar */}
        <div className="grid grid-cols-2 gap-2 mt-4 pt-1 bg-surface-container-lowest rounded-lg p-2 border border-surface-container">
          <div className="flex items-center gap-2.5 p-1.5">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[20px]">neurology</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-mono text-[11px] text-on-surface-variant">Edge Engine</span>
              <span className="font-label-md text-[12px] font-semibold text-on-surface">Kinetic ML v4.2</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-1.5">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-tertiary shrink-0">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-mono text-[11px] text-on-surface-variant">Sync Accuracy</span>
              <span className="font-label-md text-[12px] font-semibold text-on-surface">99.1% Confidence</span>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Metric Grid (2x2) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1 */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Patients Active</span>
            <span className="material-symbols-outlined text-primary text-[22px]">groups</span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display-metric text-3xl text-on-surface font-bold">42</span>
              <span className="font-label-mono text-xs text-tertiary flex items-center font-bold">↑3/wk</span>
            </div>
            <span className="font-body-sm text-xs text-on-surface-variant line-clamp-1">36 On-Track</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div 
          onClick={() => setActiveFilter('progressions')}
          className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container flex flex-col justify-between cursor-pointer hover:border-secondary transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">Pending Review</span>
            <span className="material-symbols-outlined text-secondary text-[22px]">pending_actions</span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display-metric text-3xl text-on-surface font-bold">9</span>
              <span className="font-label-mono text-xs text-secondary flex items-center font-bold">Rehab Q</span>
            </div>
            <span className="font-body-sm text-xs text-on-surface-variant line-clamp-1">Requires triage</span>
          </div>
        </div>

        {/* KPI 3: Alert */}
        <div 
          onClick={() => setActiveFilter('critical')}
          className="bg-error-container rounded-xl p-4 shadow-sm border border-error/20 flex flex-col justify-between cursor-pointer hover:border-error transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-error-container font-semibold">High Pain Alerts</span>
            <span className="material-symbols-outlined text-error text-[22px]">warning</span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="font-display-metric text-3xl text-on-error-container font-bold">4</span>
              <span className="font-label-mono text-xs text-error font-bold">3 Flagged</span>
            </div>
            <span className="font-body-sm text-xs text-on-error-container/80 line-clamp-1">1 Abstained session</span>
          </div>
        </div>

        {/* KPI 4: Compliance */}
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-surface-container flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">ROM Compliance</span>
            <span className="material-symbols-outlined text-tertiary text-[22px]">task_alt</span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display-metric text-3xl text-on-surface font-bold">88.4%</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
              <span className="font-label-mono text-[11px] text-tertiary font-medium">On-Device Verified</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Filter / Segment Bar */}
      <section className="bg-surface-container rounded-xl p-1 flex items-center gap-1">
        <button
          onClick={() => setActiveFilter('all')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-center font-label-md text-sm transition-all whitespace-nowrap ${
            activeFilter === 'all'
              ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          All Items (6)
        </button>
        <button
          onClick={() => setActiveFilter('critical')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-center font-label-md text-sm transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeFilter === 'critical'
              ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-error"></span>
          Critical Alerts (2)
        </button>
        <button
          onClick={() => setActiveFilter('progressions')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-center font-label-md text-sm transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeFilter === 'progressions'
              ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Progression (2)
        </button>
      </section>

      {/* Critical Alerts Section */}
      {(activeFilter === 'all' || activeFilter === 'critical') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[20px]">crisis_alert</span>
              <span className="font-headline-sm text-base font-bold text-on-surface">High Priority Triage</span>
            </div>
            <span className="font-badge text-xs px-2.5 py-0.5 rounded-full bg-error-container text-on-error-container font-semibold">
              2 Action Required
            </span>
          </div>

          {/* Alert Card 1: David Miller */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-error/30"
                  alt="David Miller"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYcdzKLkkr3cgZBe7P_8nfmrFewWRbrx2V4tpDWSsAscnMGS_pPDEa7JvzB13wznajaQQVVvg_MpniEU0qzYmJ0TAjmFQf3Pe-9RpWk0MbP5jo2R0iZuFjXim3Xi6SbAepYU4YGcCS5mwr-0GBaRK0ZASQi5nTyX9NJ8H8hX7ZZo6QQ6wbQPsxwOINu3HwuXKHYNrz-SIXQDL1CWbi56oYhm8UQbaPaKg8G_IXAkGIvj24Oxl_O3UC"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-base font-bold text-on-surface">David Miller</span>
                    <span className="font-label-mono text-xs text-on-surface-variant">#PT-4091</span>
                  </div>
                  <span className="font-body-sm text-xs text-on-surface-variant">
                    Total Hip Arthroplasty (THA) • Post-op Wk 4
                  </span>
                </div>
              </div>
              <span className="font-badge text-xs px-2.5 py-1 rounded-md bg-error-container text-on-error-container font-bold whitespace-nowrap">
                PAIN VAS 8/10
              </span>
            </div>

            {/* Kinematic Details */}
            <div className="mt-3 bg-surface-container-low rounded-lg p-3 border border-surface-container">
              <div className="flex items-center justify-between text-on-surface-variant font-label-mono text-xs mb-1.5">
                <span className="flex items-center gap-1 text-error font-semibold">
                  <span className="material-symbols-outlined text-[16px]">cancel</span>
                  Aborted at Rep 4 • Bulgarian Split Squat
                </span>
                <span>14m ago</span>
              </div>
              <p className="font-body-sm text-xs text-on-surface leading-relaxed">
                Pelvic drop compensation reached <strong className="text-error font-semibold">+14.2°</strong> exceeding baseline tolerance (+4.0°). Patient triggered tactile pain override.
              </p>
              {/* Mini Telemetry Sparkline & Joint Angle Visual */}
              <div className="mt-2 flex items-center justify-between bg-surface-container-lowest rounded-md p-2.5 border border-surface-container">
                <div className="flex flex-col">
                  <span className="font-label-mono text-[10px] text-on-surface-variant uppercase">Hip Flexion Peak</span>
                  <span className="font-display-metric text-lg text-on-surface font-bold">
                    68° <span className="text-xs text-error font-normal">(-22° Target)</span>
                  </span>
                </div>
                <svg className="w-28 h-8 text-error" fill="none" viewBox="0 0 100 24">
                  <path d="M0 16 L20 15 L40 17 L60 8 L80 23 L100 22" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                  <circle cx="80" cy="23" fill="#ba1a1a" r="3" />
                </svg>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => onNavigate('kinematics', { patientName: 'David Miller', sessionNo: '14' })}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary text-on-primary font-label-md text-sm hover:bg-primary-container active:scale-[0.98] transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">play_circle</span>
                <span>Review Kinematics</span>
              </button>
              <button
                onClick={() => showToast('Secure chat channel opened for David Miller', 'chat')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface-container-high text-on-surface font-label-md text-sm hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Message Patient</span>
              </button>
            </div>
          </div>

          {/* Alert Card 2: Sofia Alvarez */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-secondary/30"
                  alt="Sofia Alvarez"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUnMrsku6ZLnUIKyEeB0eZ_-u33bn6oSjDs1BjiD_YWn18moIg98BnqcReDBYd343A1Q_y7XZ25m2wovugLoUyCXkUn_FQwTed1qFSo1Mgpaj9G9oHwfEdCIFSEQrtk2PmjLPqJg60C6c8aOtxAaTy1-OYNmf0PbSjDjCfuNoAt-TBG1QXIkGwHJXz2wVxuAIqacdK5FbGnG4T-asWmqCkAqmzjvYaTlqegc08FSmQT610YYobA5cn"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-base font-bold text-on-surface">Sofia Alvarez</span>
                    <span className="font-label-mono text-xs text-on-surface-variant">#PT-2283</span>
                  </div>
                  <span className="font-body-sm text-xs text-on-surface-variant">
                    L4-L5 Lumbar Radiculopathy • Conservative
                  </span>
                </div>
              </div>
              <span className="font-badge text-xs px-2.5 py-1 rounded-md bg-secondary-fixed text-on-secondary-fixed font-bold whitespace-nowrap">
                SESSION ABSTAINED
              </span>
            </div>

            <div className="mt-3 bg-surface-container-low rounded-lg p-3 border border-surface-container">
              <div className="flex items-center justify-between text-on-surface-variant font-label-mono text-xs mb-1.5">
                <span className="flex items-center gap-1 text-secondary font-semibold">
                  <span className="material-symbols-outlined text-[16px]">motion_blur</span>
                  Sensor Disconnect & Spasm Flag
                </span>
                <span>42m ago</span>
              </div>
              <p className="font-body-sm text-xs text-on-surface leading-relaxed">
                Aborted during <em>Quadruped Bird-Dog (Set 1)</em>. Patient reported &ldquo;Acute sharp electric spasm in left gluteal region&rdquo;. Optical tracking dropped confidence to 62%.
              </p>
              <div className="mt-2 flex items-center justify-between bg-surface-container-lowest rounded-md p-2.5 border border-surface-container">
                <div className="flex flex-col">
                  <span className="font-label-mono text-[10px] text-on-surface-variant uppercase">Sensor Confidence</span>
                  <span className="font-display-metric text-lg text-on-surface font-bold">
                    62% <span className="text-xs text-secondary font-normal">(Degraded)</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-surface-container-high px-2 py-1 rounded">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">history_toggle_off</span>
                  <span className="font-label-mono text-xs text-on-surface font-medium">02:14 Elapsed</span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => showToast('Sensor error trace loaded for Sofia Alvarez', 'receipt_long')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-surface-container-high text-on-surface font-label-md text-sm hover:bg-surface-container-highest transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                <span>Inspect Log</span>
              </button>
              <button
                onClick={() => showToast('Connecting clinical audio dialer...', 'call')}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-primary-container text-on-primary-container font-label-md text-sm hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span>Call Patient</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ML Progression Recommendations Section */}
      {(activeFilter === 'all' || activeFilter === 'progressions') && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">auto_graph</span>
              <span className="font-headline-sm text-base font-bold text-on-surface">Algorithmic Progressions</span>
            </div>
            <span className="font-badge text-xs px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-semibold">
              2 Ready to Advance
            </span>
          </div>

          {/* Progression Card 1: Elena Rostova */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container transition-all">
            {approvedCards['elena'] ? (
              <div className="py-4 px-2 text-center flex flex-col items-center justify-center bg-surface-container-high rounded-xl">
                <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed mb-2 animate-bounce">
                  <span className="material-symbols-outlined text-[24px]">verified</span>
                </div>
                <span className="font-headline-sm text-base font-bold text-on-surface">Progression Approved</span>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                  Updated prescription synced to Elena Rostova&apos;s mobile kinetic sensor.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                      alt="Elena Rostova"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBPxxNtacKXd0Anhufed1IAhbmFW6eph381m-vnLAnAOOAVws5Hv8o2D7vLCEzW0G-gNPKgktHMPPw14mdBe66oD23M2dh0MKDNfdrSdZmzt1LBHN5mJwewACa1d5oItC3mQH0uSK0bdm7wK8DOR9FDY_NnwzBXqCC-GLF-58JnFqfKygzGChM14EQHs1SR7u_7lN0jU2v6VoQCM3gEHFcvElFXHBgATL2gzjR5QXSgSazNp90O_xaf"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-base font-bold text-on-surface">Elena Rostova</span>
                        <span className="font-label-mono text-xs text-tertiary font-bold">96% Compliant</span>
                      </div>
                      <span className="font-body-sm text-xs text-on-surface-variant">
                        Post-Op ACL Reconstruction • Day 42
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">trending_up</span>
                  </div>
                </div>

                <div className="mt-3 bg-surface-container-low rounded-lg p-3 border border-surface-container">
                  <div className="flex items-center gap-1.5 text-primary font-label-md text-xs font-semibold mb-1">
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    <span>Prescription Shift: Terminal Knee Ext & Wall Sits</span>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface">
                    Increase resistance from <strong className="text-on-surface font-semibold">Light Band (Yellow)</strong> to <strong className="text-primary font-semibold">Medium Band (Red)</strong> + add 2 reps (3x12).
                  </p>
                  <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-mono text-xs bg-surface-container-lowest p-2 rounded border border-surface-container">
                    <span>Zero pain across 5 sessions</span>
                    <span className="text-primary font-semibold">ROM 132° Flex / 0° Ext</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleApprove('elena', 'Elena Rostova', 'Phase 3 Knee Stabilization')}
                    className="flex-1 py-2 px-3 rounded-lg bg-primary text-on-primary font-label-md text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all hover:bg-primary-container"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Approve Progression</span>
                  </button>
                  <button
                    onClick={() => onNavigate('protocol', { patient: 'Elena Rostova' })}
                    className="py-2 px-3 rounded-lg bg-surface-container-high text-on-surface font-label-md text-sm flex items-center justify-center gap-1 hover:bg-surface-container-highest transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                    <span>Adjust Criteria</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Progression Card 2: Marcus Chen */}
          <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-surface-container transition-all">
            {approvedCards['marcus'] ? (
              <div className="py-4 px-2 text-center flex flex-col items-center justify-center bg-surface-container-high rounded-xl">
                <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed mb-2 animate-bounce">
                  <span className="material-symbols-outlined text-[24px]">verified</span>
                </div>
                <span className="font-headline-sm text-base font-bold text-on-surface">Progression Approved</span>
                <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                  Updated prescription synced to Marcus Chen&apos;s mobile kinetic sensor.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                      alt="Marcus Chen"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUFnbZqfTLShXjVLg95HZUk7fC-hQYL6UoaKP0wab9NpVCaGsqYRT2AdPLrkGEBjZ9ucU8yq9YrcDMg9_vuOjSVPabYh3QnHykDeS8vzO2Q2Lj5lhyngrlu8uz2B1mOjpUFFFqMlJgFGDKlGh4vbYp4e0KhpscehezcY84HAaxiHRDP8uuZg_F6aCvK02gTpVWhrHV1Jz7gJ5kK7OZGNsDRPQVacJK3O2BCo5nR3qUYxZw7A3NS69u"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-base font-bold text-on-surface">Marcus Chen</span>
                        <span className="font-label-mono text-xs text-tertiary font-bold">94% Compliant</span>
                      </div>
                      <span className="font-body-sm text-xs text-on-surface-variant">
                        Rotator Cuff Supraspinatus Repair • Wk 6
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[18px]">trending_up</span>
                  </div>
                </div>

                <div className="mt-3 bg-surface-container-low rounded-lg p-3 border border-surface-container">
                  <div className="flex items-center gap-1.5 text-primary font-label-md text-xs font-semibold mb-1">
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    <span>Prescription Shift: Scaption Plane with Dumbbell</span>
                  </div>
                  <p className="font-body-sm text-xs text-on-surface">
                    Progress load <strong className="text-primary font-semibold">+1.0 lb</strong> (from 2.0 lbs to 3.0 lbs). Angular velocity steady at <strong className="font-label-mono">42°/s</strong> with zero scapular hike compensation.
                  </p>
                  <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-mono text-xs bg-surface-container-lowest p-2 rounded border border-surface-container">
                    <span>Bilateral Symmetry: 94%</span>
                    <span className="text-tertiary font-semibold">Smoothness Index: 0.91</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleApprove('marcus', 'Marcus Chen', 'Scaption Load Increase')}
                    className="flex-1 py-2 px-3 rounded-lg bg-primary text-on-primary font-label-md text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all hover:bg-primary-container"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Approve Progression</span>
                  </button>
                  <button
                    onClick={() => onNavigate('kinematics', { patientName: 'Marcus Chen', sessionNo: '34' })}
                    className="py-2 px-3 rounded-lg bg-surface-container-high text-on-surface font-label-md text-sm flex items-center justify-center gap-1 hover:bg-surface-container-highest transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">query_stats</span>
                    <span>Telemetry</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
