/**
 * 야구 (§15) — UI에 의존하지 않는 순수 로직.
 *
 * 축구가 "4개 중 반드시 하나를 고른다"라면, 야구는 "공마다 칠지 말지
 * 판단한다"이다. 인지 과제가 재인에서 **변별 + 억제 통제**로 바뀐다.
 * "아니다"를 알고 손을 참는 것이 이 종목을 넣는 이유다 (§15.1).
 *
 * 야구 용어는 **표시 계층에만** 쓴다. 점수는 §5 산식을 그대로 따른다 (§15.4).
 */

import { applyAnswer, createScoreState, type AnswerOutcome } from './score'

/** 한 공에 대한 판정 (§15.3) */
export type PitchOutcome =
  /** 정답 공을 침 — 안타. 타석 성공 */
  | 'HIT'
  /** 오답 공을 침 — 헛스윙. 스트라이크 */
  | 'SWING_MISS'
  /** 정답 공을 거름 — 좋은 공을 보냄. 스트라이크 */
  | 'TAKEN_STRIKE'
  /** 오답 공을 거름 — 볼을 골라냄. 정상 판단이므로 아무 일 없음 */
  | 'BALL'

export function judgePitch(swung: boolean, isAnswer: boolean): PitchOutcome {
  if (swung) return isAnswer ? 'HIT' : 'SWING_MISS'
  return isAnswer ? 'TAKEN_STRIKE' : 'BALL'
}

/** 스트라이크가 쌓이는 판정인가 (§15.3) */
export function isStrike(outcome: PitchOutcome): boolean {
  return outcome === 'SWING_MISS' || outcome === 'TAKEN_STRIKE'
}

/** 이 판정으로 타석이 끝나는가 — 안타면 다음 타석으로 (§15.3) */
export function endsAtBat(outcome: PitchOutcome): boolean {
  return outcome === 'HIT'
}

/**
 * 점수 산식과의 연결 (§15.4).
 *
 * 야구 판정을 §5의 정답/오답/무행동에 그대로 대응시킨다. `null`이면
 * 점수 계산 자체를 하지 않는다 — 오답 공을 거른 것은 실패가 아니므로
 * 감점도 없고 콤보도 유지된다.
 *
 * 정답을 거른 것(−30)이 오답을 친 것(−50)보다 가벼운 이유는 §5.2와 같다.
 * 무행동을 더 관대하게 처벌해야 회피가 최적 전략이 되지 않는다.
 */
export function scoreOutcomeOf(outcome: PitchOutcome): AnswerOutcome | null {
  switch (outcome) {
    case 'HIT':
      return 'CORRECT'
    case 'SWING_MISS':
      return 'WRONG'
    case 'TAKEN_STRIKE':
      return 'TIMEOUT'
    case 'BALL':
      return null
  }
}

export const STRIKES_PER_OUT = 3
export const OUTS_PER_GAME = 3

/**
 * 튜토리얼 코칭 (§13.3 방식).
 *
 * 야구는 조작이 아니라 **규칙**이 낯설다. 축구는 조작만 처음이고 규칙은
 * 자명했지만("4개 중 하나 고르기"), 야구의 "안 치는 것도 선택"은
 * 4지선다에 익숙한 학습자에게 반직관적이다. 설명 없이 두면 다 치려고 들고,
 * 첫 판이 30초 만에 3아웃으로 끝난다.
 *
 * 그래서 글로 설명하지 않고 **실제 상황에서 화면을 멈춘다.**
 */
export type CoachCue =
  /** 타석 시작 — 정답이 하나뿐임을 알린다 */
  | 'INTRO'
  /** 오답 공이 왔다 — 보내야 한다 */
  | 'TAKE'
  /** 정답 공이 왔다 — 쳐야 한다 */
  | 'SWING'
  /** 연습 타석이 끝났다 — 3스트라이크 아웃을 알린다 */
  | 'OUTS'

/** 코칭이 저절로 풀리는 시간. SWING은 칠 때까지 기다리므로 없다. */
export const COACH_HOLD_MS: Record<Exclude<CoachCue, 'SWING'>, number> = {
  INTRO: 2400,
  TAKE: 1800,
  OUTS: 2000,
}

/** 한 줄을 넘기지 않는다 (§13.3) */
export const COACH_LINE: Record<CoachCue, string> = {
  INTRO: '공 4개 중 정답은 하나뿐입니다',
  TAKE: '이 공은 치지 마세요',
  SWING: '이 공을 치세요',
  OUTS: '스트라이크 3개면 아웃입니다',
}

