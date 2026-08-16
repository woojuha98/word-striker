import { motion } from 'framer-motion'
import { KEEPER_DIVE_MS } from '../game/timing'

interface Props {
  /** -1 왼쪽 / +1 오른쪽 / null 제자리 */
  dive: -1 | 1 | null
}

/**
 * 골키퍼 (§13.2 / §12.5)
 *
 * 골대 정중앙 교차점에 서 있어 4칸 중 어느 칸과도 완전히 겹치지 않는다 (§4.2).
 * 다이빙 방향은 게이지 판정이 정하지만, **점수와는 무관하다** (§7.2).
 *
 * 중앙 정렬은 바깥 div의 CSS가, 다이빙은 안쪽 motion이 맡는다.
 * 한 요소에서 둘 다 하면 `-50%` 정렬과 다이빙 이동이 같은 transform 키를
 * 두고 서로 덮어쓴다.
 */
export function Keeper({ dive }: Props) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
    >
      <motion.div
        data-keeper
        className="leading-none"
        animate={
          dive
            ? { x: dive * 90, y: 30, rotate: dive * 60 }
            : { x: 0, y: 0, rotate: 0 }
        }
        transition={{ duration: KEEPER_DIVE_MS / 1000, ease: 'easeOut' }}
      >
        <KeeperFigure />
      </motion.div>
    </div>
  )
}

/** 유니폼은 잔디(초록)·정답(초록)·오답(빨강)·콤보(노랑) 어디와도 겹치지 않는 색이어야 한다 */
const JERSEY = '#38BDF8'
const GLOVE = '#F8FAFC'
const SKIN = '#F0C7A6'
const SHORTS = '#0F172A'

function KeeperFigure() {
  return (
    <svg width="46" height="50" viewBox="0 0 46 50">
      {/* 팔 — 위로 벌린 자세라 다이빙할 때 실루엣이 살아난다 */}
      <g
        stroke={JERSEY}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M15 24 L6 15" />
        <path d="M31 24 L40 15" />
      </g>

      {/* 글러브 */}
      <g fill={GLOVE} stroke={SHORTS} strokeWidth="1.2">
        <circle cx="5" cy="13" r="5.5" />
        <circle cx="41" cy="13" r="5.5" />
      </g>

      {/* 다리 */}
      <g fill={SHORTS}>
        <rect x="16" y="35" width="5.5" height="13" rx="2.75" />
        <rect x="24.5" y="35" width="5.5" height="13" rx="2.75" />
      </g>

      {/* 몸통 */}
      <path
        d="M14.5 22 Q23 18 31.5 22 L32.5 37 Q23 40 13.5 37 Z"
        fill={JERSEY}
      />

      {/* 머리 */}
      <circle cx="23" cy="11.5" r="6.2" fill={SKIN} />
    </svg>
  )
}
