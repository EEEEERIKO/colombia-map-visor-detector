import type { TargetId } from '../../types/api'

export type PlacementStatus = 'not-detected' | 'provisional' | 'recognized' | 'correctly-placed' | 'misplaced' | 'unknown'
export type PlacementTrackingState = 'not-detected' | 'provisional' | 'recognized'
export type Pose = { position: { x: number; y: number; z: number }; rotationYDegrees: number }
export type PlacementReference = { targetId: TargetId; position: { x: number; y: number; z: number }; rotationYDegrees: number }
export type PlacementTolerances = { position: number; orientationDegrees: number }

const isFinitePose = (pose: Pose) => Object.values(pose.position).every(Number.isFinite) && Number.isFinite(pose.rotationYDegrees)

export const angleDifferenceDegrees = (actual: number, expected: number) => {
  const difference = Math.abs(((actual - expected) % 360 + 360) % 360)
  return Math.min(difference, 360 - difference)
}

export function validatePlacement({
  targetId,
  trackingState,
  pose,
  reference,
  tolerances,
}: {
  targetId: TargetId
  trackingState: PlacementTrackingState
  pose?: Pose
  reference?: PlacementReference
  tolerances: PlacementTolerances
}): PlacementStatus {
  if (trackingState === 'not-detected') return 'not-detected'
  if (trackingState === 'provisional') return 'provisional'
  if (!reference || reference.targetId !== targetId || !pose || !isFinitePose(pose)) return 'unknown'
  if (!Number.isFinite(tolerances.position) || !Number.isFinite(tolerances.orientationDegrees) || tolerances.position < 0 || tolerances.orientationDegrees < 0) return 'unknown'

  const distance = Math.hypot(
    pose.position.x - reference.position.x,
    pose.position.y - reference.position.y,
    pose.position.z - reference.position.z,
  )
  const angleDifference = angleDifferenceDegrees(pose.rotationYDegrees, reference.rotationYDegrees)
  return distance <= tolerances.position && angleDifference <= tolerances.orientationDegrees ? 'correctly-placed' : 'misplaced'
}
