// Draws the raw landmark trace for one repetition as a simple stick-figure
// path: each named landmark (hip/knee/ankle/etc.) becomes a small dot, and
// consecutive frames for the SAME landmark are connected with a faint line
// so you can see how that point moved over time. This is a direct plot of
// the numbers stored in landmark_points — no smoothing, no interpretation.
export default function LandmarkSkeleton({ points }) {
  if (!points || points.length === 0) {
    return <p className="muted">No landmark points recorded for this session.</p>;
  }

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const pad = 20;
  const width = 320, height = 320;
  const scaleX = (x) => pad + ((x - minX) / (maxX - minX || 1)) * (width - 2 * pad);
  const scaleY = (y) => pad + ((y - minY) / (maxY - minY || 1)) * (height - 2 * pad);

  const byLandmark = {};
  for (const p of points) {
    const key = p.landmark_name || p.landmarkName || 'point';
    (byLandmark[key] ||= []).push(p);
  }

  const colors = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed'];
  const names = Object.keys(byLandmark);

  return (
    <div className="landmark-skeleton">
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
        {names.map((name, i) => {
          const framePoints = byLandmark[name].sort((a, b) => (a.timestamp_ms || a.timestampMs || 0) - (b.timestamp_ms || b.timestampMs || 0));
          const color = colors[i % colors.length];
          const pathD = framePoints
            .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(p.x)} ${scaleY(p.y)}`)
            .join(' ');
          return (
            <g key={name}>
              <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" opacity="0.5" />
              {framePoints.map((p, idx) => (
                <circle key={idx} cx={scaleX(p.x)} cy={scaleY(p.y)} r={3} fill={color} />
              ))}
            </g>
          );
        })}
      </svg>
      <ul className="landmark-legend">
        {names.map((name, i) => (
          <li key={name}><span className="swatch" style={{ background: colors[i % colors.length] }} />{name}</li>
        ))}
      </ul>
    </div>
  );
}
