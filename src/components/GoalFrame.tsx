import { useLayoutEffect, useRef, useState } from 'react'

/** 그물 한 칸 크기(px) */
const MESH = 15
/** 골대 프레임 두께(px) */
const POST = 6

/**
 * 골대 프레임 + 그물 (§12.1 — 아트는 전부 코드로 그린다)
 *
 * viewBox를 요소의 **실제 픽셀 크기**로 맞춘다.
 * `preserveAspectRatio="none"`으로 늘리면 그물 칸이 찌그러지고
 * 프레임 두께가 위아래로 달라진다.
 */
export function GoalFrame() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () =>
      setSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { w, h } = size
  const verticals = w > 0 ? Math.floor(w / MESH) : 0
  const horizontals = h > 0 ? Math.floor(h / MESH) : 0

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
    >
      {w > 0 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <defs>
            {/*
              그물은 아래로 갈수록 옅어진다 — 안쪽 깊이가 생긴다.
              userSpaceOnUse가 필수다. 기본값(objectBoundingBox)으로 두면
              수직·수평선은 바운딩 박스의 한 변이 0이라 그라디언트가
              해석되지 않아 선이 아예 그려지지 않는다.
            */}
            <linearGradient
              id="net-depth"
              gradientUnits="userSpaceOnUse"
              x1="0"
              y1="0"
              x2="0"
              y2={h}
            >
              <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.12" />
            </linearGradient>
            {/*
              기둥의 둥근 느낌. 이쪽은 rect라 바운딩 박스가 정상이므로
              기본 단위(objectBoundingBox)를 그대로 쓴다 — 기둥마다
              자기 폭에 맞춰 음영이 걸린다.
              세로 기둥은 좌→우, 크로스바는 위→아래로 밝기를 준다.
            */}
            <linearGradient id="post-v" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="40%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#B8C4D4" />
            </linearGradient>
            <linearGradient id="post-h" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#B8C4D4" />
            </linearGradient>
          </defs>

          {/* 그물 */}
          <g stroke="url(#net-depth)" strokeWidth="1">
            {Array.from({ length: verticals }, (_, i) => (
              <line
                key={`v${i}`}
                x1={(i + 1) * MESH}
                y1={0}
                x2={(i + 1) * MESH}
                y2={h}
              />
            ))}
            {Array.from({ length: horizontals }, (_, i) => (
              <line
                key={`h${i}`}
                x1={0}
                y1={(i + 1) * MESH}
                x2={w}
                y2={(i + 1) * MESH}
              />
            ))}
          </g>

          {/* 2×2 경계선 (§4.2) — 그물보다 진해야 분할이 읽힌다 */}
          <g stroke="#F8FAFC" strokeOpacity="0.45" strokeWidth="2">
            <line x1={w / 2} y1={0} x2={w / 2} y2={h} />
            <line x1={0} y1={h / 2} x2={w} y2={h / 2} />
          </g>

          {/* 골대 — 양쪽 기둥과 크로스바 */}
          <rect
            x={0}
            y={0}
            width={POST}
            height={h}
            rx={POST / 2}
            fill="url(#post-v)"
          />
          <rect
            x={w - POST}
            y={0}
            width={POST}
            height={h}
            rx={POST / 2}
            fill="url(#post-v)"
          />
          <rect
            x={0}
            y={0}
            width={w}
            height={POST}
            rx={POST / 2}
            fill="url(#post-h)"
          />
        </svg>
      )}
    </div>
  )
}
