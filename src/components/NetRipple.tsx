import { motion } from 'framer-motion'
import { NET_RIPPLE_MS } from '../game/timing'

/**
 * 네트 출렁임 (§14.7) — 공이 닿은 지점 기준으로 파동이 퍼진다.
 *
 * 공이 실제로 골대 안으로 들어갔을 때만(게이지 초록) 나타난다.
 * 선방이면 네트에 닿지 않으므로 출렁이지 않는다.
 *
 * `transform`과 `opacity`만 쓴다 (§14.9). 파티클은 쓰지 않는다 (§14.8).
 */
export function NetRipple({ optionIndex }: { optionIndex: number }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute z-0 h-24 w-24 rounded-full border-2 border-frame/70"
      style={{
        left: optionIndex % 2 === 0 ? '25%' : '75%',
        top: optionIndex < 2 ? '25%' : '75%',
        marginLeft: -48,
        marginTop: -48,
      }}
      initial={{ scale: 0.2, opacity: 0.8 }}
      animate={{ scale: 1.6, opacity: 0 }}
      transition={{ duration: NET_RIPPLE_MS / 1000, ease: 'easeOut' }}
    />
  )
}
