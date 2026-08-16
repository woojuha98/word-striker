import { motion } from 'framer-motion'
import {
  FLOAT_SCORE_MS,
  FLOAT_SCORE_RISE,
  FLOAT_START_ABOVE,
} from '../game/timing'

interface Props {
  /**
   * 이번 문제의 점수 변동.
   * 하한 0에 걸려 실제로는 반영되지 않았더라도 **원값**을 보여준다 (§5.1).
   * "무엇 때문에 감점됐는지"는 총점 변화와 별개로 알려줘야 한다.
   */
  delta: number
  /** 고른 칸. 시간초과면 null → 골대 중앙에 띄운다 */
  optionIndex: number | null
}

/** 획득 점수 플로팅 (§14.7) — 골대에서 떠올라 사라진다 */
export function FloatingScore({ delta, optionIndex }: Props) {
  const gained = delta > 0
  const left =
    optionIndex === null ? '50%' : optionIndex % 2 === 0 ? '25%' : '75%'
  const top =
    optionIndex === null ? '45%' : optionIndex < 2 ? '25%' : '75%'

  return (
    <motion.div
      aria-hidden
      // 감점은 오답 칸(빨강) 위에 뜬다. 같은 빨강으로 쓰면 배경에 묻혀
      // 얼마를 잃었는지 읽을 수 없다. 부호가 이미 손실을 말하므로 색은 가독성을 택한다.
      className={`pointer-events-none absolute z-30 text-xl font-bold tabular-nums ${
        gained ? 'text-combo' : 'text-frame'
      }`}
      style={{
        left,
        top,
        textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.8)',
      }}
      // 칸 중앙에서 시작하면 선택지 글자를 덮어 정답을 읽을 수 없다.
      // 글자 위에서 출발해 더 위로 떠오른다.
      initial={{ opacity: 0, x: '-50%', y: -FLOAT_START_ABOVE, scale: 0.8 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: -FLOAT_START_ABOVE - FLOAT_SCORE_RISE,
        scale: 1,
      }}
      transition={{ duration: FLOAT_SCORE_MS / 1000, ease: 'easeOut' }}
    >
      {gained ? '+' : '−'}
      {Math.abs(delta)}
    </motion.div>
  )
}
