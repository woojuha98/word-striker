# 사운드 에셋 출처·라이선스

§14.6에 따라 파일별 출처와 라이선스를 기록한다.
스토어 심사와 분쟁 대응 시 이 문서가 근거가 된다.

수익화를 전제로 하므로 **출처가 불명확한 파일은 넣지 않는다.**

---

## 파일 목록

| 파일 | 용도 (§14.3) | 출처 | 라이선스 |
|---|---|---|---|
| `goal.wav` | 정답 (골) | `net.mp3` + `cheer.mp3`를 **믹스해 자체 생성** | 파생물 — 원본은 Pixabay |
| `catch.wav` | 정답이지만 선방 (§14.3.1) | **자체 생성** (Web Audio 합성) | 자체 제작 |
| `wrong.mp3` | 오답 | Pixabay — `floraphonic / buzzer-4-183895` | Pixabay Content License |
| `combo-up.mp3` | 콤보 상승 | Pixabay — `tithuh / level-up-0-523643` | Pixabay Content License |
| `fanfare.mp3` | 결과 화면 | Pixabay — `peekaboolabcreative / victory sound` | Pixabay Content License |
| `whistle-start.wav` | 문제 등장 | **자체 생성** (Web Audio 합성) | 자체 제작 |
| `whistle-end.wav` | 시간초과 | **자체 생성** (Web Audio 합성) | 자체 제작 |
| `kick.wav` | 슛 임팩트 | **자체 생성** (Web Audio 합성) | 자체 제작 |
| `combo-down.wav` | 콤보 하락 | **자체 생성** (Web Audio 합성) | 자체 제작 |
| `tick.wav` | 타이머 1초 이하 | **자체 생성** (Web Audio 합성) | 자체 제작 |

## Pixabay Content License 요약

- 게임에 **삽입**하여 배포 — 가능 (무료·유료·광고 포함 모두)
- **편집·믹스**하여 사용 — 가능
- 원본 파일을 **그대로 다시 내려받을 수 있게 배포(standalone 재배포)** — **금지**

따라서 이 프로젝트에서는 효과음을 게임 재생에만 쓰고,
음원 자체를 내려받게 하는 기능은 만들지 않는다.

## 자체 생성 파일에 대해

`*.wav` 중 "자체 생성" 표기된 것은 외부 음원을 쓰지 않고
Web Audio로 파형을 직접 합성해 만들었다 (사인파·노이즈·엔벨로프).
저작권 제약이 없다.

`goal.wav`는 `net.mp3`와 `cheer.mp3`를 합쳐 만든 파생물이다.
§14.1이 "네트 흔들림 + 환호가 한 파일"을 요구하기 때문이며,
Pixabay License가 편집·믹스를 허용하는 범위 안에 있다.

## 원본 보관

`BGM/` 폴더에 내려받은 원본이 그대로 있다.
빌드에는 포함되지 않으며(`public/`만 번들에 들어간다), 교체·재작업용 보관본이다.

`goal.wav`의 재료였던 `net.mp3`·`cheer.mp3`는 믹스가 끝난 뒤
`public/sounds/`에서 뺐다. 게임이 재생하지 않는 파일을 배포에 실을 이유가 없고,
Pixabay License가 금지하는 **원본 그대로의 재배포**에 가까워지는 것도 피한다.
재작업이 필요하면 `BGM/`에서 다시 가져온다.
