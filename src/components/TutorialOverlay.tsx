import { motion } from 'framer-motion'

/**
 * 첫 플레이 튜토리얼 (§13.3) ★필수
 *
 * "누른 채 유지했다가 뗀다"는 조작은 직관적으로 알 수 없다.
 * 설명 없이 배포하면 첫 판에서 조작을 이해하지 못해 이탈한다.
 *
 * 화면을 덮되 **입력은 통과시킨다.** 골대를 누르는 순간이 곧 학습이므로
 * "확인" 버튼을 한 번 더 누르게 만들지 않는다.
 */
export function TutorialOverlay() {
  return (
    // 설명은 화면 아래쪽에 둔다. 가운데에 두면 골대 칸과 골키퍼를 덮어
    // 정작 "어디를 누르라는 것인지"가 보이지 않는다.
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-end gap-4 bg-night/70 pb-6">
      {/* 손가락: 눌렀다가 떼는 동작을 반복 */}
      <motion.div
        className="text-5xl"
        animate={{ scale: [1, 0.82, 0.82, 1], y: [0, 6, 6, 0] }}
        transition={{
          duration: 1.6,
          times: [0, 0.25, 0.7, 1],
          repeat: Infinity,
          repeatDelay: 0.3,
        }}
      >
        👆
      </motion.div>

      <div className="mx-6 rounded-2xl bg-night/90 px-6 py-4 ring-1 ring-frame/15">
        {/* 두 줄을 넘기지 않는다 (§13.3) */}
        <p className="text-center text-base leading-relaxed font-bold">
          골대 칸을 <span className="text-combo">누른 채 유지</span>했다가
          <br />
          원하는 순간에 손을 떼세요.
        </p>
        <p className="mt-2 text-center text-xs text-frame/50">
          첫 문제는 시간 제한이 없습니다
        </p>
      </div>
    </div>
  )
}
