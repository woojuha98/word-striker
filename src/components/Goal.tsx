import { useLayoutEffect, useRef, useState, type Ref } from 'react'
import { TARGET_BELOW_TEXT, type ShotResult } from '../game/shot'
import { AutoFitText } from './AutoFitText'
import { GoalFrame } from './GoalFrame'
import { Keeper } from './Keeper'
import { KEEPER_IDLE, type KeeperPose } from './keeperPose'
import { NetRipple } from './NetRipple'

interface Props {
  options: string[]
  answerIndex: number
  /** 플레이어가 고른 칸. 시간초과면 null */
  selectedIndex: number | null
  /** 누르고 있는 칸 */
  chargingIndex: number | null
  /** 판정이 끝나 정답/오답을 드러내는 단계인지 */
  revealed: boolean
  /** 입력을 받을 수 있는 단계인지 */
  interactive: boolean
  /** 이번 슛이 어떻게 끝났는지 (§7.2) */
  shotResult: ShotResult
  onPressStart: (index: number) => void
  onRelease: () => void
  goalRef: Ref<HTMLDivElement>
}

/**
 * 4분할 골대 (§4.2)
 *
 * 입력은 **누른 채 유지 → 뗌** 이다 (§7.2).
 * 포인터를 캡처하므로 칸 밖으로 끌고 나가 떼도 그대로 발사된다 (§7.3).
 * 취소를 허용하면 "잘못 눌렀을 때 무르기"가 가능해져 시간 압박이 무의미해진다.
 */
export function Goal({
  options,
  answerIndex,
  selectedIndex,
  chargingIndex,
  revealed,
  interactive,
  shotResult,
  onPressStart,
  onRelease,
  goalRef,
}: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  // 골키퍼가 "탭한 칸"으로 정확히 가려면 골대 실측 크기가 필요하다.
  // 고정 px로 두면 화면 크기에 따라 칸을 벗어나거나 못 미친다.
  useLayoutEffect(() => {
    const el = boxRef.current
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={goalRef} data-goal className="relative h-full w-full">
      <div ref={boxRef} className="absolute inset-0" />
      <GoalFrame />

      <div className="relative z-10 grid h-full w-full grid-cols-2 grid-rows-2">
        {options.map((text, index) => (
          <button
            key={text}
            type="button"
            disabled={revealed}
            onPointerDown={(event) => {
              if (!interactive) return
              // 칸 밖에서 떼도 pointerup이 이 요소로 온다
              event.currentTarget.setPointerCapture(event.pointerId)
              onPressStart(index)
            }}
            onPointerUp={onRelease}
            onPointerCancel={onRelease}
            className={`flex min-h-11 items-center justify-center px-2 transition-colors duration-150 ${cellTone(
              index,
              answerIndex,
              selectedIndex,
              chargingIndex,
              revealed,
            )}`}
          >
            <AutoFitText>{text}</AutoFitText>
          </button>
        ))}
      </div>

      {shotResult === 'GOAL' && selectedIndex !== null && (
        <NetRipple optionIndex={selectedIndex} />
      )}

      <Keeper pose={keeperPose(shotResult, selectedIndex, size)} />
    </div>
  )
}

/**
 * 골키퍼 자세 (§13.2)
 *
 * - 선방: 슛 방향으로 몸을 던진다 (기울어짐)
 * - 실점: 반대 방향으로 던져 비켜난다
 * - 캐치: **탭한 칸으로 이동**해 선 자세로 잡는다. 랜덤이 아니다 —
 *   "고른 곳을 골키퍼가 알고 있었다"가 되어야 왜 막혔는지가 분명해진다.
 */
function keeperPose(
  result: ShotResult,
  selectedIndex: number | null,
  size: { w: number; h: number },
): KeeperPose {
  if (result === 'NONE' || selectedIndex === null || size.w === 0) {
    return KEEPER_IDLE
  }

  const toLeft = selectedIndex % 2 === 0
  const toTop = selectedIndex < 2

  if (result === 'CAUGHT') {
    // 칸으로 이동하되 공과 같은 지점을 잡는다. 기울이지 않아 다이빙과 구분된다.
    // 칸 정중앙은 선택지 글자 자리라 그대로 서면 정답을 가린다.
    return {
      x: (toLeft ? -1 : 1) * (size.w / 4),
      y: (toTop ? -1 : 1) * (size.h / 4) + size.h * TARGET_BELOW_TEXT,
      rotate: 0,
    }
  }

  // 선방은 슛 방향으로, 실점은 반대 방향으로 몸을 던진다
  const direction = toLeft ? -1 : 1
  const dive = result === 'SAVED' ? direction : -direction
  return {
    x: dive * (size.w * 0.24),
    y: size.h * 0.1,
    rotate: dive * 60,
  }
}

function cellTone(
  index: number,
  answerIndex: number,
  selectedIndex: number | null,
  chargingIndex: number | null,
  revealed: boolean,
): string {
  if (!revealed) {
    // 누르고 있는 칸을 밝혀 어디를 겨냥 중인지 보이게 한다
    return index === chargingIndex ? 'bg-white/20' : 'bg-white/6'
  }
  if (index === answerIndex) return 'bg-correct text-night'
  if (index === selectedIndex) return 'bg-wrong text-night'
  return 'bg-white/6 opacity-50'
}
