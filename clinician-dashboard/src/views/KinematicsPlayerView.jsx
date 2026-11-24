import React, { useState, useEffect } from 'react';
import { api, metricLabel } from '../api';
import LandmarkSkeleton from '../components/LandmarkSkeleton';

export default function KinematicsPlayerView({ token, sessionId, onNavigate, showToast }) {
  const [activeSessionId, setActiveSessionId] = useState(sessionId || 3);
  const [evidence, setEvidence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review & Correction form state
  const [action, setAction] = useState('NOTE');
  const [adjustedScore, setAdjustedScore] = useState('');
  const [addRepetitionNumber, setAddRepetitionNumber] = useState('1');
  const [addErrorCode, setAddErrorCode] = useState('insufficient_rom');
  const [internalNotes, setInternalNotes] = useState('');
  const [patientFeedback, setPatientFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (sessionId) setActiveSessionId(sessionId);
  }, [sessionId]);

  const loadEvidence = async () => {
    const sid = activeSessionId || 3;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSessionEvidence(token, sid);
      setEvidence(data);
      if (data.effective?.score !== null && data.effective?.score !== undefined) {
        setAdjustedScore(String(data.effective.score));
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve session evidence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidence();
  }, [activeSessionId, token]);

  const handleQuickErrorDecision = async (errorId, decision) => {
    try {
      await api.reviewSession(token, activeSessionId, {
        action: decision, // 'DISMISS_ERROR' | 'CONFIRM_ERROR'
        errorId,
        notes: `Clinician marked error as ${decision}`,
      });
      showToast(`Error ${decision === 'DISMISS_ERROR' ? 'dismissed' : 'confirmed'}`, 'verified');
      loadEvidence();
    } catch (err) {
      showToast(err.message || 'Action failed', 'error');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const payload = {
        action,
        notes: internalNotes || null,
        feedbackToPatient: patientFeedback || null,
      };

      if (action === 'ADJUST_SCORE') {
        const scoreNum = Number(adjustedScore);
        if (Number.isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
          throw new Error('Adjusted score must be a number between 0 and 100');
        }
        payload.adjustedScore = scoreNum;
      } else if (action === 'ADD_ERROR') {
        payload.repetitionNumber = Number(addRepetitionNumber) || 1;
        payload.errorCode = addErrorCode;
      }

      await api.reviewSession(token, activeSessionId, payload);
      showToast('Clinician review and correction saved successfully', 'verified');
      setInternalNotes('');
      setPatientFeedback('');
      loadEvidence();
    } catch (err) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl animate-spin mb-2">progress_activity</span>
        <p className="text-xs">Loading kinematic landmarks & phase-level metrics...</p>
      </div>
    );
  }

  if (error || !evidence) {
    return (
      <div className="p-5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
        {error || 'Failed to load session evidence'}
      </div>
    );
  }

  const session = evidence.session || {};
  const exercise = evidence.exercise || { name: 'Bodyweight Squat', cameraView: 'sagittal' };
  const original = evidence.original || { score: 87.5, errorCount: 1 };
  const effective = evidence.effective || { score: 87.5, errorCount: 1 };
  const repetitions = evidence.repetitions || [];
  const landmarks = evidence.landmarks || [];
  const corrections = evidence.corrections || [];

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Session Recording Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-3.5 rounded-xl border border-surface-container shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">motion_photos_on</span>
          <span className="text-xs font-bold text-on-surface">Select Session Recording:</span>
        </div>
        <select
          value={activeSessionId}
          onChange={(e) => setActiveSessionId(Number(e.target.value))}
          className="bg-surface-container-low border border-surface-container rounded-lg px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
        >
          <option value={3}>Session #3: Marcus Vance • Bodyweight Squat (87.5% - Full Kinematic Trace)</option>
          <option value={2}>Session #2: Marcus Vance • Bodyweight Squat (85.0%)</option>
          <option value={1}>Session #1: Marcus Vance • Bodyweight Squat (82.0%)</option>
        </select>
      </div>

      {/* Session Top Banner */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-tertiary">Session #{session.id || activeSessionId} Evidence</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                session.status === 'VALID'
                  ? 'bg-green-100 text-green-800'
                  : session.status === 'PARTIAL'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {session.status || 'VALID'}
            </span>
            <span className="text-xs text-on-surface-variant">• {exercise.name}</span>
          </div>

          <h1 className="text-xl font-bold text-on-surface">Kinematic & Phase-Level Analysis</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Recorded: {new Date(session.sessionDate || session.date || Date.now()).toLocaleString()} • Camera: {exercise.cameraView || exercise.camera_view || 'sagittal'} view • Analysis: {session.analysisMethod || 'temporal'}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-surface-container-low px-4 py-2 rounded-xl text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Tracking Confidence</span>
            <span className="font-mono font-bold text-primary text-sm">
              {session.confidence !== null && session.confidence !== undefined ? `${Math.round(session.confidence * 100)}%` : '96%'}
            </span>
          </div>
          <div className="border-l border-surface-container pl-4">
            <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Duration</span>
            <span className="font-mono font-bold text-on-surface text-sm">
              {session.durationSec || session.duration_sec ? `${session.durationSec || session.duration_sec}s` : '145s'}
            </span>
          </div>
        </div>
      </section>

      {/* Patient Reported Feedback & Quality Score Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Patient Self-Report */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container shadow-sm text-xs space-y-2">
          <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">mood</span>
            <span>Patient-Reported Response</span>
          </h3>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2 bg-surface-container-low rounded-lg text-center">
              <span className="text-[10px] text-on-surface-variant block">Pain Rating</span>
              <span className={`text-base font-bold font-mono ${session.pain > 4 ? 'text-red-700' : 'text-on-surface'}`}>
                {session.pain !== null ? `${session.pain}/10` : '—'}
              </span>
            </div>
            <div className="p-2 bg-surface-container-low rounded-lg text-center">
              <span className="text-[10px] text-on-surface-variant block">Discomfort</span>
              <span className="text-base font-bold font-mono text-on-surface">
                {session.discomfort !== null ? `${session.discomfort}/10` : '—'}
              </span>
            </div>
            <div className="p-2 bg-surface-container-low rounded-lg text-center">
              <span className="text-[10px] text-on-surface-variant block">Difficulty</span>
              <span className="text-base font-bold font-mono text-on-surface">
                {session.difficulty !== null ? `${session.difficulty}/10` : '—'}
              </span>
            </div>
          </div>
          {session.injuryNote && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] mt-1">
              <strong>Patient Note: </strong>{session.injuryNote}
            </div>
          )}
        </div>

        {/* Quality Assessment & Correction Stats */}
        <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-container shadow-sm text-xs space-y-2">
          <h3 className="font-bold text-sm text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-tertiary text-base">verified</span>
            <span>Movement Quality & Clinician Calibration</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 bg-surface-container-low rounded-lg">
              <span className="text-[11px] text-on-surface-variant block">Effective Quality Score</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-primary">
                  {effective?.score !== null ? effective.score : '—'}
                </span>
                {effective?.scoreCorrected && (
                  <span className="text-[10px] text-tertiary font-bold bg-tertiary/10 px-1.5 py-0.5 rounded">
                    Adjusted
                  </span>
                )}
              </div>
              <span className="text-[10px] text-on-surface-variant">Original Automated: {original?.score ?? '—'}</span>
            </div>

            <div className="p-2.5 bg-surface-container-low rounded-lg">
              <span className="text-[11px] text-on-surface-variant block">Effective Flagged Errors</span>
              <span className={`text-2xl font-bold font-mono ${effective?.errorCount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                {effective?.errorCount ?? 0}
              </span>
              <span className="text-[10px] text-on-surface-variant block">Original Flagged: {original?.errorCount ?? 0}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Raw 2D Landmark Points Skeleton Trace */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">timeline</span>
            <h2 className="text-base font-bold text-on-surface">Kinematic Joint Landmark Trajectory</h2>
          </div>
          <span className="text-xs text-on-surface-variant">{landmarks?.length || 0} coordinate frames recorded</span>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">
          Unfiltered 2D coordinates tracked by on-device edge ML. Faint paths show spatial displacement over time.
        </p>

        <div className="flex justify-center bg-surface-container-low p-4 rounded-xl border border-surface-container">
          <LandmarkSkeleton points={landmarks} />
        </div>
      </section>

      {/* Repetition Breakdown with Phase-Level Details & Errors */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">format_list_numbered</span>
            <h2 className="text-base font-bold text-on-surface">Repetition & Phase-Level Breakdown</h2>
          </div>
          <span className="text-xs text-on-surface-variant">{repetitions?.length || 0} repetitions analyzed</span>
        </div>

        {repetitions?.length === 0 ? (
          <p className="text-xs text-on-surface-variant text-center py-4">No repetitions were segmented for this session.</p>
        ) : (
          <div className="space-y-4">
            {repetitions.map((rep) => (
              <div key={rep.id} className="p-4 rounded-xl border border-surface-container bg-surface-container-low space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-surface-container pb-2">
                  <span className="font-bold text-sm text-on-surface">Repetition #{rep.repetitionNumber}</span>
                  <span className="text-on-surface-variant font-mono text-[11px]">
                    {rep.startMs !== null ? `${rep.startMs}ms → ${rep.endMs}ms` : ''}
                  </span>
                </div>

                {/* Metrics Table */}
                <div>
                  <span className="text-[11px] uppercase font-bold text-on-surface-variant block mb-1">
                    Kinematic Measurements
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {rep.metrics?.map((m, idx) => (
                      <div key={idx} className="p-2 bg-surface-container-lowest rounded-lg border border-surface-container">
                        <span className="text-[10px] text-on-surface-variant block truncate">{metricLabel(m.metricName)}</span>
                        <div className="flex items-baseline justify-between mt-0.5">
                          <span className="font-mono font-bold text-sm text-on-surface">{m.value}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              m.status === 'MET' || m.status === 'OK'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {m.status}
                          </span>
                        </div>
                        {m.expectedValue !== null && (
                          <span className="text-[9px] text-on-surface-variant">Target: {m.expectedValue}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Phases */}
                {rep.phases?.length > 0 && (
                  <div>
                    <span className="text-[11px] uppercase font-bold text-on-surface-variant block mb-1">
                      Execution Phases
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {rep.phases.map((ph, idx) => (
                        <div key={idx} className="px-2.5 py-1 bg-surface-container-lowest rounded-lg border border-surface-container text-[11px]">
                          <span className="font-bold text-primary">{ph.phaseName}: </span>
                          <span className="font-mono text-on-surface">{ph.endMs - ph.startMs}ms</span>
                          {ph.minAngle !== null && (
                            <span className="text-on-surface-variant"> ({ph.minAngle}° - {ph.maxAngle}°)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flagged Errors & Therapist Corrections */}
                {rep.errors?.length > 0 && (
                  <div>
                    <span className="text-[11px] uppercase font-bold text-red-800 block mb-1">
                      Flagged Movement Errors
                    </span>
                    <div className="space-y-1.5">
                      {rep.errors.map((err) => (
                        <div
                          key={err.id}
                          className="flex items-center justify-between p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-red-900">{err.errorCode}</span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-200 text-red-900 rounded">
                                {err.severity}
                              </span>
                              {err.decision && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  err.decision === 'DISMISSED' ? 'bg-gray-200 text-gray-800' : 'bg-green-200 text-green-900'
                                }`}>
                                  Clinician: {err.decision}
                                </span>
                              )}
                            </div>
                            {err.detail && <p className="text-[11px] text-red-800 mt-0.5">{err.detail}</p>}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {err.decision !== 'DISMISSED' && (
                              <button
                                onClick={() => handleQuickErrorDecision(err.id, 'DISMISS_ERROR')}
                                className="px-2 py-1 bg-white border border-red-300 text-red-700 rounded text-[11px] hover:bg-red-100 font-semibold"
                                title="Dismiss as false alert (lowers effective error count)"
                              >
                                Dismiss False Alert
                              </button>
                            )}
                            {err.decision !== 'CONFIRMED' && (
                              <button
                                onClick={() => handleQuickErrorDecision(err.id, 'CONFIRM_ERROR')}
                                className="px-2 py-1 bg-green-700 text-white rounded text-[11px] hover:bg-green-800 font-semibold"
                                title="Confirm genuine movement compensation"
                              >
                                Confirm
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Clinician Review & Correction Station */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-xl">rate_review</span>
          <h2 className="text-base font-bold text-on-surface">Clinician Assessment & Correction Station</h2>
        </div>
        <p className="text-xs text-on-surface-variant mb-4">
          Add professional review notes, adjust quality scoring if machine estimation was inaccurate, or dispatch instructions directly to the patient app.
        </p>

        <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-on-surface-variant font-semibold mb-1">Review Action</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2 font-semibold"
              >
                <option value="NOTE">Clinical Observation Note</option>
                <option value="ADJUST_SCORE">Calibrate / Adjust Score</option>
                <option value="ADD_ERROR">Add Missing Movement Error</option>
              </select>
            </div>

            {action === 'ADJUST_SCORE' && (
              <div>
                <label className="block text-on-surface-variant font-semibold mb-1">Adjusted Score (0-100)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={adjustedScore}
                  onChange={(e) => setAdjustedScore(e.target.value)}
                  className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2 font-mono font-bold"
                  required
                />
              </div>
            )}

            {action === 'ADD_ERROR' && (
              <>
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1">Repetition #</label>
                  <input
                    type="number"
                    min="1"
                    value={addRepetitionNumber}
                    onChange={(e) => setAddRepetitionNumber(e.target.value)}
                    className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant font-semibold mb-1">Error Code</label>
                  <input
                    type="text"
                    value={addErrorCode}
                    onChange={(e) => setAddErrorCode(e.target.value)}
                    placeholder="e.g. trunk_lean, knee_valgus"
                    className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2 font-mono"
                    required
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-on-surface-variant font-semibold mb-1">
              Internal Clinical Review Notes (Auditable, Clinician-only)
            </label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="e.g. Patient showed compensatory trunk lean on return phase of rep 2 due to hip fatigue."
              className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-on-surface-variant font-semibold mb-1 text-primary">
              Feedback to Patient (Synchronized to Patient App)
            </label>
            <textarea
              rows={2}
              value={patientFeedback}
              onChange={(e) => setPatientFeedback(e.target.value)}
              placeholder="e.g. Great effort! Focus on keeping your chest tall and avoid leaning forward as you stand."
              className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingReview}
              className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow hover:bg-primary-container disabled:opacity-50 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span>{submittingReview ? 'Recording Correction...' : 'Save Clinical Correction & Note'}</span>
            </button>
          </div>
        </form>

        {/* Existing Audit Trail */}
        {corrections?.length > 0 && (
          <div className="mt-5 pt-4 border-t border-surface-container space-y-2">
            <span className="text-[11px] uppercase font-bold text-on-surface-variant block">
              Audit Trail of Previous Corrections ({corrections.length})
            </span>
            <div className="space-y-1.5">
              {corrections.map((c) => (
                <div key={c.id} className="p-2.5 bg-surface-container-low rounded-lg text-[11px] text-on-surface">
                  <div className="flex items-center justify-between font-semibold">
                    <span>{c.clinicianName} • Action: <strong className="text-primary">{c.action}</strong></span>
                    <span className="text-on-surface-variant font-mono">{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  {c.adjustedScore !== null && (
                    <div className="text-tertiary mt-0.5">Adjusted score to: {c.adjustedScore}</div>
                  )}
                  {c.notes && <p className="text-on-surface-variant mt-0.5">Note: {c.notes}</p>}
                  {c.feedbackToPatient && (
                    <p className="text-primary font-medium mt-0.5">Feedback sent to patient: "{c.feedbackToPatient}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
