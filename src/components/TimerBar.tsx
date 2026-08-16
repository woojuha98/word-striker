import { animate, motion, useMotionValue } from 'framer-motion'
import { useEffect, useState } from 'react'
import { TIMER_PULSE_MS, TIMER_WARNING_MS } from '../game/timing'

interface Props {
  /** 문제가 제시된 시각 */
  startedAt: number
  durationMs: number
  /** 카운트다운 진행 여부. false면 그 자리에서 멈춘다 */
  running: boolean
}

/**
 * 타이머 바 (§4.1)
 *
 * 폭이 아니라 `transform: scaleX`를 애니메이션한다 (§14.9).
 * 매 프레임 React 렌더를 일으키지 않도록 모션 값으로 직접 구동하고,
 * 숫자와 경고 상태만 0.1초 간격으로 갱신한다.
 */
export function TimerBar({ startedAt, durationMs, running }: Props) {
  const scaleX = useMotionValue(1)
  const [remaining, setRemaining] = useState(durationMs)

  useEffect(() => {
    const left = Math.max(0, startedAt + durationMs - Date.now())
    scaleX.set(left / durationMs)
    if (!running) return

    const controls = animate(scaleX, 0, {
      duration: left / 1000,
      ease: 'linear',
    })
    // 판정이 끝나면 그 위치에서 정지한다
    return () => controls.stop()
  }, [startedAt, durationMs, running, scaleX])

  useEffect(() => {
    const update = () =>
      setRemaining(Math.max(0, startedAt + durationMs - Date.now()))
    update()
    if (!running) return

    const id = setInterval(update, 100)
    return () => clearInterval(id)
  }, [startedAt, durationMs, running])

  // §14.7 — 1초 이하부터 경고
  const warning = running && remaining <= TIMER_WARNING_MS

  return (
    <div className="flex h-full items-center gap-2">
      <span aria-hidden className="text-xs">
        ⏱
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-frame/15">
        <motion.div
          style={{ scaleX }}
          animate={{ opacity: warning ? [1, 0.4, 1] : 1 }}
          transition={
            warning
              ? { duration: TIMER_PULSE_MS / 1000, repeat: Infinity }
              : { duration: 0.15 }
          }
          className={`h-full w-full origin-left rounded-full ${
            warning ? 'bg-wrong' : 'bg-frame'
          }`}
        />
      </div>
      <span
        className={`w-10 text-right text-xs tabular-nums ${
          warning ? 'font-bold text-wrong' : 'text-frame/70'
        }`}
      >
        {(remaining / 1000).toFixed(1)}s
      </span>
    </div>
  )
}
