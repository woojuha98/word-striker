/**
 * 난수 유틸 — 종목이 늘어나도 공용으로 쓴다.
 *
 * 시드를 주면 결정적으로 동작하므로 출제 로직을 재현 가능한 형태로 검증할 수 있다.
 * 실제 플레이에서는 시드 없이 Math.random을 쓴다.
 */

export type Rng = () => number

export function createRng(seed?: number): Rng {
  if (seed === undefined) return Math.random

  // mulberry32
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates. 원본 배열은 건드리지 않는다. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = items.slice()
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
