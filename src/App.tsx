import { useEffect } from 'react'
import { applyStoredMute, preloadSounds } from './game/sound'
import { BaseballResultScreen } from './screens/BaseballResultScreen'
import { BaseballScreen } from './screens/BaseballScreen'
import { GameScreen } from './screens/GameScreen'
import { ResultScreen } from './screens/ResultScreen'
import { TitleScreen } from './screens/TitleScreen'
import { useBaseballStore } from './store/baseballStore'
import { useGameStore } from './store/gameStore'

/**
 * 화면 흐름 (§4.4)
 *
 * 종목별 스토어가 각자 자기 판을 들고 있고, 진행 중인 쪽이 화면을 가져간다.
 * 둘 다 쉬고 있으면 시작 화면이다.
 */
function App() {
  const soccerPhase = useGameStore((s) => s.phase)
  const baseballPhase = useBaseballStore((s) => s.phase)

  useEffect(() => {
    // 지난 판에서 껐다면 켜지 않은 채로 시작한다 (§14.5)
    applyStoredMute()
    // 시작 화면에 있는 동안 미리 받아 둔다.
    // 첫 재생 시점에 받기 시작하면 첫 문제의 휘슬이 늦거나 아예 묻힌다.
    preloadSounds()
  }, [])

  if (baseballPhase === 'PLAYING') return <BaseballScreen />
  if (baseballPhase === 'RESULT') return <BaseballResultScreen />

  if (soccerPhase === 'RESULT') return <ResultScreen />
  if (soccerPhase !== 'TITLE') return <GameScreen />

  return <TitleScreen />
}

export default App
