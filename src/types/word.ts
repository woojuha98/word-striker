/**
 * 어휘 데이터 타입 (§10)
 *
 * v1 데이터는 단순형(§10.1)이지만, 타입은 확장형(§10.2)까지 미리 수용한다.
 * 이렇게 두면 JSON에 필드를 추가하는 것만으로 v1.3~v1.4로 넘어갈 수 있고
 * 데이터 마이그레이션이 필요 없다.
 */

/** 문제 유형 (§6.1). v1은 EN_KO만 출제한다. */
export type QuestionType = 'EN_KO' | 'KO_EN' | 'CLOZE'

/** 어휘 난이도 등급 (§8.3). v2.0에서 사용. */
export type WordLevel = 'basic' | 'intermediate' | 'advanced'

/**
 * 오답 선택지 (§10.4 — 랜덤 추출 금지, 반드시 사전 지정).
 *
 * 단순형(v1)은 한국어 오답 배열, 확장형(v1.3~)은 언어별 객체다.
 * 설계 문서 §10.2의 확장형은 이 필드의 "형태"를 바꾸므로,
 * 두 형태를 모두 받는 유니온으로 두고 읽을 때 정규화한다(`distractorsFor`).
 */
export type Distractors = string[] | { ko: string[]; en?: string[] }

export interface Word {
  id: string
  /** 영어 표제어 */
  en: string
  /** 한국어 뜻. 골대 칸 크기 제약상 5~7자 이내 (§10.4) */
  ko: string
  /**
   * `KO_EN` 제시어로 쓸 뜻 (§15 다의어 처리).
   *
   * `ko`만으로 영어 단어가 하나로 좁혀지지 않는 경우에만 붙인다.
   * 예: 다리(강 위의) → bridge, 약(먹는 것) → medicine.
   * 골대 칸에는 여전히 짧은 `ko`가 들어가므로 칸 크기 제약과 무관하다.
   */
  koPrompt?: string
  distractors: Distractors
  /** v2.0 난이도 등급 */
  level?: WordLevel
  /** CLOZE용 예문. 빈칸은 `___`. 없으면 CLOZE 출제 대상에서 자동 제외 (§6.3) */
  example?: string
}

/** 선택지로 쓸 언어 */
export type OptionLang = 'ko' | 'en'

/**
 * 문제 유형이 요구하는 언어의 오답 3개를 꺼낸다.
 * 해당 언어 오답이 없으면 빈 배열 — 호출부에서 출제 제외 판단에 쓴다.
 */
export function distractorsFor(word: Word, lang: OptionLang): string[] {
  if (Array.isArray(word.distractors)) {
    // 단순형은 한국어 오답만 갖는다
    return lang === 'ko' ? word.distractors : []
  }
  return (lang === 'ko' ? word.distractors.ko : word.distractors.en) ?? []
}

/** 문제 유형별로 정답에 해당하는 텍스트를 꺼낸다. */
export function answerFor(word: Word, lang: OptionLang): string {
  return lang === 'ko' ? word.ko : word.en
}

/**
 * `KO_EN` 제시어 (§15).
 * 다의어만 `koPrompt`로 뜻을 좁히고, 나머지는 `ko`를 그대로 쓴다.
 */
export function koPromptOf(word: Word): string {
  return word.koPrompt ?? word.ko
}

/** 문제 유형 → 선택지 언어 */
export const OPTION_LANG: Record<QuestionType, OptionLang> = {
  EN_KO: 'ko',
  KO_EN: 'en',
  CLOZE: 'en',
}
