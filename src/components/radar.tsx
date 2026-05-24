"use client";

import type { ScorecardAxis } from "@/lib/types";

/**
 * Pure-SVG radar chart. No deps.
 * 0–100 scale, smooth gradient fill.
 */
export function Radar({
  axes,
  size = 240,
  color = "hsl(222 80% 55%)",
}: {
  axes: ScorecardAxis[];
  size?: number;
  color?: string;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.72;
  const n = axes.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  // grid rings
  const rings = [0.25, 0.5, 0.75, 1];

  const polygonPoints = axes
    .map((a, i) => {
      const t = Math.max(0, Math.min(100, a.value)) / 100;
      const x = cx + Math.cos(angle(i)) * r * t;
      const y = cy + Math.sin(angle(i)) * r * t;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px]">
      <defs>
        <linearGradient id="radar-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.45} />
          <stop offset="100%" stopColor={color} stopOpacity={0.1} />
        </linearGradient>
      </defs>

      {rings.map((t, i) => (
        <polygon
          key={i}
          points={axes
            .map((_, j) => {
              const x = cx + Math.cos(angle(j)) * r * t;
              const y = cy + Math.sin(angle(j)) * r * t;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(" ")}
          fill="none"
          stroke="hsl(220 14% 88%)"
          strokeWidth={0.6}
        />
      ))}

      {axes.map((_, i) => {
        const x = cx + Math.cos(angle(i)) * r;
        const y = cy + Math.sin(angle(i)) * r;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x.toFixed(1)}
            y2={y.toFixed(1)}
            stroke="hsl(220 14% 88%)"
            strokeWidth={0.6}
          />
        );
      })}

      {/* fill */}
      <polygon
        points={polygonPoints}
        fill="url(#radar-fill)"
        stroke={color}
        strokeWidth={1.3}
      />

      {/* value dots */}
      {axes.map((a, i) => {
        const t = Math.max(0, Math.min(100, a.value)) / 100;
        const x = cx + Math.cos(angle(i)) * r * t;
        const y = cy + Math.sin(angle(i)) * r * t;
        return (
          <circle key={i} cx={x} cy={y} r={2.6} fill={color} />
        );
      })}

      {/* axis labels */}
      {axes.map((a, i) => {
        const x = cx + Math.cos(angle(i)) * (r + 16);
        const y = cy + Math.sin(angle(i)) * (r + 16);
        return (
          <g key={i}>
            <text
              x={x}
              y={y}
              textAnchor={Math.cos(angle(i)) > 0.2 ? "start" : Math.cos(angle(i)) < -0.2 ? "end" : "middle"}
              dominantBaseline={Math.sin(angle(i)) > 0.1 ? "hanging" : Math.sin(angle(i)) < -0.1 ? "auto" : "middle"}
              fontSize={10}
              fontWeight={500}
              fill="hsl(220 9% 35%)"
            >
              {a.label}
            </text>
            <text
              x={x}
              y={y + (Math.sin(angle(i)) > 0 ? 11 : -11)}
              textAnchor={Math.cos(angle(i)) > 0.2 ? "start" : Math.cos(angle(i)) < -0.2 ? "end" : "middle"}
              fontSize={9}
              fill="hsl(220 9% 55%)"
              fontFamily="ui-monospace, monospace"
            >
              {a.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
