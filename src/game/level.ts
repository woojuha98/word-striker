/**
 * 난이도 등급 (§8.3 / §6.2)
 *
 * 등급은 난이도 조절이 아니라 **별개의 대회**다.
 * 고정 메달 기준(§8.2)을 흔들지 않으면서 초급 학습자도 금메달에 도달할 수 있게
 * 하려면, 기준을 낮추는 대신 경기 자체를 나눠야 한다.
 *
 * 따라서 등급별로 다른 것은 두 가지뿐이다 — 출제 어휘와 문제 구성.
 * 점수 산식(§5)은 모든 등급에서 동일하다.
 */

import type { QuestionType, WordLevel } from '../types/word'
import type { ComboDropRule } from './score'

export const LEVELS: WordLevel[] = ['basic', 'intermediate', 'advanced']

export const LEVEL_LABEL: Record<WordLevel, string> = {
  basic: '초급',
  intermediate: '중급',
  advanced: '고급',
}

export const LEVEL_DESCRIPTION: Record<WordLevel, string> = {
  basic: '교육과정 기본어휘',
  intermediate: '뜻을 떠올리는 연습',
  advanced: '문맥 속에서 고르기',
}

/**
 * §6.2 등급별 문제 유형 출현 비율.
 * 밸런싱은 이 숫자만 고쳐서 한다 — 로직은 비율을 읽어 갈 뿐이다.
 */
export const TYPE_RATIO: Record<WordLevel, Record<QuestionType, number>> = {
  basic: { EN_KO: 0.65, KO_EN: 0.35, CLOZE: 0 },
  intermediate: { EN_KO: 0.35, KO_EN: 0.45, CLOZE: 0.2 },
  advanced: { EN_KO: 0.2, KO_EN: 0.4, CLOZE: 0.4 },
}

/**
 * §5.3 등급별 콤보 하락 규칙.
 *
 * 완전 초기화를 전 등급에 적용하면 어휘를 모르는 입문자는 콤보를 아예
 * 쌓지 못한다. 초급만 보호하고 중·고급에 긴장감을 두는 절충이다.
 *
 * 상한 ×2.0과 단계 임계값은 등급과 무관하게 같다.
 */
export const COMBO_DROP_BY_LEVEL: Record<WordLevel, ComboDropRule> = {
  basic: 'STEP',
  intermediate: 'RESET',
  advanced: 'RESET',
}

/**
 * §6.2 — 초급은 모든 시간 제한에 ×1.3.
 * 어휘가 낯선 단계에서는 인출 자체에 시간이 더 걸리므로,
 * 시간 압박이 어휘 지식을 가리지 않도록 한다.
 */
export const LEVEL_TIME_SCALE: Record<WordLevel, number> = {
  basic: 1.3,
  intermediate: 1,
  advanced: 1,
}

/** 기본 등급 — 처음 들어온 사람이 마주할 대회 */
export const DEFAULT_LEVEL: WordLevel = 'basic'

export function isWordLevel(value: unknown): value is WordLevel {
  return typeof value === 'string' && (LEVELS as string[]).includes(value)
}
