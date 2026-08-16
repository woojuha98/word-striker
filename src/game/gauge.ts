/**
 * 파워 게이지 (§7.2 / §13.1) — UI에 의존하지 않는 순수 함수.
 *
 * ⚠ 게이지는 **순수 연출이며 점수에 일절 영향을 주지 않는다** (§7.2).
 *   여기서 나온 판정은 골키퍼 반응(§13.2)과 골/선방 연출만 결정한다.
 *   점수는 오직 정답 여부로만 갈린다 — 조작 실패로 인한 실점은
 *   좌절만 남기고 학습 효과가 없기 때문이다.
 */

export type GaugeZone = 'GREEN' | 'RED'

/** 왕복 주기 (좌 → 우 → 좌) */
export const GAUGE_CYCLE_MS = 1200

/** 초록 구간 — 중앙 기준 전체 폭의 30% */
export const GREEN_ZONE_RATIO = 0.3

/** 누른 채 이만큼 유지하면 자동 발사 (§7.3) */
export const AUTO_FIRE_MS = 3000

/**
 * 누른 뒤 경과 시간 → 게이지 위치(0~1).
 * 0.6초에 걸쳐 0→1로 갔다가 다시 0으로 돌아오는 삼각파다.
 */
export function gaugePosition(elapsedMs: number): number {
  const t = (elapsedMs % GAUGE_CYCLE_MS) / GAUGE_CYCLE_MS
  return t < 0.5 ? t * 2 : 2 - t * 2
}

/** 초록 구간의 경계 [시작, 끝] */
export const GREEN_ZONE: readonly [number, number] = [
  0.5 - GREEN_ZONE_RATIO / 2,
  0.5 + GREEN_ZONE_RATIO / 2,
]

export function zoneAt(position: number): GaugeZone {
  return position >= GREEN_ZONE[0] && position <= GREEN_ZONE[1] ? 'GREEN' : 'RED'
}

/** 누른 시각과 뗀 시각으로 구간을 판정한다 */
export function judgeGauge(heldMs: number): GaugeZone {
  return zoneAt(gaugePosition(heldMs))
}
