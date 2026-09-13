// geometry.dart
//
// WHAT THIS FILE DOES
// The pose detector gives us landmarks as (x, y) points on the screen -
// e.g. "the hip is at (0.42, 0.61)". A single point tells us nothing about
// how bent a joint is. To measure that, we need the ANGLE formed by three
// points: for a knee, that's hip -> knee -> ankle, with the knee as the
// vertex (the corner of the angle).
//
// THE MATH (explained once here, used everywhere else in the app)
// Given three points A, B, C where B is the vertex:
//   1. Build vector BA = A - B  (an arrow from B pointing to A)
//   2. Build vector BC = C - B  (an arrow from B pointing to C)
//   3. The angle between two vectors can be found from the dot product:
//        BA . BC = |BA| * |BC| * cos(angle)
//      so:
//        angle = arccos( (BA . BC) / (|BA| * |BC|) )
//   4. arccos gives radians; we convert to degrees because clinicians think
//      in degrees ("120 degrees of knee flexion"), not radians.
//
// This exact formula was verified against known test cases (a straight
// line = 180 degrees, a right angle = 90 degrees) before being written here.

import 'dart:math';

/// A single (x, y) landmark position, already normalized to 0.0-1.0 of the
/// camera frame (see normalization.dart for why we normalize).
class Point2D {
  final double x;
  final double y;
  const Point2D(this.x, this.y);
}

/// Calculates the angle ABC in degrees, where B is the vertex (the joint).
///
/// Example: calculateAngle(hip, knee, ankle) gives the knee's flexion angle.
/// A straight leg (hip, knee, ankle in a line) returns close to 180.
/// A fully bent knee returns a much smaller number, e.g. 70-90.
double calculateAngle(Point2D a, Point2D b, Point2D c) {
  // Step 1: vector from B to A
  final double baX = a.x - b.x;
  final double baY = a.y - b.y;

  // Step 2: vector from B to C
  final double bcX = c.x - b.x;
  final double bcY = c.y - b.y;

  // Step 3: dot product of the two vectors
  final double dotProduct = (baX * bcX) + (baY * bcY);

  // Step 4: the length (magnitude) of each vector, using Pythagoras
  final double magnitudeBA = sqrt(baX * baX + baY * baY);
  final double magnitudeBC = sqrt(bcX * bcX + bcY * bcY);

  // Guard against dividing by zero if a landmark is degenerate (magnitude 0).
  // This should not normally happen if confidence checks passed already,
  // but a defensive check here prevents a crash.
  if (magnitudeBA == 0 || magnitudeBC == 0) {
    return 0.0;
  }

  // Step 5: cosine of the angle
  double cosAngle = dotProduct / (magnitudeBA * magnitudeBC);

  // Floating-point arithmetic can occasionally produce 1.0000000002 or
  // -1.0000000001 due to rounding, and acos() is undefined outside
  // [-1, 1]. We "clamp" the value back into the valid range.
  cosAngle = cosAngle.clamp(-1.0, 1.0);

  // Step 6: arccos gives us the angle in radians; convert to degrees.
  final double angleRadians = acos(cosAngle);
  final double angleDegrees = angleRadians * (180.0 / pi);

  return angleDegrees;
}

/// Euclidean distance between two points. Used for simple checks like
/// "how far apart are the two ankles" (useful for symmetry / stance checks).
double calculateDistance(Point2D a, Point2D b) {
  final double dx = a.x - b.x;
  final double dy = a.y - b.y;
  return sqrt(dx * dx + dy * dy);
}
