import { motion, useAnimationControls } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { AutoFitText } from '../components/AutoFitText'
import { Ball } from '../components/Ball'
import { FloatingScore } from '../components/FloatingScore'
import { Goal } from '../components/Goal'
import { Hud } from '../components/Hud'
import { Kicker } from '../components/Kicker'
import { Pitch } from '../components/Pitch'
import { PowerGauge } from '../components/PowerGauge'
import { TimerBar } from '../components/TimerBar'
import { TutorialOverlay } from '../components/TutorialOverlay'
import { PROMPT_SIZES, SENTENCE_SIZES } from '../components/textSizes'
import { AUTO_FIRE_MS } from '../game/gauge'
import type { ComboTier } from '../game/score'
import { playComboUp, playCorrectSound, playSound } from '../game/sound'
import {
  BALL_DELAY_MS,
  BALL_FLIGHT_MS,
  COMBO_FLASH_MS,
  COMBO_LIGHT_OPACITY,
  LIGHT_FALL_MS,
  LIGHT_RISE_MS,
  REBOUND_MS,
  RESOLVE_MS,
  SHAKE_MS,
  SHAKE_PX,
  TIMER_WARNING_MS,
} from '../game/timing'
import {
  selectCurrentQuestion,
  selectIsTutorialQuestion,
  useGameStore,
} from '../store/gameStore'

/**
 * 게임 화면 (§4.1)
 *
 * 세로 비율: HUD 10% / 타이머 5% / 문제 15% / 골대 45% / 공·키커 20%
 * 입력은 누른 채 유지 → 뗌 (§7.2). 누르는 동안 문제 타이머는 멈춘다.
 */
