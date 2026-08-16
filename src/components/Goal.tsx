import type { PointerEvent, Ref } from 'react'
import { AutoFitText } from './AutoFitText'
import { GoalFrame } from './GoalFrame'
import { Keeper } from './Keeper'
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
  /** 골키퍼 다이빙 방향 (§13.2) */
  keeperDive: -1 | 1 | null
  /** 공이 네트에 꽂힌 칸. 선방이면 null (§14.7) */
  netImpactIndex: number | null
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
  keeperDive,
  netImpactIndex,
  onPressStart,
  onRelease,
  goalRef,
}: Props) {
  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    if (!interactive) return
    // 칸 밖에서 떼도 pointerup이 이 요소로 온다
    event.currentTarget.setPointerCapture(event.pointerId)
    onPressStart(index)
  }

  return (
    <div ref={goalRef} data-goal className="relative h-full w-full">
      <GoalFrame />

      <div className="relative z-10 grid h-full w-full grid-cols-2 grid-rows-2">
        {options.map((text, index) => (
          <button
            key={text}
            type="button"
            disabled={revealed}
            onPointerDown={(event) => handlePointerDown(event, index)}
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

      {netImpactIndex !== null && <NetRipple optionIndex={netImpactIndex} />}

      <Keeper dive={keeperDive} />
    </div>
  )
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
