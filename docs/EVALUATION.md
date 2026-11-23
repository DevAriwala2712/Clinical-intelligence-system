# Technical Evaluation and Baselines

## 1. Experimental Methodology

To evaluate the contribution beyond standard single-frame pose detection, the system includes an automated evaluation harness (`npm run eval` via `backend/src/evaluation/runEvaluation.ts`) comparing two distinct analysis paradigms across standardized movement sequences.

### Baseline 1: Instantaneous Angle-Threshold Method
- Evaluates individual frames in isolation against predefined geometric thresholds.
- Detects phase transitions when an instantaneous joint angle crosses a static boundary.
- **Inherent Limitation**: Unable to measure velocity derivatives, smoothness (jerk), tempo variance across movement phases, or subtle compensatory trunk lean.

### Baseline 2: Temporal Movement-Analysis Method
- Evaluates the continuous kinematic time series across frames.
- Applies temporal moving-average smoothing to eliminate tracking jitter.
- Tracks phase-specific durations and calculates first and second angular derivatives for velocity and jerk.
- Gated by camera setup quality and landmark confidence thresholds ($k_{\text{conf}} \ge 0.70$).

---

## 2. Quantitative Comparative Benchmark Results

*Run command: `npm run eval`*

| Metric | Baseline 1 (Threshold) | Baseline 2 (Temporal) | Technical Explanation |
|---|---|---|---|
| **Repetition Segmentation Accuracy** | 100% | 100% | Both state machines correctly segment complete cycles on smooth synthetic trajectories. |
| **Error Detection Precision** | 100% | 100% | Neither baseline emitted false alerts on clean reps. |
| **Error Detection Recall** | **25%** | **100%** | Baseline 1 only detected gross ROM deficit. Baseline 2 successfully identified velocity-dependent errors (`too_fast`, `jerky_motion`, `trunk_lean`). |
| **False Alert Rate** | 0% | 0% | Verified on clean 160° calibration reps. |
| **Abstention Quality on Corrupted Input** | **FAIL (0%)** | **PASS (100%)** | When mean confidence dropped to 42%, Baseline 1 continued generating false scores. Baseline 2 explicitly abstained (`LOW_CONFIDENCE`). |
| **Mean Processing Latency per Frame** | ~0.001 ms | ~0.001 ms | Both methods easily satisfy real-time mobile throughput (> 60 fps). |

---

## 3. Clinical Validation Status & Governance Disclaimer

> [!IMPORTANT]
> **Clinical Governance Notice**:
> In accordance with medical software engineering standards, the criteria thresholds and algorithmic rules implemented in this application serve as a technical framework and reference baseline. They have **NOT** been certified as a medical device and do **NOT** constitute autonomous clinical validation.
>
> All rehabilitation pathways, criteria ranges, and progression suggestions **require verification and approval by a licensed physiotherapist** before clinical application.
