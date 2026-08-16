import { useEffect } from 'react'
import { LEVEL_LABEL } from '../game/level'
import { playSound } from '../game/sound'
import { QUESTIONS_PER_ROUND } from '../game/question'
import { mistakesOf, useGameStore } from '../store/gameStore'

/**
 * 결과 화면 (§2 — 총점, 정답 개수, 최고 콤보)
 *
 * 주 정보는 정답 개수와 최고 콤보다. 총점은 그 아래에 둔다.
 * 초급 학습자는 패널티 누적으로 0점이 자주 나오는데(§5.1 하한),
 * 0을 화면 한가운데 크게 띄우면 "아무것도 못 했다"로 읽혀 재도전 동기가 꺾인다.
 * 실제로 한 일(맞힌 개수, 이어간 연속)은 0점일 때도 남는다.
 */
export function ResultScreen() {
  const score = useGameStore((s) => s.score)
  const level = useGameStore((s) => s.level)
  const bestScore = useGameStore((s) => s.bestScores[s.level])
  const isNewBest = useGameStore((s) => s.isNewBest)
  const startGame = useGameStore((s) => s.startGame)
  const toTitle = useGameStore((s) => s.toTitle)
  // history를 구독하고 파생은 렌더에서 한다 (mistakesOf 주석 참고)
  const mistakes = mistakesOf(useGameStore((s) => s.history))

  // 경기 종료 팡파레 (§14.3)
  useEffect(() => {
    playSound('result')
  }, [])

  const scored = score.score > 0

  return (
    <div className="safe-y mx-auto flex h-full max-w-[430px] flex-col items-center gap-7 overflow-y-auto px-6 py-10">
      <p className="text-sm tracking-widest text-frame/50">
        {LEVEL_LABEL[level]} 경기 종료
      </p>

      {/* 주 정보 */}
      <div className="grid w-full max-w-xs grid-cols-2 gap-3">
        <Headline
          label="정답"
          value={String(score.correctCount)}
          unit={`/ ${QUESTIONS_PER_ROUND}`}
        />
        <Headline
          label="최고 콤보"
          value={String(score.bestStreak)}
          unit="연속"
        />
      </div>

      {/* 총점 — 0일 때는 강조하지 않는다 */}
      <div className="flex items-baseline gap-3">
        <span className="text-sm text-frame/50">점수</span>
        <span
          className={`font-bold tabular-nums ${
            scored ? 'text-3xl text-combo' : 'text-2xl text-frame/40'
          }`}
        >
          {score.score.toLocaleString('ko-KR')}
        </span>
        {isNewBest && scored && (
          <span className="text-xs font-bold text-combo">🎉 최고 기록</span>
        )}
      </div>

      {!scored && (
        <p className="-mt-4 text-center text-xs leading-relaxed text-frame/45">
          패널티가 쌓여 점수는 0에서 멈췄어요.
          <br />
          {/* 정답이 하나도 없으면 "맞힌 0개"는 위로가 되지 않는다 */}
          {score.correctCount > 0
            ? `맞힌 ${score.correctCount}개는 그대로 남습니다.`
            : '한 문제만 맞혀도 점수가 올라갑니다.'}
        </p>
      )}

      <dl className="w-full max-w-xs space-y-3 text-sm">
        <Row
          label="오답 / 시간초과"
          value={`${score.wrongCount} / ${score.timeoutCount}`}
        />
        <Row
          label={`${LEVEL_LABEL[level]} 최고 점수`}
          value={bestScore.toLocaleString('ko-KR')}
        />
      </dl>

      {/* 오답 리뷰 (§13.4) — 학습 앱으로서의 실질적 가치가 여기서 나온다 */}
      {mistakes.length > 0 && (
        <section className="w-full max-w-xs">
          <h2 className="mb-3 text-sm font-bold text-frame/70">
            다시 볼 단어 {mistakes.length}개
          </h2>
          <ul className="space-y-2">
            {mistakes.map((m) => (
              <li
                key={m.wordId}
                className="rounded-xl bg-white/6 px-4 py-3 text-sm"
              >
                <p className="font-bold">{m.prompt}</p>
                <p className="mt-1 text-correct">{m.answer}</p>
                <p className="mt-0.5 text-xs text-frame/45">
                  {m.picked === null
                    ? '시간초과 — 고르지 못함'
                    : `내가 고른 뜻: ${m.picked}`}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={startGame}
          className="rounded-full bg-combo py-4 font-bold text-night active:scale-[0.98]"
        >
          다시하기
        </button>
        <button
          type="button"
          onClick={toTitle}
          className="rounded-full border border-frame/30 py-4 font-bold active:scale-[0.98]"
        >
          시작 화면
        </button>
      </div>
    </div>
  )
}

function Headline({
  label,
  value,
  unit,
}: {
  label: string
  value: string
  unit: string
}) {
  return (
    <div className="rounded-2xl bg-white/6 py-5 text-center">
      <p className="text-xs text-frame/50">{label}</p>
      <p className="mt-1">
        <span className="text-4xl font-bold tabular-nums">{value}</span>
        <span className="ml-1 text-sm text-frame/60">{unit}</span>
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-frame/10 pb-2">
      <dt className="text-frame/60">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}
