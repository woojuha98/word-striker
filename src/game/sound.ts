/**
 * 사운드 (§14.1~14.5)
 *
 * **단발 효과음만 쓴다. 배경 루프 트랙은 쓰지 않는다** (§14.1).
 * 루프 트랙은 파일당 500KB~1MB로 초기 로딩을 눈에 띄게 지연시키는데,
 * 10문제를 빠르게 도는 게임에서 얻는 몰입 이득이 그만큼 크지 않다.
 */

import { Howl, Howler } from 'howler'
import type { ComboTier } from './score'
import { loadMuted, saveMuted } from './storage'

export type SoundName =
  /** 문제 등장 — 짧은 휘슬 */
  | 'question'
  /** 슛 — 킥 임팩트 */
  | 'kick'
  /** 정답이고 골까지 들어감 — 네트 흔들림 + 환호 (§14.1: 한 파일) */
  | 'goal'
  /** 정답이지만 선방당함 — 글러브 캐치음 (§14.3.1) */
  | 'catch'
  /** 오답 — 부저 */
  | 'wrong'
  /** 시간초과 — 종료 휘슬 */
  | 'timeout'
  | 'comboUp'
  | 'comboDown'
  /** 남은 시간 1초 이하 — 심박 틱 */
  | 'tick'
  /** 결과 화면 — 팡파레 */
  | 'result'

interface SoundSpec {
  src: string
  /** 원본이 길면 앞부분만 쓴다. §14.3의 길이에 맞춘다 */
  clipMs?: number
  volume?: number
}

const SPECS: Record<SoundName, SoundSpec> = {
  // 휘슬은 2.4kHz대라 귀가 가장 민감한 구간에 걸린다.
  // 같은 볼륨이어도 다른 소리보다 크게 들리고, 문제마다 울려서 금방 피로해진다.
  question: { src: '/sounds/whistle-start.wav', volume: 0.18 },
  kick: { src: '/sounds/kick.wav', volume: 0.7 },
  goal: { src: '/sounds/goal.wav', volume: 0.9 },
  catch: { src: '/sounds/catch.wav', volume: 0.8 },
  wrong: { src: '/sounds/wrong.mp3', clipMs: 800, volume: 0.6 },
  timeout: { src: '/sounds/whistle-end.wav', volume: 0.32 },
  comboUp: { src: '/sounds/combo-up.mp3', clipMs: 400, volume: 0.6 },
  comboDown: { src: '/sounds/combo-down.wav', volume: 0.5 },
  tick: { src: '/sounds/tick.wav', volume: 0.35 },
  result: { src: '/sounds/fanfare.mp3', clipMs: 2000, volume: 0.7 },
}

/**
 * §14.4 콤보 음정 상승 — 파일을 늘리지 않고 재생 속도만 올려 상승감을 만든다.
 * 단계별 배수와 나란히 간다: ×1.0 ×1.2 ×1.5 ×2.0
 */
const COMBO_RATE: Record<ComboTier, number> = {
  0: 1.0,
  1: 1.06,
  2: 1.12,
  3: 1.19,
}

const howls = new Map<SoundName, Howl>()

function howlFor(name: SoundName): Howl {
  const cached = howls.get(name)
  if (cached) return cached

  const spec = SPECS[name]
  const howl = new Howl({
    src: [spec.src],
    volume: spec.volume ?? 1,
    // 구간을 지정해 원본의 앞부분만 재생한다
    ...(spec.clipMs ? { sprite: { clip: [0, spec.clipMs] as [number, number] } } : {}),
  })
  howls.set(name, howl)
  return howl
}

/** 자주 쓰는 소리를 미리 받아 둔다 — 첫 정답에서 소리가 늦게 나지 않게 */
export function preloadSounds(): void {
  for (const name of Object.keys(SPECS) as SoundName[]) howlFor(name)
}

export function playSound(name: SoundName, options: { rate?: number } = {}): void {
  const howl = howlFor(name)
  const spec = SPECS[name]
  const id = howl.play(spec.clipMs ? 'clip' : undefined)
  if (options.rate) howl.rate(options.rate, id)
}

/**
 * 정답일 때의 소리 (§14.3.1)
 *
 * 골이 들어갔을 때만 정답음(네트+환호)을 낸다.
 * 선방당했으면 글러브 캐치음만 — 공이 네트에 닿지 않았는데
 * 네트 소리를 내면 화면과 어긋난다. 점수는 어느 쪽이든 같다 (§7.2).
 */
export function playCorrectSound(tier: ComboTier, entered: boolean): void {
  if (entered) {
    playSound('goal', { rate: COMBO_RATE[tier] })
  } else {
    playSound('catch')
  }
}

/**
 * 콤보 상승 차임 (§14.3.1 / §14.4)
 *
 * 선방당했어도 울린다 — 점수가 들어갔으니 상승 톤이 맞다.
 * 단계가 오를수록 음이 높아져, 정답음이 나지 않는 선방에서도
 * "올라갔다"는 신호가 소리로 남는다.
 */
export function playComboUp(tier: ComboTier): void {
  playSound('comboUp', { rate: COMBO_RATE[tier] })
}

/**
 * §14.2 iOS 오디오 언락 ★필수
 *
 * iOS 사파리는 사용자 터치 없이 오디오를 재생하지 않는다.
 * "경기 시작" 버튼을 누르는 그 순간에 컨텍스트를 열어 둔다.
 * 이 처리가 없으면 데스크톱에서는 정상인데 모바일에서 완전 무음이 된다.
 */
export function unlockAudio(): void {
  const ctx = Howler.ctx
  if (ctx && ctx.state === 'suspended') void ctx.resume()
  preloadSounds()
}

/** §14.5 음소거 — 지하철·도서관에서 쓰는 비중이 높아 없으면 이탈 요인이 된다 */
export function isMuted(): boolean {
  return loadMuted()
}

export function setMuted(muted: boolean): void {
  Howler.mute(muted)
  saveMuted(muted)
}

/** 앱 시작 시 저장된 음소거 상태를 반영한다 */
export function applyStoredMute(): void {
  Howler.mute(loadMuted())
}
