/**
 * 야구장 (§15 / §12.1 — 아트는 전부 코드로 그린다)
 *
 * 시점은 **포수 뒤에서 마운드를 바라보는 방향**이다. 공이 위에서
 * 아래(홈플레이트)로 날아오는 화면 구성과 맞춘다.
 *
 * 축구 잔디를 그대로 쓰면 센터서클과 페널티 아크가 보여 종목이 헷갈린다.
 * 같은 팔레트(§12.2)를 쓰되 지형만 야구로 바꾼다.
 */
export function BaseballField() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 130"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="bb-turf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-turf-top)" />
          <stop offset="100%" stopColor="var(--color-turf-bottom)" />
        </linearGradient>
        <radialGradient id="bb-mound" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0%" stopColor="var(--color-dirt)" />
          <stop offset="100%" stopColor="var(--color-dirt-dark)" />
        </radialGradient>
      </defs>

      <rect width="100" height="130" fill="url(#bb-turf)" />

      {/* 잔디 깎은 줄무늬 — 아래로 갈수록 넓어져 바닥이 누워 보인다 */}
      <g fill="#FFFFFF" fillOpacity="0.03">
        <path d="M18 0 L34 0 L26 130 L-6 130 Z" />
        <path d="M50 0 L66 0 L74 130 L42 130 Z" />
        <path d="M82 0 L98 0 L122 130 L90 130 Z" />
      </g>

      {/* 내야 흙 — 홈플레이트를 중심으로 부채꼴로 펼쳐진다 */}
      <path
        d="M50 118 L4 60 A64 64 0 0 1 96 60 Z"
        fill="var(--color-dirt)"
        fillOpacity="0.55"
      />
      {/* 내야 안쪽 잔디 — 다이아몬드 */}
      <path
        d="M50 112 L14 62 L50 22 L86 62 Z"
        fill="url(#bb-turf)"
        fillOpacity="0.85"
      />

      {/* 파울 라인 */}
      <g stroke="#F8FAFC" strokeOpacity="0.35" strokeWidth="0.8">
        <path d="M50 116 L2 56" />
        <path d="M50 116 L98 56" />
      </g>

      {/* 베이스 3개 */}
      <g fill="#F8FAFC" fillOpacity="0.85">
        <rect x="11" y="59" width="6" height="6" rx="1" transform="rotate(45 14 62)" />
        <rect x="47" y="19" width="6" height="6" rx="1" transform="rotate(45 50 22)" />
        <rect x="83" y="59" width="6" height="6" rx="1" transform="rotate(45 86 62)" />
      </g>

      {/* 투수 마운드 */}
      <ellipse cx="50" cy="60" rx="13" ry="9" fill="url(#bb-mound)" />
      <rect x="46" y="58" width="8" height="2" rx="1" fill="#F8FAFC" fillOpacity="0.8" />

      {/* 홈플레이트 흙 */}
      <ellipse cx="50" cy="116" rx="20" ry="13" fill="var(--color-dirt)" fillOpacity="0.6" />

      {/* 타석 박스 */}
      <g stroke="#F8FAFC" strokeOpacity="0.28" strokeWidth="0.7" fill="none">
        <rect x="28" y="106" width="12" height="18" />
        <rect x="60" y="106" width="12" height="18" />
      </g>

      {/* 홈플레이트 — 오각형 */}
      <path
        d="M46 112 L54 112 L54 116 L50 119.5 L46 116 Z"
        fill="#F8FAFC"
        fillOpacity="0.95"
      />
    </svg>
  )
}
