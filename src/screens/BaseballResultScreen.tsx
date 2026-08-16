import { useEffect } from 'react'
import { LEVEL_LABEL } from '../game/level'
import { REFERENCE_AT_BATS } from '../game/baseball'
import { playSound } from '../game/sound'
import { selectMedalScore, useBaseballStore } from '../store/baseballStore'

/**
 * 야구 결과 화면 (§15.7)
 *
 * 축구와 같은 자리에 놓인다 — 3아웃 종료가 10문제 종료와 같은 위치다.
 * 다만 타석 수가 가변이라 총점을 그대로 보여주면 오래 버틴 판이 무조건
 * 높아 보인다. 환산 점수를 주 정보로 두고 총점은 근거로 곁들인다.
 */
export function BaseballResultScreen() {
  const score = useBaseballStore((s) => s.score)
  const count = useBaseballStore((s) => s.count)
  const level = useBaseballStore((s) => s.level)
  const bestScore = useBaseballStore((s) => s.bestScore)
  const isNewBest = useBaseballStore((s) => s.isNewBest)
  const medal = useBaseballStore(selectMedalScore)
  const start = useBaseballStore((s) => s.start)
  const exit = useBaseballStore((s) => s.exit)

  useEffect(() => {
    playSound('result')
  }, [])

  const scored = medal > 0

  return (
    <div className="safe-y mx-auto flex h-full max-w-[430px] flex-col items-center justify-center gap-7 px-6">
      <p className="text-sm tracking-widest text-frame/50">
        {LEVEL_LABEL[level]} 경기 종료 · 3아웃
      </p>

      <div className="grid w-full max-w-xs grid-cols-2 gap-3">
        <Headline label="타석" value={String(count.atBats)} unit="타석" />
        <Headline
          label="최고 콤보"
          value={String(score.bestStreak)}
          unit="연속"
        />
      </div>

      <div className="text-center">
        <p className="text-xs text-frame/50">환산 점수 (1000점 만점)</p>
        <p
          className={`mt-1 text-5xl font-bold tabular-nums ${
            scored ? 'text-combo' : 'text-frame/40'
          }`}
        >
          {medal}
        </p>
        {isNewBest && scored && (
          <p className="mt-1 text-sm font-bold text-combo">🎉 최고 기록</p>
        )}
      </div>

      <dl className="w-full max-w-xs space-y-3 text-sm">
        <Row label="원점수" value={score.score.toLocaleString('ko-KR')} />
        <Row
          label={`타석당 평균 × ${REFERENCE_AT_BATS}`}
          value={String(
            count.atBats > 0
              ? Math.round((score.score / count.atBats) * REFERENCE_AT_BATS)
              : 0,
          )}
        />
        <Row label="안타" value={`${score.correctCount}개`} />
        <Row
          label="헛스윙 / 놓친 공"
          value={`${score.wrongCount} / ${score.timeoutCount}`}
        />
        <Row label={`${LEVEL_LABEL[level]} 최고 기록`} value={String(bestScore)} />
      </dl>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          onClick={() => start(level)}
          className="rounded-full bg-combo py-4 font-bold text-night active:scale-[0.98]"
        >
          다시하기
        </button>
        <button
          type="button"
          onClick={exit}
          className="rounded-full border border-frame/30 py-4 font-bold active:scale-[0.98]"
        >
          나가기
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
