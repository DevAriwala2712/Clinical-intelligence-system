import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function OverviewView({ token, user, onNavigate, showToast }) {
  const [patients, setPatients] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [linkEmail, setLinkEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [patientsData, suggestionsData] = await Promise.all([
        api.listPatients(token),
        api.listSuggestions(token, 'PENDING,OBSERVE'),
      ]);
      setPatients(patientsData);
      setSuggestions(suggestionsData);
    } catch (err) {
      setError(err.message || 'Failed to load clinic overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleApproveSuggestion = async (s) => {
    try {
      await api.approveSuggestion(token, s.id, {});
      showToast(`Approved progression for ${s.patientName} (${s.exerciseName})`, 'verified');
      loadData();
    } catch (err) {
      showToast(err.message || 'Approval failed', 'error');
    }
  };

  const handleRejectSuggestion = async (s) => {
    try {
      await api.rejectSuggestion(token, s.id, 'Declined by clinician');
      showToast(`Rejected suggestion for ${s.patientName}`, 'info');
      loadData();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleObserveSuggestion = async (s) => {
    try {
      await api.observeSuggestion(token, s.id, 'Under continuous observation');
      showToast(`Marked ${s.patientName}'s review for observation`, 'info');
      loadData();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleLinkPatient = async (e) => {
    e.preventDefault();
    if (!linkEmail.trim()) return;
    setLinking(true);
    try {
      const linked = await api.linkPatient(token, linkEmail.trim());
      showToast(`Patient ${linked.name} linked successfully`, 'verified');
      setLinkEmail('');
      setShowLinkModal(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Could not link patient', 'error');
    } finally {
      setLinking(false);
    }
  };

  const totalUnreviewed = patients.reduce((acc, p) => acc + (p.unreviewedSessions || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl animate-spin mb-2">progress_activity</span>
        <p className="text-sm">Loading clinic overview...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header Greeting Banner */}
      <section className="bg-surface-container-low rounded-xl p-5 shadow-sm border border-surface-container flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-tertiary tracking-wider">
            Clinical Rehabilitation Station
          </span>
          <h1 className="text-xl md:text-2xl font-bold text-on-surface mt-1">
            Welcome, {user?.name || 'Dr. Clinician'}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Prescription-driven movement analysis & longitudinal progression management
          </p>
        </div>

        <button
          onClick={() => setShowLinkModal(true)}
          className="self-start md:self-auto px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow hover:bg-primary-container transition-all flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          <span>Assign Patient by Email</span>
        </button>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant text-xs font-semibold">
            <span>Assigned Patients</span>
            <span className="material-symbols-outlined text-primary text-xl">groups</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-on-surface">{patients.length}</span>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Active under your clinical care</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant text-xs font-semibold">
            <span>Pending Progression Reviews</span>
            <span className="material-symbols-outlined text-secondary text-xl">trending_up</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-on-surface">{suggestions.length}</span>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Awaiting clinical approval / rejection</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant text-xs font-semibold">
            <span>Unreviewed Sessions</span>
            <span className="material-symbols-outlined text-amber-600 text-xl">rate_review</span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-on-surface">{totalUnreviewed}</span>
            <p className="text-[11px] text-on-surface-variant mt-0.5">Recent sessions with unverified feedback</p>
          </div>
        </div>
      </section>

      {/* Link Patient Modal / Form */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-md w-full border border-surface-container shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-on-surface">Assign Patient Account</h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">
              Enter the patient's registered account email to link them to your clinical panel:
            </p>
            <form onSubmit={handleLinkPatient} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={linkEmail}
                  onChange={(e) => setLinkEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full bg-surface-container-low border border-surface-container rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 border border-surface-container text-xs rounded-xl hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linking}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow disabled:opacity-50"
                >
                  {linking ? 'Assigning...' : 'Assign Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pending Progression Review Queue */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">recommend</span>
            <h2 className="text-base font-bold text-on-surface">Longitudinal Progression Suggestions</h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {suggestions.length} Pending
          </span>
        </div>

        {suggestions.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-surface-container rounded-xl">
            <p className="text-xs text-on-surface-variant">
              No pending progression suggestions. The longitudinal engine will prompt when adherence and quality justify progression or when pain/deterioration requires review.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl border border-surface-container bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-on-surface">{s.patientName}</span>
                    <span className="text-xs text-on-surface-variant">• {s.exerciseName}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.kind === 'PROGRESS'
                          ? 'bg-green-100 text-green-800'
                          : s.kind === 'REVIEW_PAIN'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.kind}
                    </span>
                    {s.status === 'OBSERVE' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        OBSERVING
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-primary">{s.suggestion}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{s.reason}</p>

                  {s.proposedSets && s.proposedRepetitions && (
                    <div className="mt-2 text-xs text-on-surface-variant flex items-center gap-2">
                      <span className="font-mono">Current: {s.currentSets} sets × {s.currentRepetitions} reps</span>
                      <span>→</span>
                      <span className="font-mono font-bold text-green-700">
                        Proposed: {s.proposedSets} sets × {s.proposedRepetitions} reps
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleApproveSuggestion(s)}
                    className="px-3 py-1.5 bg-green-700 text-white text-xs font-semibold rounded-lg shadow hover:bg-green-800 transition-all flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleObserveSuggestion(s)}
                    className="px-3 py-1.5 bg-surface-container text-on-surface text-xs font-semibold rounded-lg hover:bg-surface-container-high transition-all"
                  >
                    Observe
                  </button>
                  <button
                    onClick={() => handleRejectSuggestion(s)}
                    className="px-3 py-1.5 border border-red-300 text-red-700 text-xs font-semibold rounded-lg hover:bg-red-50 transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Patient List */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">folder_shared</span>
            <h2 className="text-base font-bold text-on-surface">Patient Cohort</h2>
          </div>
          <span className="text-xs text-on-surface-variant">{patients.length} enrolled</span>
        </div>

        {patients.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-surface-container rounded-xl">
            <p className="text-xs text-on-surface-variant">No patients assigned yet. Use the "Assign Patient by Email" button above to link your first patient.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Profile</th>
                  <th className="py-2.5 px-3">Rehab Goal</th>
                  <th className="py-2.5 px-3">Last Session</th>
                  <th className="py-2.5 px-3">Pending Action</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-sm text-on-surface">{p.name}</div>
                      <div className="text-[11px] text-on-surface-variant">{p.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div>{p.age ? `${p.age} yrs` : '—'}, {p.sex || '—'}</div>
                      <div className="text-[11px] text-on-surface-variant">{p.heightCm ? `${p.heightCm} cm` : ''}</div>
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate" title={p.rehabGoal}>
                      {p.rehabGoal || 'Not specified'}
                    </td>
                    <td className="py-3 px-3">
                      {p.lastSessionAt ? new Date(p.lastSessionAt).toLocaleDateString() : 'No sessions yet'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.pendingSuggestions > 0 && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {p.pendingSuggestions} review{p.pendingSuggestions > 1 ? 's' : ''}
                          </span>
                        )}
                        {p.unreviewedSessions > 0 && (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {p.unreviewedSessions} unreviewed
                          </span>
                        )}
                        {p.pendingSuggestions === 0 && p.unreviewedSessions === 0 && (
                          <span className="text-on-surface-variant text-[11px]">Up to date</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => onNavigate('patient-profile', { patientId: p.id })}
                        className="px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary/20 transition-all text-xs"
                      >
                        Open Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
