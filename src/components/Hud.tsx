import { animate, motion, useAnimationControls, useMotionValue } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { multiplierOf, type ComboTier } from '../game/score'
import {
  SCORE_COUNTUP_MS,
  SCORE_POP_MS,
  SCORE_POP_SCALE,
} from '../game/timing'
import { MuteButton } from './MuteButton'

interface Props {
  score: number
  tier: ComboTier
  /**
   * 진행 표시. 축구는 "3 / 10"이지만 야구는 3아웃까지 문항 수가 정해지지
   * 않는다(§15.1). 종목이 문자열을 직접 준다 — 없으면 표시하지 않는다.
   */
  progress?: string
}

/**
 * 상단 HUD (§4.1)
 *
 * 점수에 `tabular-nums`는 필수다. 없으면 점수가 오를 때 숫자 폭이 변해
 * HUD가 흔들린다 (§12.3).
 */
export function Hud({ score, tier, progress }: Props) {
  return (
    <div className="flex h-full items-center justify-between">
      <div className="flex items-baseline gap-2">
        <span className="text-xs text-frame/50">점수</span>
        <ScoreCounter score={score} />
      </div>

      <div className="flex items-center gap-2">
        {progress && (
          <span className="text-xs tabular-nums text-frame/50">{progress}</span>
        )}
        <span
          className={`text-lg font-bold tabular-nums ${
            tier > 0 ? 'text-combo' : 'text-frame/40'
          }`}
        >
          ×{multiplierOf(tier).toFixed(1)}
          {tier > 0 && ' 🔥'}
        </span>
        <MuteButton />
      </div>
    </div>
  )
}

/**
 * 점수 카운트업 + 팝 (§14.7)
 *
 * 숫자는 DOM에 직접 써넣는다. 상태로 두면 0.4초 동안 매 프레임
 * HUD 전체가 리렌더된다.
 */
function ScoreCounter({ score }: { score: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const shown = useMotionValue(score)
  const pop = useAnimationControls()
  const previous = useRef(score)

  useEffect(() => {
    return shown.on('change', (value) => {
      if (ref.current) {
        ref.current.textContent = Math.round(value).toLocaleString('ko-KR')
      }
    })
  }, [shown])

  useEffect(() => {
    if (previous.current === score) return
    previous.current = score

    const controls = animate(shown, score, {
      duration: SCORE_COUNTUP_MS / 1000,
      ease: 'easeOut',
    })
    pop.start({
      scale: [1, SCORE_POP_SCALE, 1],
      transition: { duration: SCORE_POP_MS / 1000 },
    })
    return () => controls.stop()
  }, [score, shown, pop])

  return (
    <motion.span
      animate={pop}
      className="inline-block origin-left text-2xl font-bold tabular-nums"
    >
      <span ref={ref}>{score.toLocaleString('ko-KR')}</span>
    </motion.span>
  )
}