export function GameScreen() {
  const phase = useGameStore((s) => s.phase)
  const question = useGameStore(selectCurrentQuestion)
  const index = useGameStore((s) => s.index)
  const total = useGameStore((s) => s.questions.length)
  const score = useGameStore((s) => s.score)
  const last = useGameStore((s) => s.last)
  const askStartedAt = useGameStore((s) => s.askStartedAt)
  const chargingIndex = useGameStore((s) => s.chargingIndex)
  const chargeStartedAt = useGameStore((s) => s.chargeStartedAt)
  const tutorialActive = useGameStore((s) => s.tutorialActive)
  const isTutorialQuestion = useGameStore(selectIsTutorialQuestion)
  const pressCell = useGameStore((s) => s.pressCell)
  const release = useGameStore((s) => s.release)
  const timeUp = useGameStore((s) => s.timeUp)
  const next = useGameStore((s) => s.next)

  const goalRef = useRef<HTMLDivElement>(null)
  const ballRef = useRef<HTMLDivElement>(null)
  const [flight, setFlight] = useState<{ x: number; y: number } | null>(null)

  const charging = phase === 'CHARGING'
  const resolved = phase === 'RESOLVED'

  // 골이 들어갔는가 = 게이지 초록 (§7.2 결과 매트릭스).
  // 정답 여부와 무관하다 — 오답이어도 초록이면 골은 들어간다.
  const scored = resolved && last?.zone === 'GREEN'
  const netImpactIndex = scored ? (last?.selectedIndex ?? null) : null

  // 골 성공 시 화면 흔들림 3px, 0.15초 (§14.7)
  const shake = useAnimationControls()
  useEffect(() => {
    if (!scored) return
    shake.start({
      x: [0, -SHAKE_PX, SHAKE_PX, -SHAKE_PX, 0],
      transition: { duration: SHAKE_MS / 1000 },
    })
  }, [scored, index, shake])

  // 제한 시간이 지나면 시간초과 (§7.3).
  // 튜토리얼 첫 문제에는 제한이 없고(§13.3), 누르는 동안에는 멈춘다(§7.2).
  useEffect(() => {
    if (phase !== 'ASKING' || !question || isTutorialQuestion) return
    const remaining = askStartedAt + question.timeLimitMs - Date.now()
    const id = setTimeout(timeUp, Math.max(0, remaining))
    return () => clearTimeout(id)
  }, [phase, question, askStartedAt, isTutorialQuestion, timeUp])

  // 누른 채 3초 이상 유지하면 자동 발사 (§7.3)
  useEffect(() => {
    if (!charging) return
    const id = setTimeout(release, AUTO_FIRE_MS)
    return () => clearTimeout(id)
  }, [charging, chargeStartedAt, release])

  // 슛 연출이 끝나면 다음 문제로 (§14.8 — 1초를 넘기지 않는다)
  useEffect(() => {
    if (!resolved) return
    const id = setTimeout(next, RESOLVE_MS)
    return () => clearTimeout(id)
  }, [resolved, index, next])

  // 손을 뗀 순간 공이 날아갈 목표를 계산한다
  useEffect(() => {
    if (!resolved || last?.selectedIndex == null) return
    setFlight(flightTo(last.selectedIndex, goalRef.current, ballRef.current))
  }, [resolved, last])

  // 새 문제가 시작되면 공을 제자리로
  useEffect(() => {
    setFlight(null)
  }, [index])

  // ── 사운드 (§14.3) ──────────────────────────────

  // 문제 등장 — 짧은 휘슬
  useEffect(() => {
    if (phase !== 'ASKING') return
    playSound('question')
  }, [phase, index])

  // 슛 → 공이 닿는 순간에 결과음. 킥과 결과가 겹치지 않게 궤적만큼 늦춘다.
  useEffect(() => {
    if (!resolved || !last) return

    if (last.outcome === 'TIMEOUT') {
      playSound('timeout')
      return
    }

    playSound('kick')
    const id = setTimeout(() => {
      if (last.outcome === 'CORRECT') {
        // 골이면 정답음, 선방이면 글러브 캐치음 (§14.3.1)
        playCorrectSound(last.tierAfter, last.zone === 'GREEN')
      } else {
        // 오답은 게이지와 무관하게 부저 (§14.3.1)
        playSound('wrong')
      }
      if (last.tierAfter > last.tierBefore) playComboUp(last.tierAfter)
      else if (last.tierAfter < last.tierBefore) playSound('comboDown')
    }, BALL_DELAY_MS + BALL_FLIGHT_MS)

    return () => clearTimeout(id)
  }, [resolved, last])

  // 남은 시간 1초 이하 — 심박 틱
  useEffect(() => {
    if (phase !== 'ASKING' || !question || isTutorialQuestion) return

    const startIn =
      askStartedAt + question.timeLimitMs - TIMER_WARNING_MS - Date.now()
    let beat: ReturnType<typeof setInterval> | undefined
    const start = setTimeout(() => {
      playSound('tick')
      beat = setInterval(() => playSound('tick'), 300)
    }, Math.max(0, startIn))

    return () => {
      clearTimeout(start)
      if (beat) clearInterval(beat)
    }
  }, [phase, question, askStartedAt, isTutorialQuestion])

  if (!question) return null

  const comboRose = resolved && last !== null && last.tierAfter > last.tierBefore
  const saved = resolved && last?.zone === 'RED'

  return (
    <motion.div
      animate={shake}
      className="relative mx-auto flex h-full max-w-[430px] flex-col overflow-hidden"
    >
      <ComboLight tier={score.combo.tier} />

      {/* 콤보 상승 플래시 (§12.4) */}
      {comboRose && (
        <motion.div
          key={index}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-30 bg-combo"
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: COMBO_FLASH_MS / 1000 }}
        />
      )}

      <header className="safe-top relative z-10 shrink-0 basis-[10%] px-4">
        <Hud
          score={score.score}
          tier={score.combo.tier}
          current={index + 1}
          total={total}
        />
      </header>

      <div className="relative z-10 shrink-0 basis-[5%] px-4">
        {isTutorialQuestion ? (
          <p className="flex h-full items-center text-xs text-frame/50">
            연습 문제 — 시간 제한 없음
          </p>
        ) : (
          <TimerBar
            startedAt={askStartedAt}
            durationMs={question.timeLimitMs}
            running={phase === 'ASKING'}
          />
        )}
      </div>

      <div className="relative z-10 flex shrink-0 basis-[15%] items-center justify-center px-4">
        <AutoFitText
          sizes={question.type === 'CLOZE' ? SENTENCE_SIZES : PROMPT_SIZES}
          className="font-bold"
        >
          {question.prompt}
        </AutoFitText>
      </div>

      {/* 골대 45% + 공·키커 20%.
          골대는 밤하늘을 배경으로 둔다. 잔디 위에 올리면 칸이 초록이 되어
          어두운 칸 + 흰 글자라는 가독성 전제(§12.1)가 깨지고,
          무엇보다 정답색 #22C55E가 잔디와 같은 계열이라 판정이 묻힌다. */}
      <div className="relative flex grow flex-col">
        <div className="relative flex-[45] px-2 pt-1">
          <Goal
            options={question.options}
            answerIndex={question.answerIndex}
            selectedIndex={last?.selectedIndex ?? null}
            chargingIndex={chargingIndex}
            revealed={resolved}
            interactive={phase === 'ASKING'}
            keeperDive={keeperDive(last)}
            netImpactIndex={netImpactIndex}
            onPressStart={pressCell}
            onRelease={release}
            goalRef={goalRef}
          />

          {/* 획득 점수 플로팅 (§14.7) */}
          {resolved && last && (
            <FloatingScore
              key={index}
              delta={last.delta}
              optionIndex={last.selectedIndex}
            />
          )}
        </div>

        <div className="relative z-20 flex flex-[20] flex-col items-center justify-center px-6">
          <Pitch />

          {/* 게이지는 띄워서 얹는다. 흐름에 넣으면 나타날 때 공과 키커가
              밀려나 조준 중에 화면이 흔들린다. */}
          {charging && (
            <div className="absolute inset-x-6 top-3 z-10">
              <PowerGauge startedAt={chargeStartedAt} />
            </div>
          )}

          <motion.div
            ref={ballRef}
            data-ball
            className="relative z-10 leading-none"
            animate={ballAnimation(flight, saved)}
            transition={{
              duration: (saved ? BALL_FLIGHT_MS + REBOUND_MS : BALL_FLIGHT_MS) / 1000,
              delay: flight ? BALL_DELAY_MS / 1000 : 0,
              ease: 'easeOut',
            }}
          >
            <Ball />
          </motion.div>
          <div data-kicker className="relative z-10 leading-none">
            <Kicker />
          </div>
        </div>
      </div>

      {tutorialActive && <TutorialOverlay />}
    </motion.div>
  )
}

