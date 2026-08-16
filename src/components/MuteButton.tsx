import { useState } from 'react'
import { isMuted, setMuted } from '../game/sound'

/**
 * 음소거 토글 (§14.5) ★필수
 *
 * HUD 우상단에 둔다. 학습 앱은 지하철·도서관 등 무음이어야 하는 환경에서
 * 쓰는 비중이 높아, 끌 수 없으면 그대로 이탈 요인이 된다.
 */
export function MuteButton() {
  const [muted, setLocalMuted] = useState(isMuted)

  return (
    <button
      type="button"
      aria-label={muted ? '소리 켜기' : '소리 끄기'}
      aria-pressed={muted}
      onClick={() => {
        const next = !muted
        setMuted(next)
        setLocalMuted(next)
      }}
      className="rounded-full px-1 text-base opacity-60 active:opacity-100"
    >
      {muted ? '🔇' : '🔊'}
    </button>
  )
}
