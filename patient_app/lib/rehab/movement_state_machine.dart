// movement_state_machine.dart
//
// WHAT THIS FILE DOES
// Turns a stream of joint angles over time into: (1) which PHASE the
// movement is currently in, and (2) how many REPETITIONS have been
// completed. This is a deterministic state machine - no AI model decides
// this, just plain thresholds on the angle. (Section 24/67 of the spec.)
//
// THIS EXACT LOGIC WAS VERIFIED BEFORE BEING WRITTEN HERE: the example
// angle sequence from the spec (170,160,140,120,140,160,170 degrees) was
// run through this state machine's logic in Python first, and it correctly
// produces START -> LOWERING -> BOTTOM -> RISING -> START (1 repetition).
//
// WHY WE NEED SMOOTHING FIRST
// Raw landmark coordinates jitter slightly frame to frame, even when the
// patient is holding still. If we fed raw angles straight into this state
// machine, that jitter could cause the state to flicker back and forth
// near a threshold. We smooth with a moving average before this file ever
// sees an angle (see smoothing.dart).

/// The phases a movement can be in. Every exercise defined in the database
/// has its phases stored as an ordered comma-separated list (e.g.
/// "start,lowering,bottom,rising,complete") - this enum names the GENERIC
/// shape shared by squat-like movements. Exercises with a different phase
/// shape (e.g. a single-direction reach) can reuse START/MOVING/COMPLETE.
enum MovementPhase { start, lowering, bottom, rising, complete }

/// Configurable per-exercise thresholds (the clinician effectively sets
/// these indirectly through exercise_criteria rows - Section 35).
class PhaseThresholds {
  /// Angle at or above this = the patient is in the "start"/standing position.
  final double startThresholdDeg;

  /// Angle at or below this = the patient has reached the "bottom" of the movement.
  final double bottomThresholdDeg;

  const PhaseThresholds({
    required this.startThresholdDeg,
    required this.bottomThresholdDeg,
  });
}

/// Tracks state across many calls to `update()` - one call per smoothed
/// angle reading. This is a class (not a single function) because a state
/// machine needs MEMORY of what state it was in last time.
class RepetitionStateMachine {
  final PhaseThresholds thresholds;

  MovementPhase _currentPhase = MovementPhase.start;
  int _repetitionCount = 0;

  // Timestamps of when each phase started, used later to calculate tempo
  // (how many seconds the "lowering" phase took, etc - Section 28).
  final Map<MovementPhase, DateTime> _phaseStartTimes = {};

  RepetitionStateMachine({required this.thresholds});

  MovementPhase get currentPhase => _currentPhase;
  int get repetitionCount => _repetitionCount;

  /// Feed one new (smoothed) angle reading in. Call this once per analyzed
  /// frame while the patient is recording.
  void update(double smoothedAngleDeg, DateTime timestamp) {
    switch (_currentPhase) {
      case MovementPhase.start:
        if (smoothedAngleDeg < thresholds.startThresholdDeg) {
          _transitionTo(MovementPhase.lowering, timestamp);
        }
        break;

      case MovementPhase.lowering:
        if (smoothedAngleDeg <= thresholds.bottomThresholdDeg) {
          _transitionTo(MovementPhase.bottom, timestamp);
        }
        break;

      case MovementPhase.bottom:
        if (smoothedAngleDeg > thresholds.bottomThresholdDeg) {
          _transitionTo(MovementPhase.rising, timestamp);
        }
        break;

      case MovementPhase.rising:
        if (smoothedAngleDeg >= thresholds.startThresholdDeg) {
          // Returning to the start position means one full repetition
          // has been completed.
          _transitionTo(MovementPhase.start, timestamp);
          _repetitionCount += 1;
        }
        break;

      case MovementPhase.complete:
        // 'complete' is a terminal phase used when the whole SET (not a
        // single rep) has finished - the caller sets this explicitly when
        // the target repetition count for the set has been reached.
        break;
    }
  }

  void _transitionTo(MovementPhase newPhase, DateTime timestamp) {
    _currentPhase = newPhase;
    _phaseStartTimes[newPhase] = timestamp;
  }

  /// Marks the whole set as finished (called by the recording screen once
  /// the target rep count is hit, not derived automatically here).
  void markComplete(DateTime timestamp) {
    _transitionTo(MovementPhase.complete, timestamp);
  }
}

/// Simple moving-average smoother (Section 68). Keeps the last N angle
/// readings and returns their average, which reduces frame-to-frame jitter
/// without needing an advanced filtering algorithm.
class MovingAverageSmoother {
  final int windowSize;
  final List<double> _recentValues = [];

  MovingAverageSmoother({this.windowSize = 5});

  double smooth(double newValue) {
    _recentValues.add(newValue);
    if (_recentValues.length > windowSize) {
      _recentValues.removeAt(0); // drop the oldest value once the window is full
    }
    final double sum = _recentValues.reduce((a, b) => a + b);
    return sum / _recentValues.length;
  }
}
