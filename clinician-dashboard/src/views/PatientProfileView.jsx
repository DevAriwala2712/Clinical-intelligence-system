import React, { useState, useEffect } from 'react';
import { api, metricLabel } from '../api';

export default function PatientProfileView({ token, patientId, onSelectPatient, onNavigate, showToast }) {
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState(patientId);
  const [patientData, setPatientData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ rehabGoal: '', injuryHistory: '', age: '', heightCm: '' });

  // Load patient roster if we need to let the user select a patient
  useEffect(() => {
    api.listPatients(token)
      .then((data) => {
        setPatients(data);
        if (!selectedId && data.length > 0) {
          setSelectedId(data[0].id);
        }
      })
      .catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    if (patientId) setSelectedId(patientId);
  }, [patientId]);

  const loadPatientDetails = async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [detail, progress, sessionList] = await Promise.all([
        api.getPatient(token, id),
        api.getPatientProgress(token, id).catch(() => null),
        api.getPatientSessions(token, id).catch(() => []),
      ]);
      setPatientData(detail);
      setProgressData(progress);
      setSessions(sessionList);
      setProfileForm({
        rehabGoal: detail.patient?.rehabGoal || '',
        injuryHistory: detail.patient?.injuryHistory || '',
        age: detail.patient?.age || '',
        heightCm: detail.patient?.heightCm || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load patient records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      loadPatientDetails(selectedId);
    }
  }, [selectedId, token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.updatePatientProfile(token, selectedId, {
        rehabGoal: profileForm.rehabGoal,
        injuryHistory: profileForm.injuryHistory,
        age: profileForm.age ? Number(profileForm.age) : null,
        heightCm: profileForm.heightCm ? Number(profileForm.heightCm) : null,
      });
      showToast('Patient clinical record updated', 'verified');
      setEditingProfile(false);
      loadPatientDetails(selectedId);
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const handleDiscontinueProgram = async (programId) => {
    if (!window.confirm('Are you sure you want to discontinue this active rehabilitation programme?')) return;
    try {
      await api.discontinueProgram(token, programId, 'Discontinued by treating clinician');
      showToast('Programme marked as discontinued', 'info');
      loadPatientDetails(selectedId);
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  if (!selectedId && patients.length === 0) {
    return (
      <div className="p-8 text-center bg-surface-container-lowest rounded-xl border border-surface-container">
        <p className="text-xs text-on-surface-variant">No patients assigned to your account yet. Return to the overview and link a patient.</p>
        <button
          onClick={() => onNavigate('overview')}
          className="mt-3 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
        >
          Go to Clinic Overview
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Patient Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">patient_list</span>
          <span className="text-xs font-bold text-on-surface">Select Patient Record:</span>
        </div>
        <select
          value={selectedId || ''}
          onChange={(e) => {
            const newId = Number(e.target.value);
            setSelectedId(newId);
            if (onSelectPatient) onSelectPatient(newId);
          }}
          className="bg-surface-container-low border border-surface-container rounded-lg px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.email})
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl animate-spin mb-2">progress_activity</span>
          <p className="text-xs">Loading patient dossier & longitudinal metrics...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      ) : (
        <>
          {/* Patient Profile Card */}
          <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center">
                  {patientData?.patient?.name?.charAt(0) || 'P'}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-on-surface">{patientData?.patient?.name}</h1>
                  <p className="text-xs text-on-surface-variant">{patientData?.patient?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
                <div>
                  <span className="text-on-surface-variant text-[11px] block">Age / Sex</span>
                  <span className="font-semibold text-on-surface">
                    {patientData?.patient?.age ? `${patientData.patient.age} yrs` : '—'} / {patientData?.patient?.sex || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-[11px] block">Height</span>
                  <span className="font-semibold text-on-surface">
                    {patientData?.patient?.heightCm ? `${patientData.patient.heightCm} cm` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-[11px] block">Raw Video Consent</span>
                  <span className={`font-semibold ${patientData?.patient?.videoUploadConsent ? 'text-green-700' : 'text-on-surface-variant'}`}>
                    {patientData?.patient?.videoUploadConsent ? 'Consented (On-device)' : 'No Consent (Protected)'}
                  </span>
                </div>
                <div>
                  <span className="text-on-surface-variant text-[11px] block">Program Status</span>
                  <span className="font-semibold text-primary">
                    {patientData?.activeProgram ? 'Active Protocol' : 'No Active Program'}
                  </span>
                </div>
              </div>

              <div className="pt-2 text-xs border-t border-surface-container space-y-1">
                <div>
                  <span className="font-semibold text-on-surface">Rehab Goal: </span>
                  <span className="text-on-surface-variant">{patientData?.patient?.rehabGoal || 'No goal stated yet.'}</span>
                </div>
                <div>
                  <span className="font-semibold text-on-surface">Clinical Injury / Surgical History: </span>
                  <span className="text-on-surface-variant">{patientData?.patient?.injuryHistory || 'No history recorded.'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => setEditingProfile(true)}
                className="px-3 py-1.5 border border-surface-container rounded-lg text-xs font-semibold hover:bg-surface-container text-on-surface flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                <span>Edit Profile</span>
              </button>
              <button
                onClick={() => onNavigate('protocol-builder', { patientId: selectedId })}
                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold shadow hover:bg-primary-container flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">assignment_add</span>
                <span>Assign / Modify Program</span>
              </button>
            </div>
          </section>

          {/* Edit Profile Modal */}
          {editingProfile && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-surface-container-lowest rounded-2xl p-6 max-w-lg w-full border border-surface-container shadow-xl">
                <h3 className="font-bold text-base text-on-surface mb-3">Edit Patient Clinical Profile</h3>
                <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-on-surface-variant font-semibold mb-1">Age</label>
                      <input
                        type="number"
                        value={profileForm.age}
                        onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                        className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2"
                      />
                    </div>
                    <div>
                      <label className="block text-on-surface-variant font-semibold mb-1">Height (cm)</label>
                      <input
                        type="number"
                        value={profileForm.heightCm}
                        onChange={(e) => setProfileForm({ ...profileForm, heightCm: e.target.value })}
                        className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1">Rehabilitation Goal</label>
                    <textarea
                      rows={2}
                      value={profileForm.rehabGoal}
                      onChange={(e) => setProfileForm({ ...profileForm, rehabGoal: e.target.value })}
                      className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-on-surface-variant font-semibold mb-1">Injury / Surgery History</label>
                    <textarea
                      rows={3}
                      value={profileForm.injuryHistory}
                      onChange={(e) => setProfileForm({ ...profileForm, injuryHistory: e.target.value })}
                      className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="px-4 py-2 border border-surface-container rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Active Programme Card */}
          <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">fitness_center</span>
                <h2 className="text-base font-bold text-on-surface">Prescribed Rehabilitation Program</h2>
              </div>
              {patientData?.activeProgram && (
                <button
                  onClick={() => handleDiscontinueProgram(patientData.activeProgram.id)}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold"
                >
                  Discontinue Program
                </button>
              )}
            </div>

            {!patientData?.activeProgram ? (
              <div className="text-center py-6 border border-dashed border-surface-container rounded-xl">
                <p className="text-xs text-on-surface-variant mb-2">No active program assigned to this patient.</p>
                <button
                  onClick={() => onNavigate('protocol-builder', { patientId: selectedId })}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow"
                >
                  Create & Assign Programme Now
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-surface-container-low rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-on-surface text-sm block">{patientData.activeProgram.pathwayName}</span>
                    <span className="text-on-surface-variant">
                      Prescribed Frequency: <strong className="text-on-surface">{patientData.activeProgram.sessionsPerWeek} sessions/week</strong> • Started: {new Date(patientData.activeProgram.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[11px] font-bold">
                    Active Prescription
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {patientData.activeProgram.exercises?.map((ex) => (
                    <div key={ex.programExerciseId} className="p-3.5 rounded-xl border border-surface-container bg-surface-container-lowest space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-on-surface">{ex.name}</span>
                        <span className="font-mono text-primary font-bold">{ex.sets} sets × {ex.repetitions} reps</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant">{ex.instructions}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-tertiary">
                        <span className="material-symbols-outlined text-xs">videocam</span>
                        <span>Camera: {ex.cameraView} view</span>
                      </div>

                      {/* Criteria */}
                      <div className="pt-1.5 border-t border-surface-container">
                        <span className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1">
                          Prescription Criteria
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {ex.criteria?.map((c, i) => (
                            <span
                              key={i}
                              className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                                c.overridden ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold' : 'bg-surface-container text-on-surface'
                              }`}
                              title={c.overridden ? 'Clinician override for this patient' : 'Catalog standard'}
                            >
                              {metricLabel(c.metricName)}: {c.targetValue !== null ? `target ${c.targetValue}` : ''}
                              {c.minimumValue !== null ? `min ${c.minimumValue}` : ''}
                              {c.maximumValue !== null ? `max ${c.maximumValue}` : ''} {c.unit || ''}
                              {c.overridden && ' ★'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Longitudinal Progress & Adherence Section */}
          {progressData && (
            <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">insights</span>
                  <h2 className="text-base font-bold text-on-surface">Longitudinal Evidence & Adherence Engine</h2>
                </div>
                {progressData.adherence && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-container text-on-surface">
                    14-Day Adherence: <strong className="text-primary">{progressData.adherence.rate !== null ? `${Math.round(progressData.adherence.rate * 100)}%` : 'Calibrating'}</strong> ({progressData.adherence.completedDays}/{progressData.adherence.expectedDays} target days)
                  </span>
                )}
              </div>

              {/* Per-Exercise Longitudinal Analysis */}
              <div className="space-y-3">
                {progressData.exercises?.map((item) => {
                  const a = item.analysis;
                  if (!a) return null;
                  return (
                    <div key={item.exerciseId} className="p-4 rounded-xl border border-surface-container bg-surface-container-low text-xs space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-sm text-on-surface">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              a.trend === 'IMPROVING'
                                ? 'bg-green-100 text-green-800'
                                : a.trend === 'DETERIORATING'
                                ? 'bg-red-100 text-red-800'
                                : a.trend === 'PLATEAU'
                                ? 'bg-amber-100 text-amber-800'
                                : a.trend === 'INCONSISTENT'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-surface-container-high text-on-surface'
                            }`}
                          >
                            Trend: {a.trend || 'INSUFFICIENT DATA'}
                          </span>
                          <span className="text-[11px] text-on-surface-variant">
                            ({a.assessedSessionCount}/{a.totalSessionCount} sessions assessed)
                          </span>
                        </div>
                      </div>

                      {/* Explanation lines */}
                      {a.explanation?.map((line, idx) => (
                        <p key={idx} className="text-on-surface text-xs leading-relaxed">
                          • {line}
                        </p>
                      ))}

                      {/* Numerical Medians */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-surface-container text-[11px]">
                        <div>
                          <span className="text-on-surface-variant block">Recent Median Quality</span>
                          <span className="font-mono font-bold text-on-surface">{a.recentMedian !== null ? `${a.recentMedian}/100` : '—'}</span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant block">Earlier Median Quality</span>
                          <span className="font-mono font-bold text-on-surface">{a.earlierMedian !== null ? `${a.earlierMedian}/100` : '—'}</span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant block">Recent Pain Rating</span>
                          <span className="font-mono font-bold text-on-surface">{a.pain?.recentMedian !== null ? `${a.pain.recentMedian}/10` : '—'} ({a.pain?.trend || 'stable'})</span>
                        </div>
                        <div>
                          <span className="text-on-surface-variant block">Recent Difficulty</span>
                          <span className="font-mono font-bold text-on-surface">{a.difficulty?.recentMedian !== null ? `${a.difficulty.recentMedian}/10` : '—'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Session History & Evidence Table */}
          <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">history</span>
                <h2 className="text-base font-bold text-on-surface">Movement Sessions & Clinical Evidence</h2>
              </div>
              <span className="text-xs text-on-surface-variant">{sessions.length} records</span>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-surface-container rounded-xl">
                <p className="text-xs text-on-surface-variant">No sessions submitted yet by the patient.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-container text-on-surface-variant font-semibold">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Exercise</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Quality Score</th>
                      <th className="py-2.5 px-3">Errors</th>
                      <th className="py-2.5 px-3">Self-Report</th>
                      <th className="py-2.5 px-3">Review</th>
                      <th className="py-2.5 px-3 text-right">Evidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3 px-3 font-mono text-[11px]">
                          {new Date(s.sessionDate).toLocaleDateString()} {new Date(s.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-semibold text-on-surface">
                          {s.exerciseName}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              s.status === 'VALID'
                                ? 'bg-green-100 text-green-800'
                                : s.status === 'PARTIAL'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {s.status}
                          </span>
                          {s.abstainReason && (
                            <span className="text-[10px] text-on-surface-variant block mt-0.5 max-w-xs truncate" title={s.abstainReason}>
                              {s.abstainReason}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {s.effectiveScore !== null ? (
                            <div className="font-mono font-bold text-sm text-on-surface">
                              {s.effectiveScore}
                              {s.correctedScore !== null && (
                                <span className="text-[10px] text-tertiary block font-normal">(corrected from {s.overallScore})</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-on-surface-variant font-mono">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-mono ${s.errorCount > 0 ? 'text-red-700 font-bold' : 'text-on-surface-variant'}`}>
                            {s.errorCount || 0} flagged
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-on-surface-variant">
                          <div>Pain: <strong className="text-on-surface">{s.pain !== null ? s.pain : '—'}</strong>/10</div>
                          <div>Diff: <strong className="text-on-surface">{s.difficulty !== null ? s.difficulty : '—'}</strong>/10</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              s.reviewed ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {s.reviewed ? 'Reviewed' : 'Unreviewed'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onNavigate('kinematics', { sessionId: s.id })}
                            className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg shadow hover:bg-primary-container"
                          >
                            Inspect Kinematics
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
