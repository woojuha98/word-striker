/**
 * 문제 생성 (§6)
 *
 * 유형별 생성 함수(`BUILDERS`) + 공통 인터페이스(`Question`) 구조다.
 * v1.3의 KO_EN, v1.4의 CLOZE는 BUILDERS에 항목을 채우는 것으로 끝나며
 * 호출부(스토어·화면)는 바뀌지 않는다.
 *
 * 어휘 원본의 형태에는 직접 접근하지 않고 `answerFor` / `distractorsFor`
 * 접근자만 사용한다 (§10.2).
 */

import type { QuestionType, Word, WordLevel } from '../types/word'
import { OPTION_LANG, answerFor, distractorsFor, koPromptOf } from '../types/word'
import { DEFAULT_LEVEL, LEVEL_TIME_SCALE, TYPE_RATIO } from './level'
import { shuffle, type Rng } from './rng'

/** 골대 4분할 (§4.2) — 선택지 개수는 골대 칸 수와 같다 */
export const OPTION_COUNT = 4

/** 한 판 문제 수 (§2) */
export const QUESTIONS_PER_ROUND = 10

/**
 * 출제 유형 (§3 로드맵)
 * v1: EN_KO만 → v1.3: KO_EN 추가 → v1.4: CLOZE 추가(예문 데이터 필요)
 *
 * 유형별 출현 비율은 v2.0에서 등급별로 나뉜다(§6.2). 그전까지는 균등이다.
 */
export const ACTIVE_QUESTION_TYPES: QuestionType[] = ['EN_KO', 'KO_EN', 'CLOZE']

export interface Question {
  wordId: string
  type: QuestionType
  /** 문제 영역에 표시할 제시문 (§4.1) */
  prompt: string
  /** 골대 4칸에 들어갈 선택지. 셔플 완료 상태 */
  options: string[]
  /** `options` 안의 정답 위치 */
  answerIndex: number
  timeLimitMs: number
}

/** §6.1 유형별 시간 제한 */
export const TIME_LIMIT_BY_TYPE: Record<QuestionType, number> = {
  EN_KO: 4000,
  KO_EN: 5000,
  CLOZE: 8000,
}

/** v1 단순화용 고정값. 유형이 하나뿐일 때 쓰였다 (§6.1) */
export const V1_TIME_LIMIT_MS = 5000

/**
 * 유형별 차등 적용 여부 (§6.1).
 * v1.3에서 KO_EN이 추가되며 켰다 — EN_KO 4초 / KO_EN 5초.
 * 한→영은 철자를 떠올려야 해서 영→한보다 시간이 더 든다.
 */
export const USE_TYPE_TIME_LIMIT = true

/**
 * 유형·등급별 제한 시간.
 * 초급은 §6.2에 따라 ×1.3이 곱해진다.
 */
export function timeLimitFor(
  type: QuestionType,
  level: WordLevel = DEFAULT_LEVEL,
): number {
  const base = USE_TYPE_TIME_LIMIT ? TIME_LIMIT_BY_TYPE[type] : V1_TIME_LIMIT_MS
  return Math.round(base * LEVEL_TIME_SCALE[level])
}

/**
 * 그 등급에서 실제로 나오는 유형들의 제한 시간 범위(초).
 * 시작 화면 안내가 등급 구성과 어긋나지 않도록 여기서 파생시킨다.
 */
export function activeTimeLimitRange(level: WordLevel = DEFAULT_LEVEL): {
  min: number
  max: number
} {
  const seconds = ACTIVE_QUESTION_TYPES.filter(
    (type) => TYPE_RATIO[level][type] > 0,
  ).map((type) => timeLimitFor(type, level) / 1000)
  return { min: Math.min(...seconds), max: Math.max(...seconds) }
}

/** 유형별 생성 함수. 해당 단어로 그 유형을 낼 수 없으면 null (§6.3) */
type QuestionBuilder = (word: Word, rng: Rng) => Question | null

const BUILDERS: Record<QuestionType, QuestionBuilder> = {
  EN_KO: (word, rng) => assemble(word, 'EN_KO', word.en, rng),
  // 다의어는 koPrompt로 뜻을 좁힌다. 없으면 ko로 폴백 (§15)
  KO_EN: (word, rng) => assemble(word, 'KO_EN', koPromptOf(word), rng),
  // example이 없으면 자동 제외 (§6.3)
  CLOZE: (word, rng) =>
    word.example ? assemble(word, 'CLOZE', word.example, rng) : null,
}

