import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { AutoFitText } from '../components/AutoFitText'
import { BaseballField } from '../components/BaseballField'
import { Batter } from '../components/Batter'
import { Hud } from '../components/Hud'
import { PitchFeedback } from '../components/PitchFeedback'
import { PROMPT_SIZES, SENTENCE_SIZES } from '../components/textSizes'
import {
  BALLS_PER_AT_BAT,
  COACH_HOLD_MS,
  COACH_LINE,
  MAX_AT_BATS,
  OUTS_PER_GAME,
  STRIKES_PER_OUT,
} from '../game/baseball'
import {
  COUNTDOWN_FROM,
  COUNTDOWN_STEP_MS,
  phaseDuration,
  PITCH_TRAVEL_MS,
  showsBall,
  SWING_WINDOW_MS,
} from '../game/pitch'
import { multiplierOf } from '../game/score'
import { playComboUp, playSound } from '../game/sound'
import { selectAtBat, useBaseballStore } from '../store/baseballStore'

/** 판정창이 열리는 지점 — game/pitch.ts의 WINDOW_ENTRY와 같아야 한다 */
const WINDOW_ENTRY = 0.62

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
  const lastAnswer = useBaseballStore((s) => s.lastAnswer)
  const lastOuted = useBaseballStore((s) => s.lastOuted)
  const coach = useBaseballStore((s) => s.coach)
  const tutorialRound = useBaseballStore((s) => s.tutorialRound)
  const swing = useBaseballStore((s) => s.swing)
  const advance = useBaseballStore((s) => s.advance)
  const clearCoach = useBaseballStore((s) => s.clearCoach)

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
  // 읽기 시간만 문제 유형에 따라 다르고, 코칭 중에는 시간이 멈춘다.
  useEffect(() => {
    if (!atBat || coach) return
    const id = setTimeout(advance, phaseDuration(pitchPhase, atBat.type))
    return () => clearTimeout(id)
  }, [pitchPhase, phaseStartedAt, atBat, coach, advance])

  // 3·2·1. 단계 길이는 스토어가 재고 화면은 숫자만 바꾼다 —
  // 여기서 다음 단계로 넘기지 않는다 (§15.6).
  // 코칭이 떠 있으면 시간이 멈추므로 카운트도 같이 멈춘다.
  const [countdown, setCountdown] = useState(COUNTDOWN_FROM)
  useEffect(() => {
    if (pitchPhase !== 'COUNTDOWN' || coach) return
    setCountdown(COUNTDOWN_FROM)
    const id = setInterval(
      () => setCountdown((n) => Math.max(1, n - 1)),
      COUNTDOWN_STEP_MS,
    )
    return () => clearInterval(id)
  }, [pitchPhase, phaseStartedAt, coach])

  // 코칭은 정해진 시간 뒤 저절로 닫힌다.
  // "이 공을 치세요"만 예외 — 실제로 칠 때까지 기다린다.
  useEffect(() => {
    if (!coach || coach === 'SWING') return
    const id = setTimeout(clearCoach, COACH_HOLD_MS[coach])
    return () => clearTimeout(id)
  }, [coach, clearCoach])

  // 휘슬은 타석마다 한 번. 공마다 울리면 한 판에 40번이라 금방 피로해진다.
  useEffect(() => {
    if (pitchPhase === 'READING') playSound('question')
  }, [pitchPhase, phaseStartedAt])

  // 판정 결과 소리. 오답을 거른 공(BALL)은 조용히 넘어간다 —
  // 타석당 세 번까지 나오는 판정이라 소리까지 붙이면 소음이 된다.
  useEffect(() => {
    if (pitchPhase !== 'RESULT' || !lastOutcome) return
    if (lastOutcome === 'HIT') playSound('goal')
    else if (lastOutcome === 'SWING_MISS') playSound('wrong')
    else if (lastOutcome === 'TAKEN_STRIKE') playSound('timeout')

    // 콤보 변화는 축구와 같은 규칙으로 들려준다 (§14.4)
    if (!lastAnswer) return
    if (lastAnswer.tierAfter > lastAnswer.tierBefore) playComboUp(lastAnswer.tierAfter)
    else if (lastAnswer.tierAfter < lastAnswer.tierBefore) playSound('comboDown')
  }, [pitchPhase, lastOutcome, lastAnswer, phaseStartedAt])

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
        {tutorialRound && atBatIndex === 0 ? (
          <span className="font-bold text-combo">연습 타석</span>
        ) : (
          <>
            <Dots label="S" filled={count.strikes} total={STRIKES_PER_OUT} tone="bg-combo" />
            <Dots label="O" filled={count.outs} total={OUTS_PER_GAME} tone="bg-wrong" />
          </>
        )}
        <span className="ml-auto text-frame/40">
          공 {ballIndex + 1} / {BALLS_PER_AT_BAT}
        </span>
      </div>

      {/*
        카운트다운 동안에는 문제를 감춘다. 여기서 보여 주면 첫 타석만
        읽는 시간을 2.1초 더 갖게 되어, 유형별로 정해 둔 읽기 시간(§15.6)이
        타석마다 달라진다. 자리는 비워 둬야 문제가 뜰 때 화면이 밀리지 않는다.
      */}
      <div className="relative z-10 flex shrink-0 basis-[15%] items-center justify-center px-4">
        {pitchPhase !== 'COUNTDOWN' && (
          <AutoFitText
            sizes={isSentence ? SENTENCE_SIZES : PROMPT_SIZES}
            className="font-bold"
          >
            {atBat.prompt}
          </AutoFitText>
        )}
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

        {/* 판정 결과 + 획득 점수 (§14.7) */}
        {pitchPhase === 'RESULT' && lastOutcome && (
          <PitchFeedback
            key={`${atBatIndex}-${ballIndex}`}
            outcome={lastOutcome}
            // 연습 타석은 집계하지 않으므로 점수도 띄우지 않는다 (§13.3)
            delta={lastAnswer ? lastAnswer.delta : null}
            comboMultiplier={
              lastAnswer && lastAnswer.tierAfter > lastAnswer.tierBefore
                ? multiplierOf(lastAnswer.tierAfter)
                : null
            }
            outed={lastOuted}
          />
        )}

        {/*
          판 시작 카운트다운 (§15.6).
          야구는 첫 공이 곧바로 날아와 준비할 틈이 없다. 판당 한 번만 넣는다.
          탭은 판정창 밖이라 자동으로 무시된다 (§15.5).
        */}
        {pitchPhase === 'COUNTDOWN' && (
          <div
            data-countdown={countdown}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-night/60"
          >
            <motion.span
              key={countdown}
              className="text-7xl font-extrabold tabular-nums text-combo"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.9)' }}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.18 }}
            >
              {countdown}
            </motion.span>
            <span className="text-xs tracking-widest text-frame/60">
              곧 첫 공이 들어옵니다
            </span>
          </div>
        )}

        {/* 튜토리얼 코칭 (§13.3) — 글로 설명하지 않고 그 상황에서 멈춘다 */}
        {coach && (
          <motion.div
            data-coach={coach}
            key={coach}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-night/70 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12 }}
          >
            <span
              className={`text-center text-xl font-extrabold ${
                coach === 'SWING' ? 'text-combo' : 'text-frame'
              }`}
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}
            >
              {COACH_LINE[coach]}
            </span>
            {coach === 'SWING' && (
              <span className="text-xs text-frame/60">화면을 탭하세요</span>
            )}
            {coach === 'INTRO' && (
              <span className="text-xs text-frame/60">
                연습 타석 — 점수에 반영되지 않습니다
              </span>
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
