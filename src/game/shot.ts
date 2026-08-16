/**
 * 슛 결과 매트릭스 (§7.2)
 *
 * 점수는 정답 여부로만 갈리지만(§7.2), **화면에서 공이 어떻게 되는지**는
 * 정답 여부와 게이지가 함께 정한다. 골키퍼 동작·네트 출렁임·화면 흔들림·
 * 리바운드가 전부 이 결과 하나에서 파생되므로 한 곳에서 정한다.
 *
 * ⚠ 오답일 때 골이 들어가서는 안 된다.
 *   축구에서 골은 성공을 뜻한다. 화면은 성공인데 점수는 실패인 상태가 되면
 *   피드백이 서로 모순된다. 초판 매트릭스는 오답+초록에서 골이 들어갔고,
 *   플레이 테스트에서 실제로 혼란을 일으켜 수정됐다.
 */

import type { GaugeZone } from './gauge'
import type { AnswerOutcome } from './score'

export type ShotResult =
  /** 골 — 네트가 흔들리고 환호가 터진다 */
  | 'GOAL'
  /** 선방 — 골키퍼가 몸을 던져 쳐낸다. 공이 튕겨 나간다 */
  | 'SAVED'
  /** 캐치 — 골키퍼가 탭한 칸으로 이동해 제자리에서 잡는다. 공이 손에 멈춘다 */
  | 'CAUGHT'
  /** 슛 자체가 없었다 (시간초과) */
  | 'NONE'

export function resolveShot(
  outcome: AnswerOutcome,
  zone: GaugeZone | null,
): ShotResult {
  if (outcome === 'TIMEOUT') return 'NONE'
  // 오답은 게이지와 무관하게 항상 잡힌다
  if (outcome === 'WRONG') return 'CAUGHT'
  return zone === 'GREEN' ? 'GOAL' : 'SAVED'
}

/**
 * 공(과 골키퍼)이 겨냥하는 지점을 칸 중앙에서 아래로 내리는 비율.
 * 골대 높이 기준이다.
 *
 * 칸 정중앙은 **선택지 글자 자리**다. 거기에 공이나 골키퍼를 놓으면
 * 판정 결과로 무슨 단어가 맞았는지를 읽을 수 없다.
 * 공과 골키퍼가 같은 값을 써야 "잡았다"로 보인다.
 */
export const TARGET_BELOW_TEXT = 0.08

/** 공이 네트에 닿았는가 — 출렁임과 화면 흔들림의 조건 (§14.7) */
export function reachedNet(result: ShotResult): boolean {
  return result === 'GOAL'
}

/** 공이 튕겨 나가는가 — 쳐낸 경우에만. 잡힌 공은 손에 멈춘다 */
export function reboundsOff(result: ShotResult): boolean {
  return result === 'SAVED'
}
