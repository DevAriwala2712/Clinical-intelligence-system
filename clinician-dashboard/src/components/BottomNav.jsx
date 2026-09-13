import React from 'react';

export default function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'patients', label: 'Patients', icon: 'vital_signs' },
    { id: 'kinematics', label: 'Kinematics', icon: 'motion_photos_on' },
    { id: 'protocol', label: 'Protocol', icon: 'tune' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-surface/90 backdrop-blur-xl border-t border-surface-container shadow-[0_-2px_12px_rgba(0,0,0,0.04)]">
      <div className="flex justify-around items-center h-16 max-w-xl mx-auto px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[44px] flex-1 transition-all rounded-lg py-1 ${
                isActive
                  ? 'text-primary font-semibold scale-105'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] transition-transform ${
                  isActive ? 'material-symbols-filled text-primary' : ''
                }`}
              >
                {tab.icon}
              </span>
              <span className="font-label-md text-[11px] mt-0.5 tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
