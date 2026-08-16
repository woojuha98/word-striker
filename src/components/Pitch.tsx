/**
 * 경기장 배경 (§12.1 / §12.2)
 *
 * 잔디는 CSS 그라디언트 한 겹이었다. SVG로 옮기면서 두 가지를 더한다.
 * - 잔디 줄무늬(모어 패턴): 원근으로 아래로 갈수록 넓어진다
 * - 페널티 아크: 여기가 페널티킥 지점이라는 걸 알려 준다
 *
 * 순수 장식이므로 이벤트를 받지 않는다.
 */
export function Pitch() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="turf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14532D" />
          <stop offset="100%" stopColor="#166534" />
        </linearGradient>
      </defs>

      <rect width="100" height="40" fill="url(#turf)" />

      {/*
        잔디 깎은 줄무늬. 위(먼 쪽)는 촘촘하고 아래(가까운 쪽)는 넓다.
        사다리꼴로 그려야 바닥이 누워 보인다 — 직사각형이면 벽처럼 보인다.
      */}
      <g fill="#FFFFFF" fillOpacity="0.035">
        <path d="M-10 0 L14 0 L2 40 L-40 40 Z" />
        <path d="M28 0 L44 0 L46 40 L22 40 Z" />
        <path d="M58 0 L74 0 L90 40 L66 40 Z" />
        <path d="M88 0 L110 0 L140 40 L110 40 Z" />
      </g>

      {/* 페널티 아크 — 골대에서 멀어지는 원근을 살짝 준다 */}
      <ellipse
        cx="50"
        cy="6"
        rx="30"
        ry="9"
        fill="none"
        stroke="#F8FAFC"
        strokeOpacity="0.16"
        strokeWidth="0.5"
      />

      {/* 페널티 마크 — 공이 놓이는 자리 */}
      <ellipse cx="50" cy="21" rx="1.1" ry="0.5" fill="#F8FAFC" fillOpacity="0.3" />
    </svg>
  )
}
