/**
 * 모션 타이밍 (§12.4)
 *
 * 숫자를 화면 코드에 흩뿌리지 않고 여기 모아 둔다.
 * 레이아웃과 타이밍을 먼저 확정한 뒤 SVG로 교체하기 위함이다 (§12.5).
 */

/** 공 궤적. 더 길면 답답하고, 짧으면 궤적이 보이지 않는다 */
export const BALL_FLIGHT_MS = 350

/** 골키퍼 다이빙 (§13.2) */
export const KEEPER_DIVE_MS = 250

/** 공은 골키퍼보다 살짝 늦게 출발한다 — 키퍼가 먼저 반응해야 한다 (§12.4) */
export const BALL_DELAY_MS = 60

/** 선방 시 공이 튕겨 나오는 시간 (§13.2) */
export const REBOUND_MS = 180

/** 판정 결과를 보여주는 시간. 슛 연출이 끝난 뒤의 여유 */
export const RESULT_HOLD_MS = 310

/** 한 문제의 연출 총 길이. 1초를 넘기지 않는다 (§14.8) */
export const RESOLVE_MS =
  BALL_DELAY_MS + BALL_FLIGHT_MS + REBOUND_MS + RESULT_HOLD_MS

/** 콤보 상승 시 화면 전체 노란빛 (§12.4) */
export const COMBO_FLASH_MS = 200

/* ── §14.7 추가 애니메이션 ────────────────────────────── */

/** 점수 카운트업 — 즉시 갱신하지 않고 0.4초에 걸쳐 증가 */
export const SCORE_COUNTUP_MS = 400

/** 점수 팝 — 갱신 시 scale 1 → 1.15 → 1 */
export const SCORE_POP_MS = 300
export const SCORE_POP_SCALE = 1.15

/** 획득 점수 플로팅 — 골대에서 떠올라 사라짐 */
export const FLOAT_SCORE_MS = 800
/** 떠오르는 높이(px) */
export const FLOAT_SCORE_RISE = 44
/** 시작 지점을 선택지 글자 위로 띄우는 거리(px) */
export const FLOAT_START_ABOVE = 30

/** 골 성공 시 화면 흔들림 */
export const SHAKE_MS = 150
export const SHAKE_PX = 3

/** 네트 출렁임 — 공이 닿은 지점 기준 파동 */
export const NET_RIPPLE_MS = 420

/** 타이머 경고 — 남은 시간이 이 이하일 때 빨간색 + 맥박 */
export const TIMER_WARNING_MS = 1000
export const TIMER_PULSE_MS = 500

/**
 * 콤보 단계별 경기장 조명 밝기 (§5.4).
 * 하락은 "조명이 한 단계 어두워지는" 연출로 표현하며,
 * 게이지가 0으로 급락하는 연출을 쓰지 않는다.
 */
export const COMBO_LIGHT_OPACITY = [0, 0.18, 0.32, 0.5] as const

/**
 * 조명 전환 (§5.4)
 *
 * - 상승: 빠르게 밝아진다
 * - 초급 하락: 천천히 — 한 단계만 내려간 것이 급락으로 보이면 안 된다
 * - 중·고급 초기화: 한 번에 꺼진다. 상실감이 분명해야 긴장감이 성립한다
 */
export const LIGHT_RISE_MS = 200
export const LIGHT_FALL_MS = 600
export const LIGHT_SNAP_MS = 110
