import { useLayoutEffect, useRef } from 'react'
import { CELL_SIZES } from './textSizes'

interface Props {
  children: string
  /** 큰 것부터 작은 것 순서로 */
  sizes?: number[]
  className?: string
}

/**
 * 칸을 넘치면 글자를 한 단계씩 줄인다.
 * 한국어 뜻은 5~7자로 다듬지만(§10.4), 유료 어휘 팩에서 긴 뜻이 들어와도
 * 골대 칸이 깨지지 않도록 하는 안전장치다.
 *
 * 크기 결정은 한 번의 레이아웃 패스 안에서 끝낸다.
 * 상태를 두고 렌더를 반복하면 문제 전환마다 리렌더가 여러 번 발생한다.
 */
export function AutoFitText({
  children,
  sizes = CELL_SIZES,
  className = '',
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    const box = el?.parentElement
    if (!el || !box) return

    const fit = () => {
      for (const size of sizes) {
        el.style.fontSize = `${size}px`
        const fits =
          el.scrollHeight <= el.clientHeight + 1 &&
          el.scrollWidth <= el.clientWidth + 1
        if (fits) break
      }
    }

    fit()

    // 칸 크기가 바뀔 때만 다시 맞춘다.
    // (글자 크기 변화로 자기 자신이 다시 트리거되지 않도록 부모를 관찰한다)
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    return () => observer.disconnect()
  }, [children, sizes])

  return (
    <span
      ref={ref}
      className={`block max-h-full w-full overflow-hidden text-center leading-tight ${className}`}
    >
      {children}
    </span>
  )
}
