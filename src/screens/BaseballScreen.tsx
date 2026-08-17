import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { AutoFitText } from '../components/AutoFitText'
import { BaseballField } from '../components/BaseballField'
import { Batter } from '../components/Batter'
import { Hud } from '../components/Hud'
import { PROMPT_SIZES, SENTENCE_SIZES } from '../components/textSizes'
import {
  BALLS_PER_AT_BAT,
  MAX_AT_BATS,
  OUTS_PER_GAME,
  STRIKES_PER_OUT,
  type PitchOutcome,
} from '../game/baseball'
import {
  phaseDuration,
  PITCH_TRAVEL_MS,
  showsBall,
  SWING_WINDOW_MS,
} from '../game/pitch'
import { playSound } from '../game/sound'
import { selectAtBat, useBaseballStore } from '../store/baseballStore'

/** 판정창이 열리는 지점 — game/pitch.ts의 WINDOW_ENTRY와 같아야 한다 */
const WINDOW_ENTRY = 0.62

const OUTCOME_LABEL: Record<PitchOutcome, string> = {
  HIT: '안타!',
  SWING_MISS: '헛스윙',
  TAKEN_STRIKE: '스트라이크',
  BALL: '볼',
}

/**
 * 야구 화면 (§15)
 *
 * 공은 마운드에서 홈플레이트로 날아오고, 판정창 안에서 탭하면 스윙이다.
 * 단계는 스토어가 들고 있고 화면은 단계마다 타이머만 건다 (§15.6) —
 * 공 위치를 보고 "도착했으니 끝"으로 판정하지 않는다.
 */
