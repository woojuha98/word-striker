import { motion } from 'framer-motion'
import type { PitchOutcome } from '../game/baseball'
import { PITCH_RESULT_MS } from '../game/pitch'
import { FLOAT_SCORE_RISE } from '../game/timing'

interface Props {
  outcome: PitchOutcome
  /**
   * 이번 공의 점수 변동. 오답을 거른 경우(BALL)는 계산 자체를 하지 않으므로
   * `null`이다 — 0점을 `+0`으로 적으면 잘한 판단이 실패처럼 읽힌다.
   * 하한 0에 걸렸더라도 **원값**을 보여준다 (§5.1, §14.7).
   */
  delta: number | null
  /** 콤보가 올랐을 때의 새 배수. 오르지 않았으면 null */
  comboMultiplier: number | null
  /** 이번 판정으로 아웃이 되었는가 */
  outed: boolean
}

/**
 * 공 하나의 판정 + 획득 점수 (§14.7을 야구에 적용)
 *
 * 축구의 ShotFeedback과 같은 역할이지만, 야구에는 **점수가 0인 성공**이
 * 있다. 오답 공을 거른 것이 그렇다. 이 종목을 넣은 이유가 억제 통제인데
 * (§15.1) 잘 참은 데 아무 반응이 없으면, 학습자는 "안 친 것"이 판단이
 * 아니라 아무 일도 아니었다고 배운다. 그래서 BALL만은 숫자 없이
 * **긍정 문구**로 갚아 준다.
 *
 * 축구는 공이 꽂힌 칸 위에 띄우지만 야구는 늘 홈플레이트 한 곳이라
 * 위치를 계산하지 않는다.
 */
const LABEL: Record<PitchOutcome, string> = {
  HIT: '안타!',
  SWING_MISS: '헛스윙',
  TAKEN_STRIKE: '스트라이크',
  // "볼"은 상황을 가리킬 뿐 잘했다는 뜻이 없다. 칭찬으로 바꿔 적는다.
  BALL: '굿 아이',
}

/** 판정별 색. 잘 거른 것은 감점 색을 쓰면 안 된다 */
const TONE: Record<PitchOutcome, string> = {
  HIT: 'text-combo',
  SWING_MISS: 'text-wrong',
  TAKEN_STRIKE: 'text-wrong',
  BALL: 'text-correct',
}

/**
 * 결과 단계 안에 끝나야 한다. 다음 공이 오는데 점수가 아직 떠 있으면
 * 어느 공의 결과인지 알 수 없다. 단계 길이(§15.6)를 넘기지 않도록
 * 여기서 맞춘다 — 단계를 늘려 연출에 맞추는 것이 아니다.
 */
const FLOAT_MS = PITCH_RESULT_MS - 40

export function PitchFeedback({
  outcome,
  delta,
  comboMultiplier,
  outed,
}: Props) {
  const gained = delta !== null && delta > 0

  return (
    <div
      aria-hidden
      data-pitch-feedback={outcome}
      className="pointer-events-none absolute inset-x-0 top-[38%] z-30 flex justify-center"
    >
      <motion.div
        className="flex flex-col items-center gap-0.5 text-center"
        style={{
          textShadow: '0 1px 3px rgba(0,0,0,0.95), 0 2px 10px rgba(0,0,0,0.85)',
        }}
        initial={{ opacity: 0, y: 0, scale: 0.85 }}
        animate={{ opacity: [0, 1, 1, 1], y: -FLOAT_SCORE_RISE, scale: 1 }}
        transition={{ duration: FLOAT_MS / 1000, ease: 'easeOut' }}
      >
        <span
          className={`text-3xl leading-none font-extrabold tracking-wide ${TONE[outcome]}`}
        >
          {LABEL[outcome]}
        </span>

        {/*
          점수가 0인 성공. 숫자 대신 무엇을 잘했는지 적는다.
          연습 타석은 delta가 없지만 판단 자체는 옳았으므로 이 줄은 남는다.
        */}
        {outcome === 'BALL' && (
          // 잔디 위의 초록 글씨는 묻힌다. 색은 큰 글자에 맡기고
          // 설명 줄은 흰색으로 읽히게 둔다
          <span className="text-xs leading-none font-bold text-frame/90">
            오답을 잘 걸렀습니다
          </span>
        )}

        {/* 연습 타석은 집계하지 않으므로 숫자가 아예 없다 (§13.3) */}
        {delta !== null && (
          <span
            className={`text-lg leading-none font-bold tabular-nums ${
              gained ? 'text-combo' : 'text-frame'
            }`}
          >
            {gained ? '+' : '−'}
            {Math.abs(delta)}
          </span>
        )}

        {comboMultiplier !== null && (
          <span className="text-xs leading-none font-bold tracking-wide text-combo">
            COMBO ×{comboMultiplier.toFixed(1)}
          </span>
        )}

        {outed && <span className="text-lg font-bold text-wrong">아웃</span>}
      </motion.div>
    </div>
  )
}
