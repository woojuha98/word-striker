/**
 * localStorage — v1은 최고 점수만 저장한다 (§2).
 *
 * 키를 종목별로 나눠 둔다. 종목이 늘어나도(§9) 키 구조를 바꿀 필요가 없고,
 * v2.2 메달 시스템이 종목별 원점수를 요구할 때 그대로 쓰인다.
 */

import type { WordLevel } from '../types/word'
import { DEFAULT_LEVEL, isWordLevel } from './level'

/** 종목 식별자 (§9) */
export type SportId = 'SOCCER_PK' | 'BASEBALL'

/**
 * 등급은 별개의 대회이므로 기록도 등급별로 나눈다 (§8.3).
 * 초급 기록과 고급 기록을 한 칸에 담으면 서로를 덮어써 비교가 불가능해진다.
 */
const bestScoreKey = (sport: SportId, level: WordLevel) =>
  `word-striker:best-score:${sport}:${level}`

/** 저장소 접근은 실패할 수 있다 (사파리 시크릿 모드 등). 실패해도 게임은 계속된다. */
export function loadBestScore(sport: SportId, level: WordLevel): number {
  try {
    const raw = localStorage.getItem(bestScoreKey(sport, level))
    const value = raw === null ? 0 : Number(raw)
    return Number.isFinite(value) && value >= 0 ? value : 0
  } catch {
    return 0
  }
}

export function saveBestScore(
  sport: SportId,
  level: WordLevel,
  score: number,
): void {
  try {
    localStorage.setItem(bestScoreKey(sport, level), String(score))
  } catch {
    // 무시 — 기록 저장 실패로 플레이를 막지 않는다
  }
}

/** 모든 등급의 최고 점수 — 시작 화면에서 한 번에 보여준다 */
export function loadAllBestScores(
  sport: SportId,
): Record<WordLevel, number> {
  return {
    basic: loadBestScore(sport, 'basic'),
    intermediate: loadBestScore(sport, 'intermediate'),
    advanced: loadBestScore(sport, 'advanced'),
  }
}

/** 음소거 상태 (§14.5) */
const MUTED_KEY = 'word-striker:muted'

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === '1'
  } catch {
    return false
  }
}

export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTED_KEY, muted ? '1' : '0')
  } catch {
    // 무시
  }
}

/** 마지막으로 고른 등급을 기억해 매번 다시 고르지 않게 한다 */
const LEVEL_KEY = 'word-striker:level'

export function loadLevel(): WordLevel {
  try {
    const raw = localStorage.getItem(LEVEL_KEY)
    return isWordLevel(raw) ? raw : DEFAULT_LEVEL
  } catch {
    return DEFAULT_LEVEL
  }
}

export function saveLevel(level: WordLevel): void {
  try {
    localStorage.setItem(LEVEL_KEY, level)
  } catch {
    // 무시
  }
}

/** 튜토리얼은 첫 실행에 1회만 노출한다 (§13.3) */
const TUTORIAL_KEY = 'word-striker:tutorial-seen'

export function loadTutorialSeen(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1'
  } catch {
    // 저장소를 못 읽으면 매번 보여준다.
    // 조작을 모르는 채로 시작하는 쪽이 한 번 더 보는 쪽보다 나쁘다.
    return false
  }
}

export function saveTutorialSeen(): void {
  try {
    localStorage.setItem(TUTORIAL_KEY, '1')
  } catch {
    // 무시
  }
}
