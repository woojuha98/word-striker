import { useEffect } from 'react'
import { applyStoredMute, preloadSounds } from './game/sound'
import { GameScreen } from './screens/GameScreen'
import { ResultScreen } from './screens/ResultScreen'
import { TitleScreen } from './screens/TitleScreen'
import { useGameStore } from './store/gameStore'

/** 화면 흐름 (§4.4): 시작 → 게임 ×10문제 → 결과 → 다시하기 / 시작 화면 */
function App() {
  const phase = useGameStore((s) => s.phase)

  useEffect(() => {
    // 지난 판에서 껐다면 켜지 않은 채로 시작한다 (§14.5)
    applyStoredMute()
    // 시작 화면에 있는 동안 미리 받아 둔다.
    // 첫 재생 시점에 받기 시작하면 첫 문제의 휘슬이 늦거나 아예 묻힌다.
    preloadSounds()
  }, [])

  if (phase === 'TITLE') return <TitleScreen />
  if (phase === 'RESULT') return <ResultScreen />
  return <GameScreen />
}

export default App
