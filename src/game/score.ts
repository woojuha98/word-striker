/**
 * 점수 시스템 (§5) — UI에 의존하지 않는 순수 함수.
 *
 * ⚠ §0: 여기의 산식과 콤보 규칙은 밸런싱의 핵심이므로 임의로 바꾸지 않는다.
 *   숫자를 조정할 일이 생기면 SCORE_RULES / COMBO_TIERS 상수만 수정한다.
 */

export type AnswerOutcome = 'CORRECT' | 'WRONG' | 'TIMEOUT'
export type ComboTier = 0 | 1 | 2 | 3

/** §5.2 기본 점수 */
export const SCORE_RULES = {
  /** 정답 기본점 (콤보 배수가 곱해진다) */
  correctBase: 100,
  /** 오답 패널티 */
  wrongPenalty: 50,
  /**
   * 시간초과 패널티.
   * 오답보다 가볍다 — 무행동을 더 관대하게 처벌해야 "모르면 흘려보내기"가
   * 최적 전략이 되지 않는다 (§5.2).
   */
  timeoutPenalty: 30,
  /** 원점수 하한. 음수가 되지 않는다 (§5.1) */
  minScore: 0,
} as const

/** §5.3 콤보 단계. 상한 ×2.0을 넘기지 않는다 — 넘기면 메달 고정 기준(§8)이 무의미해진다. */
export const COMBO_TIERS = [
  { requiredStreak: 0, multiplier: 1.0 },
  { requiredStreak: 3, multiplier: 1.2 },
  { requiredStreak: 5, multiplier: 1.5 },
  { requiredStreak: 8, multiplier: 2.0 },
] as const

export const MAX_COMBO_TIER: ComboTier = 3

export function multiplierOf(tier: ComboTier): number {
  return COMBO_TIERS[tier].multiplier
}

export function requiredStreakOf(tier: ComboTier): number {
  return COMBO_TIERS[tier].requiredStreak
}

/** 연속 정답 수 → 콤보 단계 */
export function tierFromStreak(streak: number): ComboTier {
  for (let tier = MAX_COMBO_TIER; tier > 0; tier--) {
    if (streak >= COMBO_TIERS[tier].requiredStreak) return tier as ComboTier
  }
  return 0
}

export interface ComboState {
  tier: ComboTier
  /**
   * 연속 정답 수. 단계 판정과 결과 화면 표시에 모두 쓴다.
   *
   * 예전에는 판정용 진행도와 표시용 연속 수를 따로 뒀는데, 그건 즉시 복귀가
   * 진행도를 끌어올렸기 때문이다. 완전 초기화에서는 둘이 항상 같으므로
   * 하나로 합쳤다.
   */
  streak: number
}

export interface ScoreState {
  score: number
  combo: ComboState
  correctCount: number
  wrongCount: number
  timeoutCount: number
  /** 결과 화면의 "최고 콤보" (§2) */
  bestStreak: number
  bestTier: ComboTier
}

export function createScoreState(): ScoreState {
  return {
    score: 0,
    combo: { tier: 0, streak: 0 },
    correctCount: 0,
    wrongCount: 0,
    timeoutCount: 0,
    bestStreak: 0,
    bestTier: 0,
  }
}

/** 정답 시 콤보 진행 */
function advanceCombo(combo: ComboState): ComboState {
  const streak = combo.streak + 1
  return { tier: tierFromStreak(streak), streak }
}

/**
 * 오답·시간초과 시 콤보 **완전 초기화**.
 *
 * 한 번이라도 놓치면 처음부터 다시 쌓는다. 다음 정답은 배수 없이
 * 기본점 100점만 들어간다.
 *
 * ⚠ 이 규칙은 §5.3의 "한 단계만 하락 + 즉시 복귀"를 대체한 것이다.
 *   문서가 완전 초기화를 피했던 이유는 초반 실수 하나로 판 전체가
 *   무의미해지는 느낌이 중도 이탈로 이어진다는 것이었다(§1.3, 부록 A).
 *   콤보의 긴장감을 우선하기로 하여 뒤집었다.
 */
function resetCombo(): ComboState {
  return { tier: 0, streak: 0 }
}

export interface AnswerResult {
  state: ScoreState
  /** 이번 문제의 점수 변동 (하한 클램프 전). 플로팅 `+120` 연출용 (§14.7) */
  delta: number
  /** 하한 0에 걸린 뒤 실제로 반영된 변화량. 점수 카운트업 연출용 */
  appliedDelta: number
  /** 이번 문제에 적용된 콤보 배수 (패널티는 배수를 곱하지 않으므로 1) */
  multiplier: number
  tierBefore: ComboTier
  tierAfter: ComboTier
}

/**
 * 한 문제의 결과를 반영한 새 상태를 돌려준다. 기존 상태는 변경하지 않는다.
 *
 * 확정된 두 규칙:
 *  1) §5.3.1 — 콤보 배수는 "이번 정답을 반영한 뒤"의 단계로 적용한다.
 *     3연속을 만든 그 정답부터 ×1.2를 받는다.
 *  2) §5.1 — 하한 0은 매 문제 정산 시점에 누적 점수에 적용한다.
 *     화면 점수가 어느 순간에도 음수로 내려가지 않는다.
 *
 * 놓치면 콤보는 0으로 돌아간다. 다음 정답은 기본점 100점만 들어간다.
 */
export function applyAnswer(
  state: ScoreState,
  outcome: AnswerOutcome,
): AnswerResult {
  const tierBefore = state.combo.tier
  const isCorrect = outcome === 'CORRECT'
  const combo = isCorrect ? advanceCombo(state.combo) : resetCombo()

  const multiplier = isCorrect ? multiplierOf(combo.tier) : 1
  let delta: number
  if (isCorrect) {
    delta = Math.round(SCORE_RULES.correctBase * multiplier)
  } else if (outcome === 'WRONG') {
    delta = -SCORE_RULES.wrongPenalty
  } else {
    delta = -SCORE_RULES.timeoutPenalty
  }

  const score = Math.max(SCORE_RULES.minScore, state.score + delta)

  return {
    state: {
      score,
      combo,
      correctCount: state.correctCount + (isCorrect ? 1 : 0),
      wrongCount: state.wrongCount + (outcome === 'WRONG' ? 1 : 0),
      timeoutCount: state.timeoutCount + (outcome === 'TIMEOUT' ? 1 : 0),
      bestStreak: Math.max(state.bestStreak, combo.streak),
      bestTier: Math.max(state.bestTier, combo.tier) as ComboTier,
    },
    delta,
    appliedDelta: score - state.score,
    multiplier,
    tierBefore,
    tierAfter: combo.tier,
  }
}
