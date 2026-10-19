import { TARGETS, type TargetId } from '../../types/api'

export type TrackingStatus = 'not-detected' | 'provisional' | 'detected' | 'temporarily-lost' | 'lost'
export type RecognitionState = 'incomplete' | 'regions-complete' | 'map-recognized'
export type AssemblyStatus = 'unknown' | 'valid' | 'invalid'
export type GlobalValidationState = RecognitionState | 'assembly-unknown' | 'assembly-valid' | 'assembly-invalid'
export type UnlockPolicy = 'recognition' | 'verified-assembly'

export type GlobalValidationResult = {
  state: GlobalValidationState
  recognitionState: RecognitionState
  confirmedRegions: TargetId[]
  allRegionsConfirmed: boolean
  fullMapConfirmed: boolean
  mapRecognized: boolean
  assemblyStatus: AssemblyStatus
  canUnlockGame: boolean
}

const REGION_TARGET_IDS = TARGETS.filter((target) => target.type === 'region').map((target) => target.id)
const isConfirmed = (status: TrackingStatus | undefined) => status === 'detected' || status === 'temporarily-lost'

export function deriveGlobalValidation(
  tracking: Partial<Record<TargetId, TrackingStatus>>,
  options: { assemblyStatus?: AssemblyStatus; unlockPolicy?: UnlockPolicy } = {},
): GlobalValidationResult {
  const confirmedRegions = REGION_TARGET_IDS.filter((targetId) => isConfirmed(tracking[targetId]))
  const allRegionsConfirmed = confirmedRegions.length === REGION_TARGET_IDS.length
  const fullMapConfirmed = isConfirmed(tracking['colombia-completa'])
  const mapRecognized = allRegionsConfirmed && fullMapConfirmed
  const recognitionState: RecognitionState = !allRegionsConfirmed ? 'incomplete' : !fullMapConfirmed ? 'regions-complete' : 'map-recognized'
  const assemblyStatus = options.assemblyStatus ?? 'unknown'
  const state: GlobalValidationState = !allRegionsConfirmed
    ? 'incomplete'
    : !fullMapConfirmed
      ? 'regions-complete'
      : assemblyStatus === 'valid'
        ? 'assembly-valid'
        : assemblyStatus === 'invalid'
          ? 'assembly-invalid'
          : 'assembly-unknown'
  const canUnlockGame = options.unlockPolicy === 'verified-assembly' ? mapRecognized && assemblyStatus === 'valid' : mapRecognized

  return { state, recognitionState, confirmedRegions, allRegionsConfirmed, fullMapConfirmed, mapRecognized, assemblyStatus, canUnlockGame }
}

export const globalStatusLabel: Record<GlobalValidationState, string> = {
  incomplete: 'Map incomplete',
  'regions-complete': 'Five regions recognized',
  'map-recognized': 'Complete map recognized',
  'assembly-unknown': 'Assembly could not be verified',
  'assembly-valid': 'Assembly verified',
  'assembly-invalid': 'Assembly invalid',
}
