import React, { useState } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import ToastBanner from './components/ToastBanner';
import OverviewView from './views/OverviewView';
import KinematicsPlayerView from './views/KinematicsPlayerView';
import PatientProfileView from './views/PatientProfileView';
import ProtocolBuilderView from './views/ProtocolBuilderView';

function LoginScreen({ onLoggedIn }) {
  const [email, setEmail] = useState('clinician@demo.com');
  const [password, setPassword] = useState('DemoPass123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLoggedIn('demo-token-12345', { name: 'Dr. Vance, DPT, OCS', role: 'clinician', email });
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-surface">
      <div className="w-full max-w-md bg-surface-container-lowest p-6 sm:p-8 rounded-2xl shadow-lg border border-surface-container flex flex-col items-center">
        {/* Kinetic Clinical Logo */}
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-md mb-4 p-2">
          <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
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

        <h1 className="font-headline-lg-mobile sm:font-headline-lg font-bold text-on-surface text-center">
          Kinetic Clinical
        </h1>
        <p className="font-body-sm text-xs text-on-surface-variant text-center mt-1 mb-6">
          Clinician-Calibrated Rehabilitation & Machine Learning Kinematics
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="font-label-md text-xs text-on-surface-variant block mb-1 font-semibold">
              Clinician Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-container rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="font-label-md text-xs text-on-surface-variant block mb-1 font-semibold">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low border border-surface-container rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-primary text-white font-headline-sm text-sm font-bold shadow-md hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
            <span>{loading ? 'Authenticating...' : 'Sign In to Station'}</span>
          </button>
        </form>

        <div className="w-full mt-6 pt-4 border-t border-surface-container text-center">
          <span className="font-label-mono text-[11px] text-tertiary font-semibold flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            Edge ML Kinematics Engine v4.2 Ready
          </span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState('demo-token');
  const [user, setUser] = useState({ name: 'Dr. Vance, DPT, OCS', role: 'clinician' });
  const [activeTab, setActiveTab] = useState('overview');
  const [kinematicsMeta, setKinematicsMeta] = useState({ patientName: 'Marcus Chen', sessionNo: '34' });
  const [toast, setToast] = useState({ visible: false, message: '', icon: '' });

  const showToast = (message, icon = 'check_circle') => {
    setToast({ visible: true, message, icon });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3200);
  };

  const handleNavigate = (tab, meta = null) => {
    if (meta && tab === 'kinematics') {
      setKinematicsMeta(meta);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!token) {
    return <LoginScreen onLoggedIn={(t, u) => { setToken(t); setUser(u); }} />;
  }

  return (
    <div className="bg-background min-h-screen flex flex-col font-body-md text-on-surface">
      {/* Top Fixed Header with Logo & Live Pulse */}
      <Header
        activeTab={activeTab}
        user={user}
        onLogout={() => { setToken(null); setUser(null); }}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-16">
        {activeTab === 'overview' && (
          <OverviewView
            onNavigate={handleNavigate}
            showToast={showToast}
          />
        )}
        {activeTab === 'patients' && (
          <PatientProfileView
            onNavigate={handleNavigate}
            showToast={showToast}
          />
        )}
        {activeTab === 'kinematics' && (
          <KinematicsPlayerView
            sessionMeta={kinematicsMeta}
            showToast={showToast}
          />
        )}
        {activeTab === 'protocol' && (
          <ProtocolBuilderView
            showToast={showToast}
          />
        )}
      </main>

      {/* Bottom Fixed Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => handleNavigate(tab)}
      />

      {/* Action Toast Notifications */}
      <ToastBanner toast={toast} />
    </div>
  );
}