export function BaseballScreen() {
  const pitchPhase = useBaseballStore((s) => s.pitchPhase)
  const phaseStartedAt = useBaseballStore((s) => s.phaseStartedAt)
  const atBat = useBaseballStore(selectAtBat)
  const ballIndex = useBaseballStore((s) => s.ballIndex)
  const atBatIndex = useBaseballStore((s) => s.atBatIndex)
  const count = useBaseballStore((s) => s.count)
  const score = useBaseballStore((s) => s.score)
  const lastOutcome = useBaseballStore((s) => s.lastOutcome)
  const lastOuted = useBaseballStore((s) => s.lastOuted)
  const swing = useBaseballStore((s) => s.swing)
  const advance = useBaseballStore((s) => s.advance)

  const fieldRef = useRef<HTMLButtonElement>(null)
  const [fieldHeight, setFieldHeight] = useState(0)

  useEffect(() => {
    const el = fieldRef.current
    if (!el) return
    const measure = () => setFieldHeight(el.clientHeight)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 단계마다 정해진 시간이 지나면 다음 단계로 (§15.6).
  // 읽기 시간만 문제 유형에 따라 다르다.
  useEffect(() => {
    if (!atBat) return
    const id = setTimeout(advance, phaseDuration(pitchPhase, atBat.type))
    return () => clearTimeout(id)
  }, [pitchPhase, phaseStartedAt, atBat, advance])

  // 휘슬은 타석마다 한 번. 공마다 울리면 한 판에 40번이라 금방 피로해진다.
  useEffect(() => {
    if (pitchPhase === 'READING') playSound('question')
  }, [pitchPhase, phaseStartedAt])

  // 판정 결과 소리
  useEffect(() => {
    if (pitchPhase !== 'RESULT' || !lastOutcome) return
    if (lastOutcome === 'HIT') playSound('goal')
    else if (lastOutcome === 'SWING_MISS') playSound('wrong')
    else if (lastOutcome === 'TAKEN_STRIKE') playSound('timeout')
  }, [pitchPhase, lastOutcome, phaseStartedAt])

  if (!atBat) return null

  const ballLabel = atBat.options[ballIndex]
  const isSentence = atBat.type === 'CLOZE'

  return (
    <div className="relative mx-auto flex h-full max-w-[430px] flex-col overflow-hidden">
      <header className="safe-top relative z-10 shrink-0 basis-[10%] px-4">
        <Hud
          score={score.score}
          tier={score.combo.tier}
          progress={`${atBatIndex + 1} / ${MAX_AT_BATS}타석`}
        />
      </header>

      {/* 카운트 — 야구는 남은 문제 수가 아니라 S/O로 진행을 읽는다 */}
      <div className="relative z-10 flex shrink-0 basis-[5%] items-center gap-4 px-4 text-xs">
        <Dots label="S" filled={count.strikes} total={STRIKES_PER_OUT} tone="bg-combo" />
        <Dots label="O" filled={count.outs} total={OUTS_PER_GAME} tone="bg-wrong" />
        <span className="ml-auto text-frame/40">
          공 {ballIndex + 1} / {BALLS_PER_AT_BAT}
        </span>
      </div>

      <div className="relative z-10 flex shrink-0 basis-[15%] items-center justify-center px-4">
        <AutoFitText
          sizes={isSentence ? SENTENCE_SIZES : PROMPT_SIZES}
          className="font-bold"
        >
          {atBat.prompt}
        </AutoFitText>
      </div>

      {/* 읽기 단계 — 공이 오기 전에 문제를 먼저 본다 (§15.2) */}
      {pitchPhase === 'READING' && (
        <motion.div
          key={`reading-${atBatIndex}`}
          className="pointer-events-none absolute inset-x-0 top-[32%] z-20 flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
        >
          <span className="text-xs tracking-widest text-combo">
            {atBatIndex + 1}번 타자
          </span>
          <span className="text-[11px] text-frame/50">
            {isSentence ? '문장을 읽고 빈칸에 들어갈 말을 고르세요' : '뜻을 고르세요'}
          </span>
        </motion.div>
      )}

      {/* 필드 — 여기를 탭하면 스윙 */}
      <button
        type="button"
        ref={fieldRef}
        data-field
        onPointerDown={swing}
        className="relative grow overflow-hidden"
      >
        <BaseballField />

        {/* 타자 — 홈플레이트 왼쪽 타석에 선다 */}
        <div className="absolute bottom-[6%] left-[26%] z-10">
          <Batter />
        </div>

        {/* 날아오는 공. 위치는 단계가 정한다 — 위치로 단계를 되짚지 않는다 */}
        {showsBall(pitchPhase) && fieldHeight > 0 && (
          <motion.div
            data-pitch-ball
            className="absolute left-1/2 top-0 -translate-x-1/2"
            initial={{ y: 0, scale: 0.55 }}
            animate={ballTarget(pitchPhase, fieldHeight)}
            transition={{
              duration: ballDuration(pitchPhase) / 1000,
              ease: 'linear',
            }}
          >
            <span className="flex min-w-24 items-center justify-center rounded-full bg-frame px-3 py-2 text-sm font-bold text-night shadow-lg">
              {ballLabel}
            </span>
          </motion.div>
        )}

        {/* 판정 결과 */}
        {pitchPhase === 'RESULT' && lastOutcome && (
          <motion.div
            key={`${atBatIndex}-${ballIndex}`}
            className="absolute inset-x-0 top-[38%] flex flex-col items-center gap-1"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.12 }}
          >
            <span
              className={`text-3xl font-extrabold tracking-wide ${
                lastOutcome === 'HIT'
                  ? 'text-combo'
                  : lastOutcome === 'BALL'
                    ? 'text-frame/70'
                    : 'text-wrong'
              }`}
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
            >
              {OUTCOME_LABEL[lastOutcome]}
            </span>
            {lastOuted && (
              <span className="text-lg font-bold text-wrong">아웃</span>
            )}
          </motion.div>
        )}

        {/* 판정창 표시 — 언제 쳐야 하는지 보이게 한다 */}
        {pitchPhase === 'WINDOW' && (
          <div
            data-swing-window
            className="absolute inset-x-6 bottom-[10%] h-1 rounded-full bg-correct/60"
          />
        )}
      </button>
    </div>
  )
}

/** 단계별로 공이 도달할 지점 */
function ballTarget(phase: string, fieldHeight: number) {
  if (phase === 'PITCHING') {
    return { y: fieldHeight * WINDOW_ENTRY, scale: 1 }
  }
  return { y: fieldHeight * 0.88, scale: 1.15 }
}

function ballDuration(phase: string) {
  return phase === 'PITCHING' ? PITCH_TRAVEL_MS : SWING_WINDOW_MS
}

function Dots({
  label,
  filled,
  total,
  tone,
}: {
  label: string
  filled: number
  total: number
  tone: string
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-frame/50">{label}</span>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2.5 w-2.5 rounded-full ${
            i < filled ? tone : 'bg-frame/20'
          }`}
        />
      ))}
    </span>
  )
}
