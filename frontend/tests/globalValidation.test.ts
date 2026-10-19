import { describe, expect, test } from 'vitest'
import { deriveGlobalValidation, type TrackingStatus } from '../src/components/ar/globalValidation'
import { TARGETS, type TargetId } from '../src/types/api'

const emptyTracking = (): Record<TargetId, TrackingStatus> => Object.fromEntries(TARGETS.map((target) => [target.id, 'not-detected'])) as Record<TargetId, TrackingStatus>
const withTargets = (...ids: TargetId[]) => {
  const tracking = emptyTracking()
  ids.forEach((id) => { tracking[id] = 'detected' })
  return tracking
}
const regionIds = TARGETS.filter((target) => target.type === 'region').map((target) => target.id) as TargetId[]

describe('global map validation', () => {
  test('distinguishes incomplete, regions-complete, and map-recognized states', () => {
    expect(deriveGlobalValidation(emptyTracking()).state).toBe('incomplete')
    expect(deriveGlobalValidation(withTargets(...regionIds)).state).toBe('regions-complete')
    const result = deriveGlobalValidation(withTargets(...regionIds, 'colombia-completa'))
    expect(result.recognitionState).toBe('map-recognized')
    expect(result.state).toBe('assembly-unknown')
    expect(result.mapRecognized).toBe(true)
  })

  test('requires all five regions and the complete map for the recognition unlock', () => {
    const onlyMap = deriveGlobalValidation(withTargets('colombia-completa'))
    expect(onlyMap.mapRecognized).toBe(false)
    expect(onlyMap.canUnlockGame).toBe(false)
    const allTargets = deriveGlobalValidation(withTargets(...regionIds, 'colombia-completa'))
    expect(allTargets.canUnlockGame).toBe(true)
    expect(deriveGlobalValidation(withTargets(...regionIds, 'colombia-completa'), { unlockPolicy: 'verified-assembly' }).canUnlockGame).toBe(false)
  })

  test('keeps a briefly lost confirmed target in global presence during grace', () => {
    const tracking = withTargets(...regionIds, 'colombia-completa')
    tracking['region-caribe'] = 'temporarily-lost'
    expect(deriveGlobalValidation(tracking).mapRecognized).toBe(true)
    tracking['region-caribe'] = 'lost'
    expect(deriveGlobalValidation(tracking).state).toBe('incomplete')
  })

  test('does not claim assembly validity without reliable evidence', () => {
    const tracking = withTargets(...regionIds, 'colombia-completa')
    expect(deriveGlobalValidation(tracking).assemblyStatus).toBe('unknown')
    expect(deriveGlobalValidation(tracking, { assemblyStatus: 'valid' }).state).toBe('assembly-valid')
    expect(deriveGlobalValidation(tracking, { assemblyStatus: 'invalid' }).state).toBe('assembly-invalid')
  })
})