/**
 * 한 타석에 날아오는 공의 수 (§15.2).
 *
 * 문서는 5개를 규정하지만 현재 데이터는 단어당 오답이 3개뿐이라
 * 정답 1 + 오답 3 = 4개가 최대다. 오답은 사전 지정만 쓰고 랜덤으로
 * 채우지 않는다(§10.4) — 무관한 단어를 섞으면 소거법으로 풀린다.
 * 데이터에 4번째 오답이 들어오면 이 값만 5로 올리면 된다.
 */
export const BALLS_PER_AT_BAT = 4

/**
 * 타석 상한 (§15.3).
 *
 * **10타석 또는 3아웃 중 먼저 오는 쪽**에서 판이 끝난다.
 *
 * 스트라이크는 야구 규칙대로 타석마다 초기화된다. 그러면 소극적으로 다
 * 거르는 플레이어는 타석당 스트라이크 1개씩만 받아 영원히 아웃되지 않으므로,
 * 종료 조건이 하나 더 필요하다. 상한을 두는 쪽이 스트라이크 누적보다 낫다 —
 * 누적은 사람들이 이미 아는 야구 상식과 어긋나서, 새 규칙 하나를 배우는 게
 * 아니라 알던 것을 버리고 배우게 만든다.
 *
 * 10은 축구 10문제와 길이를 맞추고, 실제 야구의 이닝 상한과도 은유가 맞는다.
 */
export const MAX_AT_BATS = 10

export interface CountState {
  strikes: number
  outs: number
  /** 지금까지 완료한 타석 수 — 1000점 환산에 쓴다 (§15.7) */
  atBats: number
}

export function createCountState(): CountState {
  return { strikes: 0, outs: 0, atBats: 0 }
}

export interface CountResult {
  count: CountState
  /** 이번 판정으로 아웃이 되었는가 */
  outed: boolean
  /** 이번 판정으로 타석이 끝났는가 (안타 또는 아웃) */
  atBatOver: boolean
  /** 3아웃으로 판이 끝났는가 */
  gameOver: boolean
}

/**
 * 한 공의 판정을 카운트에 반영한다. 기존 상태는 변경하지 않는다.
 *
 * `lastBall`은 그 타석의 마지막 공이었는지다. 정답을 이미 흘려보낸 뒤
 * 남은 오답을 모두 걸러도 타석은 끝나야 하므로, 공이 소진되면 타석을 닫는다.
 *
 * 스트라이크는 **타석이 끝나면 초기화**된다 — 야구 규칙 그대로다.
 */
export function applyPitch(
  count: CountState,
  outcome: PitchOutcome,
  lastBall: boolean,
): CountResult {
  const strikes = count.strikes + (isStrike(outcome) ? 1 : 0)
  const outed = strikes >= STRIKES_PER_OUT
  const atBatOver = endsAtBat(outcome) || outed || lastBall

  const outs = count.outs + (outed ? 1 : 0)
  const atBats = count.atBats + (atBatOver ? 1 : 0)

  return {
    count: {
      strikes: atBatOver ? 0 : strikes,
      outs,
      atBats,
    },
    outed,
    atBatOver,
    // 3아웃 또는 10타석 중 먼저 오는 쪽 (§15.3)
    gameOver: outs >= OUTS_PER_GAME || atBats >= MAX_AT_BATS,
  }
}

/* ── 1000점 환산 (§15.7 / §8.1) ────────────────────────────── */

/** 환산 기준 타석 수 */
export const REFERENCE_AT_BATS = 10

/**
 * 완벽한 한 판의 점수. 환산의 분모다.
 *
 * 상수로 박지 않고 §5 산식에서 뽑는다. 점수·콤보를 조정하면 환산도
 * 자동으로 따라가야 하고, 숫자를 두 곳에 적어 두면 반드시 어긋난다.
 */
export function perfectRoundScore(atBats: number = REFERENCE_AT_BATS): number {
  let state = createScoreState()
  for (let i = 0; i < atBats; i++) {
    state = applyAnswer(state, 'CORRECT', 'RESET').state
  }
  return state.score
}

/**
 * 타석 수가 가변이므로 총점을 그대로 쓸 수 없다 (§15.7).
 * 타석당 평균 × 기준 타석 수로 맞춘 뒤 1000점 만점으로 환산한다.
 *
 * 정규화하지 않으면 오래 버틴 플레이어가 자동으로 유리해져
 * 종목 간 형평이 깨진다.
 */
export function normalizedScore(total: number, atBats: number): number {
  if (atBats <= 0) return 0
  return Math.round((total / atBats) * REFERENCE_AT_BATS)
}

export function toMedalScale(total: number, atBats: number): number {
  const perfect = perfectRoundScore()
  if (perfect <= 0) return 0
  const scaled = Math.round((normalizedScore(total, atBats) / perfect) * 1000)
  return Math.max(0, Math.min(1000, scaled))
}
