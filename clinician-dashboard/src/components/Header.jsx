import React from 'react';

export default function Header({ activeTab, user, onLogout }) {
  const getTabTitle = (tab) => {
    switch (tab) {
      case 'overview': return 'Overview';
      case 'patients': return 'Patients';
      case 'kinematics': return 'Kinematics';
      case 'protocol': return 'Protocol Builder';
      default: return 'Dashboard';
    }
  };

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-surface/85 backdrop-blur-xl border-b border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 px-4 md:px-8 max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Kinetic Clinical SVG Brand Icon */}
          <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl shadow-sm overflow-hidden bg-primary">
            <svg viewBox="0 0 48 48" fill="none" className="w-full h-full p-1.5">
              <path
                d="M12 34C14 26 19 16 26 14C31 12.5 35 15 36 20C37 25 33 29 27 30C21 31 16 27 15 22"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="26" cy="14" r="3.5" fill="#38bdf8" />
              <circle cx="36" cy="20" r="2.5" fill="#ffffff" />
              <circle cx="15" cy="22" r="2.5" fill="#bae6fd" />
            </svg>
          </div>

          <div className="flex flex-col">
            <span className="font-headline-sm text-[16px] font-bold text-on-surface tracking-tight leading-tight">
              Kinetic Clinical
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              <span className="font-label-mono text-[11px] text-tertiary font-semibold uppercase tracking-wider">
                ML Sync Active
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="font-headline-sm text-sm font-semibold text-on-surface">
              {user?.name || getTabTitle(activeTab)}
            </span>
            <span className="font-label-mono text-[10px] text-on-surface-variant">
              Station PT-04 • Online
            </span>
          </div>

          <div className="flex items-center gap-2.5 pl-2 border-l border-surface-container">
            <img
              alt="Clinician Profile"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8XBn1s3V1hnk3tJHIbVI7RPSEnOz9WcMKbbXW2KnAZGa_6TxFwc70rjssH4mdw6ehe8v4m3nuBLzwL9kxn76NDRoJ-2OcaBEDXTy4sVZ9ZPLSQTSch0Ktrxbq2K75TzDv__Q1IGqn_aTaZEJg6DktqUDmChWgMC5-cl0YtMWisaNtPVPY5rElY5SyXdjEoOeF63HqDMVJPPgUx6kxmjY4Q88Gm2f_vPyXKRseux-3V1O7paxGTzu8"
            />
            {onLogout && (
              <button
                onClick={onLogout}
                title="Log out"
                className="p-1 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
