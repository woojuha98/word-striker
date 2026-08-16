# 배포 절차 (Vercel)

이 문서는 **직접 실행하는 순서**다. 계정 생성과 저장소 생성은 본인이 한다.

---

## 1. GitHub 저장소 만들기

GitHub에서 새 저장소를 만든다. **README·.gitignore·라이선스는 추가하지 않는다** —
이미 로컬에 있어서 충돌한다.

만든 뒤 로컬에서:

```bash
git remote add origin https://github.com/<계정>/<저장소>.git
git push -u origin main
```

## 2. 커밋 작성자 확인 ★먼저 볼 것

지금 커밋은 이 이름으로 남아 있다:

```
dnwngk98 <dnwngk98@gmail.com>
```

포트폴리오로 쓸 이름이 따로 있으면 **푸시 전에** 바꾼다.
푸시한 뒤에 바꾸려면 강제 푸시가 필요해서 번거롭다.

```bash
git config user.name "쓸 이름"
git config user.email "쓸 메일"

# 이미 만든 커밋의 작성자까지 전부 바꾼다
git rebase -r --root --exec "git commit --amend --no-edit --reset-author"
```

GitHub 잔디에 반영되려면 **메일 주소가 GitHub 계정에 등록된 것과 같아야 한다.**

## 3. Vercel에 연결

1. [vercel.com](https://vercel.com) 가입 (GitHub 계정으로 하면 3의 연결이 자동)
2. **Add New → Project → 저장소 Import**
3. 설정은 건드리지 않는다. `vercel.json`에 이미 들어 있다:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Deploy**

이후 `main`에 푸시할 때마다 자동 배포된다.

## 4. 배포 후 확인 — 실기기에서

데스크톱에서만 보면 놓치는 것들이다.

| 확인 | 왜 |
|---|---|
| **아이폰에서 소리** | iOS는 터치 없이 오디오를 막는다. "경기 시작"을 눌러야 열린다(§14.2). 데스크톱은 멀쩡한데 폰만 무음인 경우가 이것이다 |
| 주소창 접었다 펴기 | `100dvh`로 잡아 뒀지만 실기기에서 확인이 필요하다 |
| 노치 영역 | HUD와 버튼이 가리지 않는지 |
| 최고 점수 유지 | 새로고침 후에도 남는지 (`localStorage`) |
| 음소거 유지 | 껐다 새로고침해도 꺼져 있는지 |

## 5. 알아 둘 것

**HTTPS가 필수다.** Vercel이 자동으로 붙여 준다. `localStorage`와 오디오 모두
보안 컨텍스트에서만 정상 동작하므로, 다른 곳에 올릴 때도 http로 두면 안 된다.

**음원 원본(`BGM/`)은 저장소에 없다.** Pixabay License가 원본 파일의 재배포를
금지해서 `.gitignore`로 제외했다. 게임이 쓰는 가공본만 `public/sounds/`에 있다.
자세한 내용은 [ASSETS.md](ASSETS.md).

**환경 변수는 없다.** 서버도 API 키도 쓰지 않는다. v3.0에서 Supabase를 붙이면
그때 Vercel 프로젝트 설정에 추가한다.
