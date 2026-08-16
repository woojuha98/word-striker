/**
 * 게임 상태 (Zustand)
 *
 * 점수 계산은 전부 `game/score.ts`의 순수 함수에 위임한다.
 * 이 스토어는 "언제 어떤 판정을 넘길지"와 화면 전환만 담당한다 (§0).
 *
 * 타이머는 스토어가 돌리지 않는다. 문제 시작 시각(`askStartedAt`)만 들고 있고
 * 카운트다운 표시와 시간초과 감지는 화면이 한다.
 */

import { create } from 'zustand'
import { WORDS } from '../data/words'
import { judgeGauge, type GaugeZone } from '../game/gauge'
import {
  buildRound,
  QUESTIONS_PER_ROUND,
  type Question,
} from '../game/question'
import {
  applyAnswer,
  createScoreState,
  type AnswerOutcome,
  type AnswerResult,
  type ScoreState,
} from '../game/score'
import {
  loadAllBestScores,
  loadLevel,
  loadTutorialSeen,
  saveBestScore,
  saveLevel,
  saveTutorialSeen,
  type SportId,
} from '../game/storage'
import type { WordLevel } from '../types/word'

const SPORT: SportId = 'SOCCER_PK'

/** 화면 흐름 (§4.4) */
export type Phase =
  /** 시작 화면 */
  | 'TITLE'
  /** 문제 제시, 입력 대기 */
  | 'ASKING'
  /** 골대 칸을 누른 채 유지 중. 파워 게이지 왕복 (§7.2) */
  | 'CHARGING'
  /** 판정 완료, 슛 연출 중. 추가 입력을 받지 않는다 */
  | 'RESOLVED'
  /** 결과 화면 */
  | 'RESULT'

/** 직전 문제의 판정 — 연출에 필요한 정보를 함께 싣는다 */
export interface LastAnswer extends AnswerResult {
  outcome: AnswerOutcome
  /** 플레이어가 탭한 칸. 시간초과면 null */
  selectedIndex: number | null
  /** 정답 칸 — 오답 시 정답 위치를 보여주기 위해 */
  answerIndex: number
  /** 게이지 구간. 골키퍼 반응과 골/선방 연출에만 쓰인다 (§13.2) */
  zone: GaugeZone | null
}

/** 오답 리뷰용 기록 (§13.4) */
export interface AnswerRecord {
  wordId: string
  /** 제시어 (영어 단어) */
  prompt: string
  /** 정답 뜻 */
  answer: string
  /** 내가 고른 뜻. 시간초과면 null */
  picked: string | null
  outcome: AnswerOutcome
}

interface GameStore {
  phase: Phase
  questions: Question[]
  index: number
  score: ScoreState
  last: LastAnswer | null
  /** 이번 판의 문제별 결과 (§13.4) */
  history: AnswerRecord[]
  /** 현재 문제가 제시된 시각(ms). 카운트다운 기준점 */
  askStartedAt: number
  /** 누르기 시작한 칸과 시각. 게이지 판정 기준점 */
  chargingIndex: number | null
  chargeStartedAt: number
  /** 이번 판의 등급 (§8.3) */
  level: WordLevel
  /** 등급별 최고 점수 — 서로 다른 대회이므로 따로 센다 */
  bestScores: Record<WordLevel, number>
  /** 이번 판이 최고 기록을 경신했는지 — 결과 화면 표시용 */
  isNewBest: boolean
  /** 튜토리얼 오버레이가 떠 있는지. 첫 조작에서 닫힌다 (§13.3) */
  tutorialActive: boolean
  /**
   * 이 판이 튜토리얼로 시작했는지.
   * 오버레이를 닫은 뒤에도 첫 문제의 시간 제한을 풀어 두려면
   * 오버레이 표시 여부와 별도의 수명을 가진 플래그가 필요하다.
   */
  tutorialRound: boolean

  setLevel: (level: WordLevel) => void
  startGame: () => void
  /** 골대 칸을 누르기 시작 — 게이지 왕복 시작, 문제 타이머 정지 */
  pressCell: (optionIndex: number) => void
  /** 손을 뗌(또는 자동 발사) — 게이지 정지, 판정 */
  release: () => void
  /** 제한 시간이 지났을 때 */
  timeUp: () => void
  /** 슛 연출이 끝나고 다음 문제로 */
  next: () => void
  toTitle: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'TITLE',
  questions: [],
  index: 0,
  score: createScoreState(),
  last: null,
  history: [],
  askStartedAt: 0,
  chargingIndex: null,
  chargeStartedAt: 0,
  level: loadLevel(),
  bestScores: loadAllBestScores(SPORT),
  isNewBest: false,
  tutorialActive: false,
  tutorialRound: false,

