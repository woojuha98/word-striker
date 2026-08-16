/**
 * 야구 한 판 (§15)
 *
 * 축구 스토어와 나란히 두고 App이 종목으로 갈라 준다. 점수 계산은 두 종목이
 * 같은 순수 함수(§5)를 쓰고, 야구 용어는 표시 계층에만 있다 (§15.4).
 *
 * §15.6 — 단계는 항상 명시적이다. "공이 멈췄다"로 완료를 판정하지 않는다.
 */

import { create } from 'zustand'
import {
  applyPitch,
  BALLS_PER_AT_BAT,
  createCountState,
  judgePitch,
  OUTS_PER_GAME,
  scoreOutcomeOf,
  toMedalScale,
  type CountState,
  type PitchOutcome,
} from '../game/baseball'
import { COMBO_DROP_BY_LEVEL } from '../game/level'
import { acceptsSwing, NEXT_PHASE, type PitchPhase } from '../game/pitch'
import { buildRound, type Question } from '../game/question'
import { WORDS } from '../data/words'
import {
  applyAnswer,
  createScoreState,
  type AnswerResult,
  type ScoreState,
} from '../game/score'
import {
  loadBestScore,
  saveBestScore,
  type SportId,
} from '../game/storage'
import type { WordLevel } from '../types/word'

const SPORT: SportId = 'BASEBALL'

/** 어휘가 떨어지기 전에 판이 끝나도록 넉넉히 잡는다 (등급당 50단어) */
const MAX_AT_BATS = 25

export type BaseballPhase = 'IDLE' | 'PLAYING' | 'RESULT'

interface BaseballStore {
  phase: BaseballPhase
  /** §15.6 투구 단계 */
  pitchPhase: PitchPhase
  /** 현재 단계가 시작된 시각 — 화면이 타이머를 걸 기준점 */
  phaseStartedAt: number

  level: WordLevel
  /** 타석 목록. 한 타석 = 한 단어 */
  atBats: Question[]
  atBatIndex: number
  /** 이번 타석에서 몇 번째 공인지 */
  ballIndex: number
  /** 이번 공에 스윙했는지 */
  swung: boolean
  lastOutcome: PitchOutcome | null
  lastAnswer: AnswerResult | null
  /** 직전 판정이 아웃이었는지 — 결과 표시에 쓴다 */
  lastOuted: boolean
  /** 직전 판정으로 타석이 끝났는지 */
  lastAtBatOver: boolean

  count: CountState
  score: ScoreState
  bestScore: number
  isNewBest: boolean

  start: (level: WordLevel) => void
  /** 판정창 안에서만 받는다 (§15.5) */
  swing: () => void
  /** 현재 단계의 시간이 다 되었을 때 화면이 부른다 */
  advance: () => void
  exit: () => void
}

export const useBaseballStore = create<BaseballStore>((set, get) => ({
  phase: 'IDLE',
  pitchPhase: 'READY',
  phaseStartedAt: 0,
  level: 'basic',
  atBats: [],
  atBatIndex: 0,
  ballIndex: 0,
  swung: false,
  lastOutcome: null,
  lastAnswer: null,
  lastOuted: false,
  lastAtBatOver: false,
  count: createCountState(),
  score: createScoreState(),
  bestScore: 0,
  isNewBest: false,

  start: (level) => {
    set({
      phase: 'PLAYING',
      pitchPhase: 'READY',
      phaseStartedAt: Date.now(),
      level,
      atBats: buildRound(WORDS, { level, count: MAX_AT_BATS }),
      atBatIndex: 0,
      ballIndex: 0,
      swung: false,
      lastOutcome: null,
      lastAnswer: null,
      lastOuted: false,
      lastAtBatOver: false,
      count: createCountState(),
      score: createScoreState(),
      bestScore: loadBestScore(SPORT, level),
      isNewBest: false,
    })
  },

  swing: () => {
    const { pitchPhase, swung } = get()
    // 판정창 밖의 탭은 헛스윙이 아니라 무시다 (§15.5)
    if (!acceptsSwing(pitchPhase) || swung) return
    set({ swung: true })
    resolvePitch(set, get, true)
  },

  advance: () => {
    const { phase, pitchPhase } = get()
    if (phase !== 'PLAYING') return

    if (pitchPhase === 'WINDOW') {
      // 판정창이 닫히는 시점에 "거름"이 확정된다 (§15.6)
      resolvePitch(set, get, get().swung)
      return
    }

    if (pitchPhase === 'RESULT') {
      nextBall(set, get)
      return
    }

    set({ pitchPhase: NEXT_PHASE[pitchPhase], phaseStartedAt: Date.now() })
  },

  exit: () => {
    set({ phase: 'IDLE', atBats: [], lastOutcome: null, lastAnswer: null })
  },
}))

