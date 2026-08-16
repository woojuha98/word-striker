/**
 * 축구공 (§12.1 / §12.5 — 이모지를 SVG로 교체)
 *
 * 날아가는 동안 scale 0.5까지 줄어들므로(§4.3) 15px에서도 공으로 읽혀야 한다.
 * 오각형 하나와 이음선 다섯 개면 그 크기에서 충분하고,
 * 조각을 더 넣으면 뭉개져서 회색 원이 된다.
 */
export function Ball({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        {/* 위에서 빛을 받는 구 — 야간 조명 아래의 공 (§12.2) */}
        <radialGradient id="ball-light" cx="0.36" cy="0.3" r="0.78">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#EEF2F6" />
          <stop offset="100%" stopColor="#B9C3CE" />
        </radialGradient>
      </defs>

      <circle cx="16" cy="16" r="15" fill="url(#ball-light)" />

      <g fill="#0B1220">
        {/* 가운데 오각형 */}
        <polygon points="16,7.5 21.4,11.4 19.3,17.7 12.7,17.7 10.6,11.4" />
        {/* 가장자리에 걸친 조각들 — 구가 말려 들어가는 느낌을 만든다 */}
        <path d="M16 2.6 L20.6 5.6 L19.6 8.2 L16 5.6 L12.4 8.2 L11.4 5.6 Z" />
        <path d="M28.4 12.6 L27.2 17.4 L24.4 17.6 L22.6 12.6 L24.8 10.8 Z" />
        <path d="M3.6 12.6 L4.8 17.4 L7.6 17.6 L9.4 12.6 L7.2 10.8 Z" />
        <path d="M9.6 27.4 L11.6 23.2 L14.6 24 L15.2 28.8 L12.4 29.2 Z" />
        <path d="M22.4 27.4 L20.4 23.2 L17.4 24 L16.8 28.8 L19.6 29.2 Z" />
      </g>

      <circle
        cx="16"
        cy="16"
        r="15"
        fill="none"
        stroke="#0B1220"
        strokeOpacity="0.35"
        strokeWidth="1"
      />
    </svg>
  )
}
