import React from 'react';

export default function ToastBanner({ toast }) {
  if (!toast || !toast.visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto transform transition-all duration-300 ease-out">
      <div className="bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-2xl flex items-center justify-between border border-outline/20 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-tertiary-fixed text-[22px]">
            {toast.icon || 'check_circle'}
          </span>
          <span className="font-body-sm text-[13px] font-medium leading-snug">
            {toast.message}
          </span>
        </div>
        <span className="font-label-mono text-[10px] text-outline-variant uppercase tracking-wider pl-2 border-l border-outline/30 shrink-0">
          Auto-Synced
        </span>
      </div>
    </div>
  );
}
