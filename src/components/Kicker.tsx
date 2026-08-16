/**
 * 키커 (§12.5 — 이모지를 SVG로 교체)
 *
 * 공 뒤에서 골대를 바라보는 뒷모습이다.
 * 유니폼은 흰색 — 골키퍼(하늘색)와 구분되고, 잔디 위에서 또렷하며,
 * 정답(초록)·오답(빨강)·콤보(노랑) 어느 의미색과도 겹치지 않는다.
 *
 * v1.2까지 슛 모션은 넣지 않는다 (§4.3) — 정지 자세다.
 */
const KIT = '#F8FAFC'
const SHORTS = '#0B1220'
const SKIN = '#F0C7A6'
const SHADE = '#94A3B8'

export function Kicker({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={(size * 40) / 34}
      viewBox="0 0 34 40"
      aria-hidden
    >
      {/* 다리 */}
      <g fill={SHORTS}>
        <rect x="11" y="24" width="4.6" height="14" rx="2.3" />
        <rect x="18.4" y="24" width="4.6" height="14" rx="2.3" />
      </g>

      {/* 축구화 */}
      <g fill={SHADE}>
        <rect x="10.2" y="36.5" width="6" height="3" rx="1.5" />
        <rect x="17.8" y="36.5" width="6" height="3" rx="1.5" />
      </g>

      {/* 팔 — 몸통보다 뒤에 두어 어깨선이 살아난다 */}
      <g stroke={KIT} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M10 17 L6.5 26" />
        <path d="M24 17 L27.5 26" />
      </g>

      {/* 등번호가 보이는 상의 */}
      <path d="M9.5 15 Q17 11.5 24.5 15 L25.5 26 Q17 28.5 8.5 26 Z" fill={KIT} />
      <text
        x="17"
        y="22.5"
        textAnchor="middle"
        fontSize="7"
        fontWeight="700"
        fill={SHADE}
      >
        9
      </text>

      {/* 머리 — 뒤통수라 이목구비가 없다 */}
      <circle cx="17" cy="7.5" r="5.4" fill={SKIN} />
      <path d="M11.8 5.6 A5.4 5.4 0 0 1 22.2 5.6 Z" fill="#3F2A1D" />
    </svg>
  )
}
