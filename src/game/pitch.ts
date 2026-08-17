/**
 * 투구 상태 전이 (§15.6) ★구현 주의
 *
 * 축구의 공은 한 번 차고 멈추므로 "멈추면 완료"로 판정할 수 있었다.
 * **야구는 공이 연속으로 날아오므로 그 가정이 성립하지 않는다.**
 * 어떤 순간에도 "지금 무슨 단계인가"가 상태로 명시되어야 하고,
 * 판정창이 닫히는 시점은 타이머로 확정한다.
 *
 *   문제 읽기 → 대기 → 투구 → 판정창 → 결과 → (다음 공 | 다음 타석)
 */

import type { QuestionType } from '../types/word'

export type PitchPhase =
  /**
   * 문제 읽기 — 타석이 시작될 때 한 번. 공은 아직 없다.
   *
   * 공에는 선택지만 적히므로, 문제 자체를 읽을 시간은 따로 줘야 한다.
   * 특히 CLOZE는 문장을 읽고 나서 선택지를 보는 **2단계 과제**라,
   * 투구와 동시에 제시하면 공이 보이는 950ms 안에 처리할 수 없다.
   */
  | 'READING'
  /** 대기 — 다음 공을 준비한다. 탭은 무시 */
  | 'READY'
  /** 투구 — 공이 날아오는 중. 아직 판정창이 아니므로 탭은 무시 */
  | 'PITCHING'
  /** 판정창 — 공이 홈플레이트 부근. 탭하면 스윙 */
  | 'WINDOW'
  /** 결과 — 판정이 확정되어 표시 중 */
  | 'RESULT'

/**
 * 공 하나의 주기 (§15.5). 대기 + 투구 + 판정창.
 *
 * 1.5초에서 1.1초로 줄였다. 야구는 공을 기다리는 수동적 시간이 대부분이라
 * 같은 길이라도 축구보다 길게 느껴진다. 1.5초에서는 전부 거를 때 한 판이
 * 약 80초로 축구(약 50초)의 1.6배였다.
 */
export const PITCH_CYCLE_MS = 1100

/**
 * 판정창 0.6초 — 공이 홈플레이트 부근에 있는 동안 (§15.5).
 *
 * ⚠ 주기를 줄여도 이 값은 건드리지 않는다.
 *   창까지 좁히면 단어를 아는 사람이 타이밍 때문에 틀리게 되어,
 *   조작 실패가 학습 평가를 오염시킨다 (§7.2). 주기만 줄이면
 *   압박은 올라가되 아는 사람이 손해 보지는 않는다.
 */
export const SWING_WINDOW_MS = 600

/** 다음 공을 준비하는 짧은 간격 */
export const PITCH_READY_MS = 150

/** 공이 날아오는 시간 — 판정창이 열리기 전까지 */
export const PITCH_TRAVEL_MS = PITCH_CYCLE_MS - PITCH_READY_MS - SWING_WINDOW_MS

/** 판정 결과를 보여주는 시간 */
export const PITCH_RESULT_MS = 500

/**
 * 문제를 읽는 시간 — 유형별 (§15.2).
 *
 * 단어 하나는 한눈에 들어오지만 예문은 읽어야 한다. CLOZE에 같은 시간을
 * 주면 문장을 다 읽기도 전에 공이 온다.
 */
export const READING_MS: Record<QuestionType, number> = {
  EN_KO: 800,
  KO_EN: 800,
  CLOZE: 2000,
}

/** 각 단계가 유지되는 시간. 읽기 시간만 문제 유형에 따라 다르다. */
export function phaseDuration(phase: PitchPhase, type: QuestionType): number {
  switch (phase) {
    case 'READING':
      return READING_MS[type]
    case 'READY':
      return PITCH_READY_MS
    case 'PITCHING':
      return PITCH_TRAVEL_MS
    case 'WINDOW':
      return SWING_WINDOW_MS
    case 'RESULT':
      return PITCH_RESULT_MS
  }
}

/**
 * 다음 단계.
 * RESULT 다음은 같은 타석의 READY다 — 타석이 끝나면 스토어가 READING으로 보낸다.
 */
export const NEXT_PHASE: Record<PitchPhase, PitchPhase> = {
  READING: 'READY',
  READY: 'PITCHING',
  PITCHING: 'WINDOW',
  WINDOW: 'RESULT',
  RESULT: 'READY',
}

/** 공이 화면에 있는 단계인가 */
export function showsBall(phase: PitchPhase): boolean {
  return phase === 'PITCHING' || phase === 'WINDOW' || phase === 'RESULT'
}

/**
 * 지금 스윙을 받을 수 있는가.
 *
 * 판정창 밖의 탭은 **헛스윙으로 치지 않고 무시**한다 (§15.5).
 * 오조작으로 감점되면 조작 실패가 학습 평가를 오염시킨다 — 파워 게이지를
 * 점수에서 떼어 둔 것과 같은 이유다 (§7.2).
 */
export function acceptsSwing(phase: PitchPhase): boolean {
  return phase === 'WINDOW'
}

/**
 * 공이 마운드에서 홈플레이트까지 온 정도 (0~1).
 * 화면은 이 값으로 공을 그린다 — 위치를 보고 단계를 되짚지 않는다.
 */
export function ballProgress(phase: PitchPhase, elapsedMs: number): number {
  switch (phase) {
    case 'READING':
    case 'READY':
      return 0
    case 'PITCHING':
      return clamp01(elapsedMs / PITCH_TRAVEL_MS) * WINDOW_ENTRY
    case 'WINDOW':
      return (
        WINDOW_ENTRY + clamp01(elapsedMs / SWING_WINDOW_MS) * (1 - WINDOW_ENTRY)
      )
    case 'RESULT':
      return 1
  }
}

/** 판정창이 열리는 시점의 공 위치 — 이 지점부터 홈플레이트 부근이다 */
const WINDOW_ENTRY = 0.62

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}
