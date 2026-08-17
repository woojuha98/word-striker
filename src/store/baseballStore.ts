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
  endsAtBat,
  judgePitch,
  MAX_AT_BATS,
  scoreOutcomeOf,
  toMedalScale,
  type CoachCue,
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
  loadBaseballTutorialSeen,
  loadBestScore,
  saveBaseballTutorialSeen,
  saveBestScore,
  type SportId,
} from '../game/storage'
import type { WordLevel } from '../types/word'

const SPORT: SportId = 'BASEBALL'

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
  /** 직전 판정으로 판이 끝났는지 (3아웃 또는 10타석) */
  lastGameOver: boolean

  count: CountState
  score: ScoreState
  bestScore: number
  isNewBest: boolean

  /** 이 판이 튜토리얼로 시작했는지 — 첫 타석이 연습 타석이 된다 (§13.3) */
  tutorialRound: boolean
  /**
   * 지금 띄운 코칭. 값이 있으면 **단계 진행이 멈춘다** —
   * 실제 상황에서 멈춰 보여주는 것이 글로 설명하는 것보다 잘 남는다.
   */
  coach: CoachCue | null

  start: (level: WordLevel) => void
  /** 판정창 안에서만 받는다 (§15.5) */
  swing: () => void
  /** 현재 단계의 시간이 다 되었을 때 화면이 부른다 */
  advance: () => void
  /** 코칭을 닫고 멈춰 있던 단계를 다시 흐르게 한다 */
  clearCoach: () => void
  exit: () => void
}

/** 연습 타석인가 — 스트라이크·아웃·점수를 집계하지 않는다 */
function isPractice(s: BaseballStore): boolean {
  return s.tutorialRound && s.atBatIndex === 0
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
    lastGameOver: false,
  count: createCountState(),
  score: createScoreState(),
  bestScore: 0,
  isNewBest: false,
  tutorialRound: false,
  coach: null,

  start: (level) => {
    const firstPlay = !loadBaseballTutorialSeen()
    set({
      phase: 'PLAYING',
      // 첫 타석도 문제를 읽고 시작한다
      pitchPhase: 'READING',
      tutorialRound: firstPlay,
      coach: firstPlay ? 'INTRO' : null,
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
    lastGameOver: false,
      count: createCountState(),
      score: createScoreState(),
      bestScore: loadBestScore(SPORT, level),
      isNewBest: false,
    })
  },

  swing: () => {
    const state = get()

    // "이 공을 치세요"에서 멈춰 있다면, 그 탭이 곧 정답 스윙이다
    if (state.coach === 'SWING') {
      set({ coach: null, swung: true })
      resolvePitch(set, get, true)
      return
    }
    // 다른 코칭 중에는 탭을 받지 않는다 — 치지 말라고 해놓고 받으면 안 된다
    if (state.coach) return

    // 판정창 밖의 탭은 헛스윙이 아니라 무시다 (§15.5)
    if (!acceptsSwing(state.pitchPhase) || state.swung) return
    set({ swung: true })
    resolvePitch(set, get, true)
  },

  advance: () => {
    const { phase, pitchPhase, coach } = get()
    if (phase !== 'PLAYING') return
    // 코칭이 떠 있는 동안은 시간이 흐르지 않는다
    if (coach) return

    if (pitchPhase === 'WINDOW') {
      // 판정창이 닫히는 시점에 "거름"이 확정된다 (§15.6)
      resolvePitch(set, get, get().swung)
      return
    }

    if (pitchPhase === 'RESULT') {
      nextBall(set, get)
      return
    }

    const next = NEXT_PHASE[pitchPhase]

    // 연습 타석에서는 공이 판정 지점에 오는 순간 멈춰서 알려 준다
    if (next === 'WINDOW' && isPractice(get())) {
      const atBat = get().atBats[get().atBatIndex]
      const isAnswer = atBat ? get().ballIndex === atBat.answerIndex : false
      set({
        pitchPhase: next,
        phaseStartedAt: Date.now(),
        coach: isAnswer ? 'SWING' : 'TAKE',
      })
      return
    }

    set({ pitchPhase: next, phaseStartedAt: Date.now() })
  },

  clearCoach: () => {
    // 멈춰 있던 단계를 지금부터 다시 센다
    set({ coach: null, phaseStartedAt: Date.now() })
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
  const lastBall = ballIndex >= BALLS_PER_AT_BAT - 1

  // 연습 타석은 판정만 보여 주고 아무것도 집계하지 않는다 (§13.3).
  // 규칙을 배우다 받은 스트라이크로 아웃이 되면 배우려던 의욕이 꺾인다.
  if (isPractice(get())) {
    const atBatOver = endsAtBat(outcome) || lastBall
    set({
      pitchPhase: 'RESULT',
      phaseStartedAt: Date.now(),
      lastOutcome: outcome,
      lastAnswer: null,
      lastOuted: false,
      lastAtBatOver: atBatOver,
      lastGameOver: false,
      coach: atBatOver ? 'OUTS' : null,
    })
    return
  }

  // 점수는 §5 산식 그대로. 오답을 거른 경우(null)는 계산 자체를 하지 않아
  // 감점도 콤보 하락도 없다 (§15.4).
  const scoreOutcome = scoreOutcomeOf(outcome)
  const answer = scoreOutcome
    ? applyAnswer(score, scoreOutcome, COMBO_DROP_BY_LEVEL[level])
    : null

  // 카운트 판정은 여기서 한 번만 하고, 결과 플래그를 그대로 들고 간다.
  // 다음 단계에서 다시 추론하면 두 곳의 규칙이 어긋난다.
  const counted = applyPitch(count, outcome, lastBall)

  set({
    pitchPhase: 'RESULT',
    phaseStartedAt: Date.now(),
    lastOutcome: outcome,
    lastAnswer: answer,
    lastOuted: counted.outed,
    lastAtBatOver: counted.atBatOver,
    lastGameOver: counted.gameOver,
    score: answer ? answer.state : score,
    count: counted.count,
  })
}

/** 결과 표시가 끝난 뒤 — 다음 공 / 다음 타석 / 판 종료 */
function nextBall(set: SetState, get: GetState) {
  const {
    atBatIndex,
    ballIndex,
    lastAtBatOver,
    lastGameOver,
    count,
    score,
    level,
    bestScore,
  } = get()

  // 종료 판정은 applyPitch가 이미 했다 (3아웃 또는 10타석).
  // 여기서 다시 계산하면 규칙이 두 곳에 생겨 반드시 어긋난다.
  if (lastGameOver) {
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

  // 연습 타석을 마쳤으면 튜토리얼은 끝이다. 중간에 나가면 다시 보여 준다.
  if (lastAtBatOver && isPractice(get())) saveBaseballTutorialSeen()

  set({
    // 새 타석이면 문제를 읽는 시간부터, 같은 타석이면 바로 다음 공
    pitchPhase: lastAtBatOver ? 'READING' : 'READY',
    phaseStartedAt: Date.now(),
    swung: false,
    lastOutcome: null,
    lastAnswer: null,
    lastOuted: false,
    lastAtBatOver: false,
    lastGameOver: false,
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