  setLevel: (level) => {
    if (get().phase !== 'TITLE') return
    saveLevel(level)
    set({ level })
  },

  startGame: () => {
    const firstPlay = !loadTutorialSeen()
    const { level } = get()
    set({
      phase: 'ASKING',
      questions: buildRound(WORDS, { count: QUESTIONS_PER_ROUND, level }),
      index: 0,
      score: createScoreState(),
      last: null,
      history: [],
      askStartedAt: Date.now(),
      chargingIndex: null,
      chargeStartedAt: 0,
      isNewBest: false,
      tutorialActive: firstPlay,
      tutorialRound: firstPlay,
    })
  },

  pressCell: (optionIndex) => {
    if (get().phase !== 'ASKING') return

    // 누른 시점에 문제 타이머는 멈춘다 (§7.2).
    // 이 규칙이 없으면 "단어는 아는데 게이지 맞추다 시간초과"가 발생해
    // 학습 평가가 오염된다. 화면이 phase를 보고 카운트다운을 멈춘다.
    set({
      phase: 'CHARGING',
      chargingIndex: optionIndex,
      chargeStartedAt: Date.now(),
    })

    if (get().tutorialActive) {
      // 조작을 한 번 해봤으면 튜토리얼은 끝이다
      saveTutorialSeen()
      set({ tutorialActive: false })
    }
  },

  release: () => {
    const { phase, chargingIndex, chargeStartedAt, questions, index } = get()
    if (phase !== 'CHARGING' || chargingIndex === null) return

    const question = questions[index]
    const correct = chargingIndex === question.answerIndex
    resolve(
      set,
      get,
      correct ? 'CORRECT' : 'WRONG',
      chargingIndex,
      judgeGauge(Date.now() - chargeStartedAt),
    )
  },

  timeUp: () => {
    if (get().phase !== 'ASKING') return
    resolve(set, get, 'TIMEOUT', null, null)
  },

  next: () => {
    const { phase, index, questions, score, bestScores, level } = get()
    if (phase !== 'RESOLVED') return

    const nextIndex = index + 1
    if (nextIndex < questions.length) {
      set({
        phase: 'ASKING',
        index: nextIndex,
        last: null,
        askStartedAt: Date.now(),
        chargingIndex: null,
      })
      return
    }

    // 기록 비교는 같은 등급 안에서만 한다 (§8.3)
    const isNewBest = score.score > bestScores[level]
    if (isNewBest) saveBestScore(SPORT, level, score.score)
    set({
      phase: 'RESULT',
      bestScores: {
        ...bestScores,
        [level]: Math.max(bestScores[level], score.score),
      },
      isNewBest,
    })
  },

  toTitle: () => {
    set({
      phase: 'TITLE',
      questions: [],
      index: 0,
      last: null,
      chargingIndex: null,
      tutorialActive: false,
    })
  },
}))

type SetState = (partial: Partial<GameStore>) => void

function resolve(
  set: SetState,
  get: () => GameStore,
  outcome: AnswerOutcome,
  selectedIndex: number | null,
  zone: GaugeZone | null,
) {
  const { score, questions, index, history } = get()
  const question = questions[index]
  const result = applyAnswer(score, outcome)

  set({
    phase: 'RESOLVED',
    score: result.state,
    last: {
      ...result,
      outcome,
      selectedIndex,
      answerIndex: question.answerIndex,
      zone,
    },
    history: [
      ...history,
      {
        wordId: question.wordId,
        prompt: question.prompt,
        answer: question.options[question.answerIndex],
        picked: selectedIndex === null ? null : question.options[selectedIndex],
        outcome,
      },
    ],
  })
}

/** 현재 문제. 시작 전이거나 판이 끝났으면 undefined */
export const selectCurrentQuestion = (s: GameStore): Question | undefined =>
  s.questions[s.index]

/**
 * 튜토리얼 문제인가 — 첫 문제는 시간 제한 없이 진행한다 (§13.3).
 * 조작을 처음 익히는 중이므로 시간 압박을 걸지 않는다.
 */
export const selectIsTutorialQuestion = (s: GameStore): boolean =>
  s.tutorialRound && s.index === 0

/**
 * 오답 리뷰 대상 (§13.4)
 *
 * ⚠ 스토어 셀렉터로 쓰지 말 것. 매번 새 배열을 반환하므로
 * `useSyncExternalStore`가 스냅샷이 계속 바뀐다고 판단해 무한 렌더에 빠진다.
 * 화면에서는 `history`(참조가 안정적)를 구독한 뒤 이 함수를 적용한다.
 */
export const mistakesOf = (history: AnswerRecord[]): AnswerRecord[] =>
  history.filter((r) => r.outcome !== 'CORRECT')
