import {
  LEVEL_DESCRIPTION,
  LEVEL_LABEL,
  LEVELS,
  TYPE_RATIO,
} from '../game/level'
import { activeTimeLimitRange, QUESTIONS_PER_ROUND } from '../game/question'
import { unlockAudio } from '../game/sound'
import { useBaseballStore } from '../store/baseballStore'
import { useGameStore } from '../store/gameStore'

/** 시작 화면 (§4.4) */
export function TitleScreen() {
  const startGame = useGameStore((s) => s.startGame)
  const setLevel = useGameStore((s) => s.setLevel)
  const level = useGameStore((s) => s.level)
  const bestScores = useGameStore((s) => s.bestScores)
  const sport = useGameStore((s) => s.sport)
  const setSport = useGameStore((s) => s.setSport)
  const startBaseball = useBaseballStore((s) => s.start)

  const { min, max } = activeTimeLimitRange(level)
  const timeText = min === max ? `${min}초` : `${min}~${max}초`
  const hasCloze = TYPE_RATIO[level].CLOZE > 0

  return (
    <div className="safe-y mx-auto flex h-full max-w-[430px] flex-col items-center justify-center gap-7 px-6">
      <div className="text-center">
        <p className="text-5xl">⚽</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">WORD STRIKER</h1>
        <p className="mt-1 text-sm text-frame/60">영어 단어 페널티킥</p>
      </div>

      {/* 종목 — 각 종목은 다른 인지 과제를 담당한다 (§9) */}
      <div className="w-full max-w-xs">
        <p className="mb-2 text-xs text-frame/50">종목</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: 'SOCCER_PK', label: '⚽ 축구 PK', hint: '뜻 고르기' },
              { id: 'BASEBALL', label: '⚾ 야구', hint: '칠지 말지' },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSport(option.id)}
              aria-pressed={option.id === sport}
              className={`rounded-xl py-3 text-sm font-bold transition-colors ${
                option.id === sport
                  ? 'bg-frame text-night'
                  : 'bg-white/6 text-frame/70 active:bg-white/15'
              }`}
            >
              {option.label}
              <span className="mt-0.5 block text-[10px] font-normal opacity-70">
                {option.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 등급 = 난이도가 아니라 별개의 대회 (§8.3) */}
      <div className="w-full max-w-xs">
        <p className="mb-2 text-xs text-frame/50">대회 등급</p>
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setLevel(option)}
              aria-pressed={option === level}
              className={`rounded-xl py-3 text-sm font-bold transition-colors ${
                option === level
                  ? 'bg-combo text-night'
                  : 'bg-white/6 text-frame/70 active:bg-white/15'
              }`}
            >
              {LEVEL_LABEL[option]}
            </button>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-frame/50">
          {LEVEL_DESCRIPTION[level]}
        </p>
      </div>

      <p className="text-center text-sm leading-relaxed text-frame/70">
        제시된 단어에 맞는 뜻을
        <br />
        골대 네 칸에서 고르세요.
        <br />
        <span className="text-frame/50">
          {QUESTIONS_PER_ROUND}문제 · 문제당 {timeText}
          {hasCloze && ' · 빈칸 문제 포함'}
        </span>
      </p>

      <button
        type="button"
        onClick={() => {
          // §14.2 — 이 터치가 iOS에서 오디오를 여는 유일한 기회다
          unlockAudio()
          if (sport === 'BASEBALL') startBaseball(level)
          else startGame()
        }}
        className="w-full max-w-xs rounded-full bg-combo py-4 text-lg font-bold text-night active:scale-[0.98]"
      >
        경기 시작
      </button>

      <p className="text-xs tabular-nums text-frame/50">
        {LEVEL_LABEL[level]} 최고 점수{' '}
        {bestScores[level].toLocaleString('ko-KR')}
      </p>
    </div>
  )
}
