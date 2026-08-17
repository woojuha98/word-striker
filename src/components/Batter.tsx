/**
 * 타자 (§15 / §12.5 — 이모지 없이 SVG로)
 *
 * 포수 뒤에서 본 뒷모습이라 이목구비가 없다. 유니폼은 축구 키커와 같은
 * 흰색 계열을 쓰되, 배트로 종목이 구분된다.
 *
 * 스윙 모션은 넣지 않는다. 판정은 탭 시점으로 이미 확정되고, 0.6초 창에서
 * 모션까지 얹으면 결과 문구를 읽을 시간이 사라진다.
 */
const KIT = '#F8FAFC'
const PANTS = '#0B1220'
const SKIN = '#F0C7A6'
const BAT = '#C79A6B'
const HELMET = '#38BDF8'

export function Batter({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={(size * 52) / 40}
      viewBox="0 0 40 52"
      aria-hidden
    >
      {/* 배트 — 어깨 뒤로 세운 준비 자세 */}
      <g stroke={BAT} strokeLinecap="round" fill="none">
        <path d="M27 20 L36 6" strokeWidth="3.4" />
      </g>

      {/* 다리 */}
      <g fill={PANTS}>
        <rect x="13" y="31" width="5" height="16" rx="2.5" />
        <rect x="21" y="31" width="5" height="16" rx="2.5" />
      </g>
      <g fill="#64748B">
        <rect x="12" y="46" width="7" height="3" rx="1.5" />
        <rect x="20" y="46" width="7" height="3" rx="1.5" />
      </g>

      {/* 팔 — 배트를 잡은 쪽 */}
      <path
        d="M22 21 L27 20"
        stroke={KIT}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* 상의 */}
      <path d="M12 19 Q20 15.5 28 19 L29 32 Q20 34.5 11 32 Z" fill={KIT} />

      {/* 머리 + 헬멧 */}
      <circle cx="20" cy="10" r="5.6" fill={SKIN} />
      <path
        d="M14.4 9.2 A5.6 5.6 0 0 1 25.6 9.2 L25.6 10.4 L14.4 10.4 Z"
        fill={HELMET}
      />
    </svg>
  )
}
