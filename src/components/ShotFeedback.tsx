import { motion } from 'framer-motion'
import type { ShotResult } from '../game/shot'
import { FLOAT_SCORE_MS, FLOAT_SCORE_RISE } from '../game/timing'

interface Props {
  result: ShotResult
  /**
   * 이번 문제의 점수 변동.
   * 하한 0에 걸려 실제로는 반영되지 않았더라도 **원값**을 보여준다 (§5.1).
   * "무엇 때문에 감점됐는지"는 총점 변화와 별개로 알려줘야 한다.
   */
  delta: number
  /** 고른 칸. 시간초과면 null → 골대 중앙에 띄운다 */
  optionIndex: number | null
  /** 콤보가 올랐을 때의 새 배수. 오르지 않았으면 null */
  comboMultiplier: number | null
}

/**
 * 판정 결과 문구 + 획득 점수 (§14.7)
 *
 * 숫자만 뜨면 "얻었는지 잃었는지"를 부호로만 읽어야 한다.
 * 골대 칸 색과 부호가 이미 있지만, 판정 직후 0.8초 동안 눈이 가는 곳은
 * 공이 꽂힌 자리다. 그 자리에 말로 적어 준다.
 *
 * ⚠ 문구는 **점수 방향과 어긋나면 안 된다.**
 *   정답인데 선방당한 경우는 점수가 들어간다. 여기에 MISS를 띄우면
 *   화면은 실패인데 점수는 성공인 상태가 되어, §7.2를 고친 이유가
 *   그대로 되살아난다.
 */
const LABEL: Record<ShotResult, string> = {
  GOAL: 'GOAL',
  SAVED: 'SAVED',
  CAUGHT: 'MISS',
  NONE: 'TIME UP',
}

export function ShotFeedback({
  result,
  delta,
  optionIndex,
  comboMultiplier,
}: Props) {
  const gained = delta > 0
  const left =
    optionIndex === null ? '50%' : optionIndex % 2 === 0 ? '25%' : '75%'
  const top = optionIndex === null ? '45%' : optionIndex < 2 ? '25%' : '75%'

  return (
    // 위치 잡기는 CSS가, 떠오르는 움직임은 motion이 맡는다.
    // 한 요소에서 둘 다 하면 가운데 정렬과 이동이 같은 transform을 두고 다툰다.
    <div
      aria-hidden
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
      style={{ left, top }}
    >
      <motion.div
        className="flex flex-col items-center gap-0.5 text-center"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.85)' }}
        initial={{ opacity: 0, y: -FLOAT_START_ABOVE, scale: 0.85 }}
        animate={{
          opacity: [0, 1, 1, 0],
          y: -FLOAT_START_ABOVE - FLOAT_SCORE_RISE,
          scale: 1,
        }}
        transition={{ duration: FLOAT_SCORE_MS / 1000, ease: 'easeOut' }}
      >
        <span
          className={`text-2xl leading-none font-extrabold tracking-wide ${
            gained ? 'text-combo' : 'text-frame'
          }`}
        >
          {LABEL[result]}
        </span>

        <span
          className={`text-lg leading-none font-bold tabular-nums ${
            gained ? 'text-combo' : 'text-frame'
          }`}
        >
          {gained ? '+' : '−'}
          {Math.abs(delta)}
        </span>

        {comboMultiplier !== null && (
          <span className="text-xs leading-none font-bold tracking-wide text-combo">
            COMBO ×{comboMultiplier.toFixed(1)}
          </span>
        )}
      </motion.div>
    </div>
  )
}

/** 선택지 글자 위에서 출발하도록 띄우는 거리(px) */
const FLOAT_START_ABOVE = 52
