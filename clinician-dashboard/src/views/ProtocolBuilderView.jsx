import React, { useState, useEffect } from 'react';
import { api, metricLabel } from '../api';

export default function ProtocolBuilderView({ token, patientId, onNavigate, showToast }) {
  const [patients, setPatients] = useState([]);
  const [pathways, setPathways] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
  const [selectedPathwayId, setSelectedPathwayId] = useState('');
  const [sessionsPerWeek, setSessionsPerWeek] = useState(3);
  const [selectedExercises, setSelectedExercises] = useState([]); // [{ exerciseId, sets, repetitions, criteria: [...] }]
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const [patList, pathList, exList] = await Promise.all([
          api.listPatients(token),
          api.listPathways(token),
          api.listExercises(token),
        ]);
        setPatients(patList);
        setPathways(pathList);
        setExercises(exList);

        if (!selectedPatientId && patList.length > 0) {
          setSelectedPatientId(patList[0].id);
        }

        if (pathList.length > 0) {
          const defaultPathway = pathList[0];
          setSelectedPathwayId(defaultPathway.id);
          // Pre-populate with pathway's exercises
          const initialExs = exList.filter((e) => defaultPathway.exerciseIds?.includes(e.id)).map((e, idx) => ({
            exerciseId: e.id,
            name: e.name,
            sets: 3,
            repetitions: 10,
            orderNumber: idx + 1,
            criteria: e.criteria?.map((c) => ({
              metricName: c.metricName,
              targetValue: c.targetValue,
              minimumValue: c.minimumValue,
              maximumValue: c.maximumValue,
              unit: c.unit,
            })) || [],
          }));
          setSelectedExercises(initialExs);
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize protocol builder');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [token]);

  const handlePathwayChange = (newPathwayId) => {
    setSelectedPathwayId(newPathwayId);
    const pw = pathways.find((p) => p.id === Number(newPathwayId));
    if (pw) {
      const newExs = exercises.filter((e) => pw.exerciseIds?.includes(e.id)).map((e, idx) => ({
        exerciseId: e.id,
        name: e.name,
        sets: 3,
        repetitions: 10,
        orderNumber: idx + 1,
        criteria: e.criteria?.map((c) => ({
          metricName: c.metricName,
          targetValue: c.targetValue,
          minimumValue: c.minimumValue,
          maximumValue: c.maximumValue,
          unit: c.unit,
        })) || [],
      }));
      setSelectedExercises(newExs);
    }
  };

  const handleToggleExercise = (ex) => {
    const exists = selectedExercises.some((item) => item.exerciseId === ex.id);
    if (exists) {
      if (selectedExercises.length === 1) {
        showToast('A programme must contain at least one exercise', 'error');
        return;
      }
      setSelectedExercises(selectedExercises.filter((item) => item.exerciseId !== ex.id));
    } else {
      if (selectedExercises.length >= 8) {
        showToast('A programme can contain at most 8 exercises', 'error');
        return;
      }
      setSelectedExercises([
        ...selectedExercises,
        {
          exerciseId: ex.id,
          name: ex.name,
          sets: 3,
          repetitions: 10,
          orderNumber: selectedExercises.length + 1,
          criteria: ex.criteria?.map((c) => ({
            metricName: c.metricName,
            targetValue: c.targetValue,
            minimumValue: c.minimumValue,
            maximumValue: c.maximumValue,
            unit: c.unit,
          })) || [],
        },
      ]);
    }
  };

  const updateExerciseConfig = (exerciseId, field, value) => {
    setSelectedExercises((prev) =>
      prev.map((ex) => (ex.exerciseId === exerciseId ? { ...ex, [field]: value } : ex))
    );
  };

  const updateCriterionValue = (exerciseId, metricName, field, value) => {
    setSelectedExercises((prev) =>
      prev.map((ex) => {
        if (ex.exerciseId !== exerciseId) return ex;
        const newCriteria = ex.criteria.map((c) => {
          if (c.metricName !== metricName) return c;
          return {
            ...c,
            [field]: value === '' ? null : Number(value),
          };
        });
        return { ...ex, criteria: newCriteria };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      showToast('Please select a patient for this prescription', 'error');
      return;
    }
    if (selectedExercises.length === 0) {
      showToast('Select at least one exercise', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        patientId: Number(selectedPatientId),
        pathwayId: Number(selectedPathwayId),
        sessionsPerWeek: Number(sessionsPerWeek),
        exercises: selectedExercises.map((ex, idx) => ({
          exerciseId: ex.exerciseId,
          sets: Number(ex.sets),
          repetitions: Number(ex.repetitions),
          orderNumber: idx + 1,
          criteria: ex.criteria.map((c) => ({
            metricName: c.metricName,
            targetValue: c.targetValue !== null ? Number(c.targetValue) : null,
            minimumValue: c.minimumValue !== null ? Number(c.minimumValue) : null,
            maximumValue: c.maximumValue !== null ? Number(c.maximumValue) : null,
          })),
        })),
      };

      const res = await api.createProgram(token, payload);
      showToast('Rehabilitation programme assigned and active for patient', 'verified');
      onNavigate('patient-profile', { patientId: Number(selectedPatientId) });
    } catch (err) {
      showToast(err.message || 'Failed to assign programme', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl animate-spin mb-2">progress_activity</span>
        <p className="text-xs">Loading exercise catalog & clinical criteria...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-6">
      {/* Header Banner */}
      <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary text-xl">assignment_add</span>
          <span className="text-xs uppercase font-bold text-tertiary">Clinical Program Assignment</span>
        </div>
        <h1 className="text-xl font-bold text-on-surface">Rehabilitation Program & Criteria Builder</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Select pathway, configure patient-specific range of motion targets, tempo limits, and assign frequency.
        </p>
      </section>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Prescription Target Section */}
        <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-on-surface border-b border-surface-container pb-2">
            1. Patient & Pathway Prescription
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-on-surface-variant font-semibold mb-1">Assign to Patient</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2 font-semibold"
                required
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-on-surface-variant font-semibold mb-1">Rehabilitation Pathway</label>
              <select
                value={selectedPathwayId}
                onChange={(e) => handlePathwayChange(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2 font-semibold"
                required
              >
                {pathways.map((pw) => (
                  <option key={pw.id} value={pw.id}>
                    {pw.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-on-surface-variant font-semibold mb-1">Prescribed Frequency (Sessions / Week)</label>
              <input
                type="number"
                min="1"
                max="7"
                value={sessionsPerWeek}
                onChange={(e) => setSessionsPerWeek(e.target.value)}
                className="w-full bg-surface-container-low border border-surface-container rounded-lg p-2 font-mono font-bold"
                required
              />
            </div>
          </div>
        </section>

        {/* Exercise Selection Catalog */}
        <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-surface-container pb-2">
            <h2 className="text-sm font-bold text-on-surface">2. Select Supported Exercises</h2>
            <span className="text-on-surface-variant">{selectedExercises.length} selected</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exercises.map((ex) => {
              const isSelected = selectedExercises.some((item) => item.exerciseId === ex.id);
              return (
                <div
                  key={ex.id}
                  onClick={() => handleToggleExercise(ex)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-surface-container bg-surface-container-low opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-on-surface">{ex.name}</span>
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                        isSelected ? 'bg-primary text-white' : 'border border-surface-container bg-surface-container-lowest'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2">{ex.description}</p>
                  <div className="mt-2 text-[10px] text-tertiary flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">videocam</span>
                    <span>Camera: {ex.cameraView} view</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Prescription Criteria & Volume Configuration */}
        <section className="bg-surface-container-lowest rounded-xl p-5 border border-surface-container shadow-sm space-y-4 text-xs">
          <h2 className="text-sm font-bold text-on-surface border-b border-surface-container pb-2">
            3. Prescription Criteria & Target Volume per Exercise
          </h2>

          <div className="space-y-4">
            {selectedExercises.map((item) => (
              <div
                key={item.exerciseId}
                className="p-4 rounded-xl border border-surface-container bg-surface-container-low space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container pb-2">
                  <span className="font-bold text-sm text-on-surface">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-on-surface-variant font-semibold">Sets:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={item.sets}
                        onChange={(e) => updateExerciseConfig(item.exerciseId, 'sets', Number(e.target.value))}
                        className="w-16 bg-surface-container-lowest border border-surface-container rounded-lg p-1.5 font-mono text-center font-bold"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-on-surface-variant font-semibold">Reps:</span>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={item.repetitions}
                        onChange={(e) => updateExerciseConfig(item.exerciseId, 'repetitions', Number(e.target.value))}
                        className="w-16 bg-surface-container-lowest border border-surface-container rounded-lg p-1.5 font-mono text-center font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Criteria overrides */}
                <div>
                  <span className="text-[11px] uppercase font-bold text-on-surface-variant block mb-2">
                    Calibrated Criteria Thresholds (Clinician Overrides)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {item.criteria?.map((c) => (
                      <div
                        key={c.metricName}
                        className="p-2.5 bg-surface-container-lowest rounded-lg border border-surface-container text-[11px] space-y-1"
                      >
                        <span className="font-semibold text-on-surface block truncate">
                          {metricLabel(c.metricName)} ({c.unit || ''})
                        </span>

                        <div className="grid grid-cols-3 gap-1 pt-1">
                          {c.targetValue !== undefined && (
                            <div>
                              <span className="text-[9px] text-on-surface-variant block">Target</span>
                              <input
                                type="number"
                                step="any"
                                value={c.targetValue !== null ? c.targetValue : ''}
                                onChange={(e) => updateCriterionValue(item.exerciseId, c.metricName, 'targetValue', e.target.value)}
                                className="w-full bg-surface-container-low border border-surface-container rounded p-1 text-xs font-mono"
                                placeholder="default"
                              />
                            </div>
                          )}
                          {c.minimumValue !== undefined && (
                            <div>
                              <span className="text-[9px] text-on-surface-variant block">Min</span>
                              <input
                                type="number"
                                step="any"
                                value={c.minimumValue !== null ? c.minimumValue : ''}
                                onChange={(e) => updateCriterionValue(item.exerciseId, c.metricName, 'minimumValue', e.target.value)}
                                className="w-full bg-surface-container-low border border-surface-container rounded p-1 text-xs font-mono"
                                placeholder="min"
                              />
                            </div>
                          )}
                          {c.maximumValue !== undefined && (
                            <div>
                              <span className="text-[9px] text-on-surface-variant block">Max</span>
                              <input
                                type="number"
                                step="any"
                                value={c.maximumValue !== null ? c.maximumValue : ''}
                                onChange={(e) => updateCriterionValue(item.exerciseId, c.metricName, 'maximumValue', e.target.value)}
                                className="w-full bg-surface-container-low border border-surface-container rounded p-1 text-xs font-mono"
                                placeholder="max"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onNavigate('overview')}
            className="px-5 py-2.5 border border-surface-container text-xs rounded-xl hover:bg-surface-container"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow hover:bg-primary-container disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
            <span>{saving ? 'Assigning Protocol...' : 'Deploy Prescription to Patient App'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
