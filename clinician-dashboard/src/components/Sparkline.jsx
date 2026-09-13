// A minimal trend line for a series of numbers (e.g. quality score across
// sessions). No charting library — just an SVG polyline, since the plan
// explicitly avoids unnecessary dependencies for a project this size.
export default function Sparkline({ values, width = 260, height = 60, label }) {
  const valid = values.filter((v) => v != null);
  if (valid.length < 2) {
    return <p className="muted">Not enough valid sessions yet to show a trend.</p>;
  }

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;
  const stepX = width / (valid.length - 1);
  const points = valid.map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`).join(' ');

  // Simple, explicit trend rule matching the plan's design: compare the
  // average of the most recent half against the average of the earlier
  // half. This is NOT a claim of biological improvement, just a
  // description of the recorded numbers (Section 38/101/102 wording).
  const mid = Math.floor(valid.length / 2);
  const earlyAvg = valid.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const recentAvg = valid.slice(mid).reduce((a, b) => a + b, 0) / (valid.length - mid);
  const delta = recentAvg - earlyAvg;
  let trendLabel = 'Plateau (change is small)';
  if (delta >= 3) trendLabel = 'Improving across recent valid sessions';
  else if (delta <= -3) trendLabel = 'Decreased compared with earlier valid sessions';

  return (
    <div className="sparkline">
      {label && <p className="sparkline-label">{label}</p>}
      <svg width={width} height={height + 4}>
        <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="2" />
      </svg>
      <p className="muted">{valid[0].toFixed ? valid[0].toFixed(1) : valid[0]} &rarr; {valid[valid.length - 1].toFixed ? valid[valid.length - 1].toFixed(1) : valid[valid.length - 1]} &middot; {trendLabel}</p>
    </div>
  );
}