function assemble(
  word: Word,
  type: QuestionType,
  prompt: string,
  rng: Rng,
): Question | null {
  const lang = OPTION_LANG[type]
  const distractors = distractorsFor(word, lang)

  // 해당 언어의 오답이 모자라면 출제하지 않는다.
  // (v1 단순형 데이터에는 영어 오답이 없으므로 KO_EN/CLOZE가 여기서 걸러진다)
  if (distractors.length < OPTION_COUNT - 1) return null

  const answer = answerFor(word, lang)
  const options = shuffle(
    [answer, ...distractors.slice(0, OPTION_COUNT - 1)],
    rng,
  )

  return {
    wordId: word.id,
    type,
    prompt,
    options,
    answerIndex: options.indexOf(answer),
    // 등급은 단어에 붙어 있다 — 판을 만들 때와 낱개로 만들 때가 일치한다
    timeLimitMs: timeLimitFor(type, word.level ?? DEFAULT_LEVEL),
  }
}

export function createQuestion(
  word: Word,
  type: QuestionType,
  rng: Rng,
): Question | null {
  return BUILDERS[type](word, rng)
}

/** 해당 단어로 그 유형을 출제할 수 있는지 (§6.3) */
export function canAsk(word: Word, type: QuestionType): boolean {
  return createQuestion(word, type, Math.random) !== null
}

export interface RoundOptions {
  count?: number
  level?: WordLevel
  rng?: Rng
}

/**
 * 한 판에 낼 유형 목록을 §6.2 비율대로 배분한다.
 *
 * 문제마다 확률로 뽑지 않는다 — 한 판이 10문제뿐이라 편차가 커서
 * 65:35가 90:10으로 나오는 판이 생긴다. 정수로 미리 배분한 뒤 섞는다.
 * (최대잔여법: 내림 후 남은 자리를 소수부가 큰 순서로 채운다)
 */
export function planTypes(
  level: WordLevel,
  count: number,
  rng: Rng,
): QuestionType[] {
  const ratio = TYPE_RATIO[level]
  const shares = ACTIVE_QUESTION_TYPES.map((type) => {
    const exact = ratio[type] * count
    return {
      type,
      base: Math.floor(exact),
      remainder: exact - Math.floor(exact),
      // 소수부가 같을 때를 대비한 무작위 순위.
      // 고정 순서로 깨면 항상 같은 유형이 남은 자리를 가져가, 초급이
      // 65:35 대신 매 판 70:30으로 굳는다.
      tiebreak: rng(),
    }
  })

  let left = count - shares.reduce((sum, s) => sum + s.base, 0)
  const byRemainder = [...shares].sort(
    (a, b) => b.remainder - a.remainder || b.tiebreak - a.tiebreak,
  )
  for (const share of byRemainder) {
    if (left <= 0) break
    // 비율이 0인 유형에는 남은 자리를 주지 않는다 (초급의 CLOZE 등)
    if (ratio[share.type] === 0) continue
    share.base++
    left--
  }

  return shuffle(
    shares.flatMap((s) => Array<QuestionType>(s.base).fill(s.type)),
    rng,
  )
}

/**
 * 한 판 분량의 문제를 만든다.
 * 한 판 안에서 같은 단어가 두 번 나오지 않는다 (§6.3).
 *
 * 등급은 출제 어휘와 유형 구성을 함께 정한다 (§8.3).
 */
export function buildRound(
  words: readonly Word[],
  options: RoundOptions = {},
): Question[] {
  const {
    count = QUESTIONS_PER_ROUND,
    level = DEFAULT_LEVEL,
    rng = Math.random,
  } = options

  const pool = shuffle(
    words.filter((word) => word.level === level),
    rng,
  )
  const plan = planTypes(level, count, rng)

  const questions: Question[] = []
  const used = new Set<string>()
  const unmet: QuestionType[] = []

  // 계획된 유형마다, 그 유형을 낼 수 있는 아직 안 쓴 단어를 찾는다.
  for (const type of plan) {
    const word = pool.find((w) => !used.has(w.id) && canAsk(w, type))
    if (!word) {
      unmet.push(type)
      continue
    }
    used.add(word.id)
    questions.push(createQuestion(word, type, rng)!)
  }

  // 데이터가 모자라 못 채운 자리는 낼 수 있는 유형으로 메운다.
  // (예: 예문이 없으면 CLOZE 자리가 비므로 §6.2 비율이 그만큼 어긋난다)
  for (const missed of unmet) {
    const filled = pool.find(
      (w) => !used.has(w.id) && ACTIVE_QUESTION_TYPES.some((t) => canAsk(w, t)),
    )
    if (!filled) break
    used.add(filled.id)
    const fallback = ACTIVE_QUESTION_TYPES.find((t) => canAsk(filled, t))!
    questions.push(createQuestion(filled, fallback, rng)!)

    if (import.meta.env?.DEV) {
      console.warn(
        `[question] ${level}: ${missed} 문제를 낼 단어가 없어 ${fallback}로 대체했다.` +
          ` §6.2 비율이 어긋난다.`,
      )
    }
  }

  if (import.meta.env?.DEV && questions.length < count) {
    console.error(
      `[question] ${level} 출제 가능한 단어가 부족하다: ${questions.length}/${count}`,
    )
  }

  return shuffle(questions, rng)
}