type SetState = (partial: Partial<BaseballStore>) => void
type GetState = () => BaseballStore

/** 공 하나를 판정하고 결과 단계로 넘어간다 */
function resolvePitch(set: SetState, get: GetState, swung: boolean) {
  const { atBats, atBatIndex, ballIndex, count, score, level } = get()
  const atBat = atBats[atBatIndex]
  if (!atBat) return

  const isAnswer = ballIndex === atBat.answerIndex
  const outcome = judgePitch(swung, isAnswer)

  // 점수는 §5 산식 그대로. 오답을 거른 경우(null)는 계산 자체를 하지 않아
  // 감점도 콤보 하락도 없다 (§15.4).
  const scoreOutcome = scoreOutcomeOf(outcome)
  const answer = scoreOutcome
    ? applyAnswer(score, scoreOutcome, COMBO_DROP_BY_LEVEL[level])
    : null

  // 카운트 판정은 여기서 한 번만 하고, 결과 플래그를 그대로 들고 간다.
  // 다음 단계에서 다시 추론하면 두 곳의 규칙이 어긋난다.
  const counted = applyPitch(
    count,
    outcome,
    ballIndex >= BALLS_PER_AT_BAT - 1,
  )

  set({
    pitchPhase: 'RESULT',
    phaseStartedAt: Date.now(),
    lastOutcome: outcome,
    lastAnswer: answer,
    lastOuted: counted.outed,
    lastAtBatOver: counted.atBatOver,
    score: answer ? answer.state : score,
    count: counted.count,
  })
}

/** 결과 표시가 끝난 뒤 — 다음 공 / 다음 타석 / 판 종료 */
function nextBall(set: SetState, get: GetState) {
  const {
    atBats,
    atBatIndex,
    ballIndex,
    lastAtBatOver,
    count,
    score,
    level,
    bestScore,
  } = get()

  // 3아웃이면 판 종료. 어휘가 떨어져도 끝낸다.
  const gameOver =
    count.outs >= OUTS_PER_GAME ||
    (lastAtBatOver && atBatIndex + 1 >= atBats.length)

  if (gameOver) {
    const medal = toMedalScale(score.score, Math.max(1, count.atBats))
    const isNewBest = medal > bestScore
    if (isNewBest) saveBestScore(SPORT, level, medal)
    set({
      phase: 'RESULT',
      isNewBest,
      bestScore: Math.max(bestScore, medal),
    })
    return
  }

  set({
    pitchPhase: 'READY',
    phaseStartedAt: Date.now(),
    swung: false,
    lastOutcome: null,
    lastAnswer: null,
    lastOuted: false,
    lastAtBatOver: false,
    ...(lastAtBatOver
      ? { atBatIndex: atBatIndex + 1, ballIndex: 0 }
      : { ballIndex: ballIndex + 1 }),
  })
}

/** 현재 타석. 판이 끝났으면 undefined */
export const selectAtBat = (s: BaseballStore): Question | undefined =>
  s.atBats[s.atBatIndex]

/** 1000점 환산 결과 (§15.7) */
export const selectMedalScore = (s: BaseballStore): number =>
  toMedalScale(s.score.score, Math.max(1, s.count.atBats))
