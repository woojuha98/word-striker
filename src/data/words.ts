import { isWordLevel } from '../game/level'
import type { OptionLang, Word } from '../types/word'
import { answerFor, distractorsFor, koPromptOf } from '../types/word'
import raw from './words.json' with { type: 'json' }

/**
 * v1 어휘 팩 — 교육과정 기본어휘 30개 (§10.3)
 * 구성: 동사 12 / 명사 10 / 형용사 8
 *
 * v1.3부터 확장형(§10.2)이다 — 한국어·영어 오답을 모두 갖는다.
 */
// JSON에서 `level`은 string으로 추론되므로 좁혀 준다.
// 실제 값이 세 등급 중 하나인지는 아래 DEV 검증이 지킨다.
export const WORDS = raw as Word[]

// `?.` — Vite 밖(검증 스크립트 등)에서 이 모듈을 그냥 import 해도 터지지 않게 한다
if (import.meta.env?.DEV) {
  // 어휘 팩이 늘어날 때(§10.5) 데이터 실수를 개발 중에 바로 잡아낸다.
  const ids = new Set<string>()
  const koPrompts = new Set<string>()
  for (const word of WORDS) {
    if (ids.has(word.id)) console.error(`[words] id 중복: ${word.id}`)
    ids.add(word.id)

    // 등급이 없거나 잘못되면 그 단어는 어느 대회에도 출제되지 않는다 (§8.3)
    if (!isWordLevel(word.level)) {
      console.error(`[words] ${word.id} 등급이 잘못됨: ${String(word.level)}`)
    }

    // KO_EN 제시어가 겹치면 정답이 둘이 된다 (§15)
    const prompt = koPromptOf(word)
    if (koPrompts.has(prompt)) {
      console.error(`[words] KO_EN 제시어 중복: "${prompt}" (${word.id})`)
    }
    koPrompts.add(prompt)

    // 문제 유형이 쓰는 두 언어를 같은 기준으로 본다 (§10.4)
    for (const lang of ['ko', 'en'] as OptionLang[]) {
      const distractors = distractorsFor(word, lang)
      const answer = answerFor(word, lang)
      const label = `${word.id}(${lang})`

      if (distractors.length !== 3) {
        console.error(`[words] ${label} 오답이 3개가 아님 (${distractors.length})`)
      }
      if (distractors.includes(answer)) {
        console.error(`[words] ${label} 오답에 정답이 섞여 있음`)
      }
      if (new Set(distractors).size !== distractors.length) {
        console.error(`[words] ${label} 오답 중복`)
      }
    }

    // CLOZE 예문 (§6.3) — 없으면 자동 제외되므로 있을 때만 검사한다
    if (word.example !== undefined) {
      const blanks = word.example.split('___').length - 1
      if (blanks !== 1) {
        console.error(`[words] ${word.id} 예문의 빈칸이 1개가 아님 (${blanks})`)
      }
      // 빈칸 밖에 정답이 그대로 노출되면 문제가 성립하지 않는다
      if (new RegExp(`\\b${word.en}\\b`, 'i').test(word.example)) {
        console.error(`[words] ${word.id} 예문에 정답 단어가 드러나 있음`)
      }
    }
  }
}
