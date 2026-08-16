/**
 * 골키퍼 자세 (§13.2)
 *
 * 컴포넌트 파일에서 내보내면 fast refresh가 깨지므로 따로 둔다.
 * 값 계산은 골대 크기를 아는 Goal이 한다.
 */
export interface KeeperPose {
  x: number
  y: number
  rotate: number
}

export const KEEPER_IDLE: KeeperPose = { x: 0, y: 0, rotate: 0 }
