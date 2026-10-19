import { describe, expect, test } from 'vitest'
import { angleDifferenceDegrees, validatePlacement } from '../src/components/ar/placementValidation'

const targetId = 'region-caribe' as const
const tolerances = { position: 0.1, orientationDegrees: 5 }
const reference = { targetId, position: { x: 1, y: 2, z: 3 }, rotationYDegrees: 0 }

describe('placement validation', () => {
  test('accepts pose inside position and orientation tolerances', () => {
    expect(validatePlacement({ targetId, trackingState: 'recognized', reference, tolerances, pose: { position: { x: 1.03, y: 2, z: 3 }, rotationYDegrees: 358 } })).toBe('correctly-placed')
  })

  test('rejects position or orientation outside tolerance', () => {
    expect(validatePlacement({ targetId, trackingState: 'recognized', reference, tolerances, pose: { position: { x: 1.2, y: 2, z: 3 }, rotationYDegrees: 0 } })).toBe('misplaced')
    expect(validatePlacement({ targetId, trackingState: 'recognized', reference, tolerances, pose: { position: { x: 1, y: 2, z: 3 }, rotationYDegrees: 10 } })).toBe('misplaced')
  })

  test('handles angle wraparound and unavailable geometry safely', () => {
    expect(angleDifferenceDegrees(359, 1)).toBe(2)
    expect(validatePlacement({ targetId, trackingState: 'recognized', tolerances, pose: { position: { x: 1, y: 2, z: 3 }, rotationYDegrees: 0 } })).toBe('unknown')
    expect(validatePlacement({ targetId, trackingState: 'recognized', reference, tolerances, pose: { position: { x: Number.NaN, y: 2, z: 3 }, rotationYDegrees: 0 } })).toBe('unknown')
  })

  test('does not turn provisional or missing tracking into a placement error', () => {
    expect(validatePlacement({ targetId, trackingState: 'provisional', reference, tolerances })).toBe('provisional')
    expect(validatePlacement({ targetId, trackingState: 'not-detected', reference, tolerances })).toBe('not-detected')
  })
})
