import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { GAUGE_CYCLE_MS, GREEN_ZONE } from '../game/gauge'

const NEEDLE_PX = 6

/**
 * 파워 게이지 (§7.2) — 누르고 있는 동안만 나타난다.
 *
 * 표시는 모션 값으로 직접 구동하고(매 프레임 렌더 없음), 실제 구간 판정은
 * 스토어가 경과 시간으로 계산한다(`judgeGauge`). 둘은 같은 주기를 쓰므로
 * 화면에서 본 위치와 판정이 어긋나지 않는다.
 */
export function PowerGauge({ startedAt }: { startedAt: number }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  const position = useMotionValue(0)
  // left가 아니라 transform을 움직인다 — 매 프레임 레이아웃 재계산 방지 (§14.9)
  const x = useTransform(position, [0, 1], [0, Math.max(0, width - NEEDLE_PX)])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const controls = animate(position, 1, {
      duration: GAUGE_CYCLE_MS / 2000, // 편도 0.6초 → 왕복 1.2초
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'reverse',
    })
    // 늦게 마운트되어도 판정(경과 시간 기준)과 어긋나지 않게 맞춘다
    controls.time = (Date.now() - startedAt) / 1000
    return () => controls.stop()
  }, [startedAt, position])

  return (
    <div
      ref={trackRef}
      className="relative h-3 w-full overflow-hidden rounded-full bg-night/70 ring-1 ring-frame/30"
    >
      {/* 초록 구간 — 중앙 기준 전체 폭의 30% */}
      <div
        className="absolute inset-y-0 bg-correct/70"
        style={{
          left: `${GREEN_ZONE[0] * 100}%`,
          width: `${(GREEN_ZONE[1] - GREEN_ZONE[0]) * 100}%`,
        }}
      />
      {/* 왕복하는 바늘 */}
      <motion.div
        style={{ x, width: NEEDLE_PX }}
        className="absolute inset-y-0 left-0 rounded-full bg-frame"
      />
    </div>
  )
}