/**
 * 골키퍼 다이빙 방향 (§13.2)
 * 초록 → 반대 방향으로 다이빙(실점), 빨강 → 슛 방향으로 다이빙(선방).
 */
function keeperDive(
  last: { selectedIndex: number | null; zone: 'GREEN' | 'RED' | null } | null,
): -1 | 1 | null {
  if (!last || last.selectedIndex === null || last.zone === null) return null
  const shotDirection = last.selectedIndex % 2 === 0 ? -1 : 1
  return last.zone === 'GREEN'
    ? ((-shotDirection) as -1 | 1)
    : (shotDirection as -1 | 1)
}

/** 선방이면 목표 지점에서 되튀어 나온다 (§13.2) */
function ballAnimation(flight: { x: number; y: number } | null, saved: boolean) {
  if (!flight) return { x: 0, y: 0, scale: 1 }
  if (!saved) return { x: flight.x, y: flight.y, scale: 0.5 }
  return {
    x: [flight.x, flight.x * 0.55],
    y: [flight.y, flight.y * 0.55],
    scale: [0.5, 0.7],
  }
}

/** 공이 날아갈 거리 — 고른 칸의 중심에서 공의 현재 중심을 뺀다 */
function flightTo(
  optionIndex: number,
  goal: HTMLElement | null,
  ball: HTMLElement | null,
): { x: number; y: number } | null {
  if (!goal || !ball) return null

  const goalRect = goal.getBoundingClientRect()
  const ballRect = ball.getBoundingClientRect()
  const col = optionIndex % 2
  const row = Math.floor(optionIndex / 2)

  // 칸 중앙이 아니라 살짝 아래를 겨냥한다.
  // 정중앙에 꽂히면 공이 선택지 글자를 덮어 판정 결과를 읽을 수 없다.
  const BELOW_TEXT = 0.08

  return {
    x:
      goalRect.left +
      goalRect.width * (col === 0 ? 0.25 : 0.75) -
      (ballRect.left + ballRect.width / 2),
    y:
      goalRect.top +
      goalRect.height * ((row === 0 ? 0.25 : 0.75) + BELOW_TEXT) -
      (ballRect.top + ballRect.height / 2),
  }
}

/**
 * 경기장 조명 = 콤보 표현 (§5.4).
 * 숫자 게이지 대신 밝기로 보여주고, 하락은 천천히 어두워지게 해서
 * "급락"처럼 보이지 않게 한다.
 */
function ComboLight({ tier }: { tier: ComboTier }) {
  const previous = useRef(tier)
  const rising = tier > previous.current

  useEffect(() => {
    previous.current = tier
  }, [tier])

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        background:
          'radial-gradient(120% 60% at 50% 0%, var(--color-combo), transparent 70%)',
      }}
      initial={false}
      animate={{ opacity: COMBO_LIGHT_OPACITY[tier] }}
      transition={{
        duration: (rising ? LIGHT_RISE_MS : LIGHT_FALL_MS) / 1000,
      }}
    />
  )
}
