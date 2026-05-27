// Shared botanical line-art used across the homepage. All strokes/fills use
// currentColor, so colour comes from a `text-*` token on the element — keeping
// the decorations theme-aware for any seed palette.

// A leaf shape centred at the origin, tip pointing up (base at y=0, tip at y=-42).
const LEAF = "M0 0 C 9 -11 9 -29 0 -42 C -9 -29 -9 -11 0 0 Z";

// Positions of leaf pairs along the stem, with splay angle and scale.
const LEAVES: { y: number; angle: number; scale: number }[] = [
  { y: 206, angle: 54, scale: 0.85 },
  { y: 192, angle: -54, scale: 0.85 },
  { y: 168, angle: 50, scale: 0.95 },
  { y: 154, angle: -50, scale: 0.95 },
  { y: 128, angle: 48, scale: 1 },
  { y: 114, angle: -48, scale: 1 },
  { y: 88, angle: 46, scale: 0.92 },
  { y: 74, angle: -46, scale: 0.92 },
  { y: 50, angle: 44, scale: 0.8 },
  { y: 38, angle: -44, scale: 0.8 },
];

export function Sprig({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 240" fill="none" className={className} aria-hidden>
      <path
        d="M60 238 C 55 192 65 150 60 104 C 56 70 64 40 60 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      {LEAVES.map((leaf, i) => (
        <path
          key={i}
          d={LEAF}
          transform={`translate(60 ${leaf.y}) rotate(${leaf.angle}) scale(${leaf.scale})`}
          fill="currentColor"
          fillOpacity="0.9"
        />
      ))}
    </svg>
  );
}

export function LeafMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-24 -46 48 50" fill="none" className={className} aria-hidden>
      <path d="M0 2 V -40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d={LEAF} transform="translate(0 -8) rotate(46) scale(0.7)" fill="currentColor" />
      <path d={LEAF} transform="translate(0 -8) rotate(-46) scale(0.7)" fill="currentColor" />
      <path d={LEAF} transform="translate(0 -30) rotate(40) scale(0.55)" fill="currentColor" />
      <path d={LEAF} transform="translate(0 -30) rotate(-40) scale(0.55)" fill="currentColor" />
    </svg>
  );
}
