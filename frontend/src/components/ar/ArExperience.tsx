import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import * as THREE from 'three'
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'
import { TARGETS, type TargetId } from '../../types/api'
import { deriveGlobalValidation, globalStatusLabel, type TrackingStatus } from './globalValidation'
import './ar.css'

const debugAr = (...details: unknown[]) => {
  if (import.meta.env.DEV) console.debug('[AR DEBUG]', ...details)
}

const LABEL_HIDE_GRACE_MS = 250
const TARGET_CONFIRMATION_MS = 180
const MINDAR_WARMUP_TOLERANCE = 3
const MINDAR_MISS_TOLERANCE = 36
// The default One Euro filter is very responsive, which makes the CSS overlay
// visibly vibrate on small regional targets. These values trade a little
// latency for a steadier silhouette while keeping the camera tracking usable.
const MINDAR_FILTER_MIN_CUTOFF = 0.0005
const MINDAR_FILTER_BETA = 0.5
const PARTICLE_COUNT = 48

const isIosDevice = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

const stabilizeCameraTrack = async (stream: MediaStream) => {
  const track = stream.getVideoTracks?.()[0]
  if (!track?.applyConstraints) return
  const capabilities = track.getCapabilities?.() as MediaTrackCapabilities & { focusMode?: string[]; zoom?: { min?: number; max?: number } }
  const advanced: Array<Record<string, unknown>> = []
  if (capabilities.focusMode?.includes('continuous')) advanced.push({ focusMode: 'continuous' })
  // Keeping the optical zoom at 1 avoids an avoidable lens jump on iPhone Pro
  // models when the printed target is brought close to the camera.
  if (capabilities.zoom && capabilities.zoom.min !== undefined && capabilities.zoom.max !== undefined && capabilities.zoom.min <= 1 && capabilities.zoom.max >= 1) advanced.push({ zoom: 1 })
  if (!advanced.length) return
  try { await track.applyConstraints({ advanced } as MediaTrackConstraints) } catch { /* Safari exposes capabilities inconsistently. */ }
}

const getParticleCount = () => window.matchMedia?.('(max-width: 768px)').matches ? 24 : PARTICLE_COUNT

type ParticleBurst = 'scan' | 'confirmed' | 'reacquired'

type ParticleAttribute = { needsUpdate: boolean }
type ParticleGeometry = { attributes: { position: ParticleAttribute; aAlpha: ParticleAttribute }; setAttribute(name: string, attribute: unknown): void; dispose(): void }
type ParticleMaterial = { dispose(): void }
type ParticlePoints = { visible: boolean; frustumCulled: boolean; renderOrder: number; parent?: unknown }

class AnchoredParticleSystem {
  readonly points: ParticlePoints
  private readonly geometry: ParticleGeometry
  private readonly positions: Float32Array
  private readonly velocities: Float32Array
  private readonly ages: Float32Array
  private readonly lifetimes: Float32Array
  private readonly phase: Float32Array
  private readonly alpha: Float32Array
  private readonly material: ParticleMaterial
  private active = false
  private hasLoggedUpdate = false
  private readonly targetId: TargetId

  constructor(targetId: TargetId, color: string, count = getParticleCount()) {
    this.targetId = targetId
    this.positions = new Float32Array(count * 3)
    this.velocities = new Float32Array(count * 3)
    this.ages = new Float32Array(count)
    this.lifetimes = new Float32Array(count)
    this.phase = new Float32Array(count)
    this.alpha = new Float32Array(count)
    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('aAlpha', new THREE.Float32BufferAttribute(this.alpha, 1))
    this.material = new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uColor: { value: new THREE.Color(color) }, uSize: { value: 180 } }, vertexShader: 'attribute float aAlpha; varying float vAlpha; uniform float uSize; void main(){ vAlpha=aAlpha; vec4 mvPosition=modelViewMatrix*vec4(position,1.0); gl_PointSize=uSize*(1.0/max(1.0,-mvPosition.z)); gl_Position=projectionMatrix*mvPosition; }', fragmentShader: 'uniform vec3 uColor; varying float vAlpha; void main(){ float d=length(gl_PointCoord-vec2(.5)); float glow=1.0-smoothstep(.03,.5,d); gl_FragColor=vec4(uColor, glow*vAlpha); }' })
    this.points = new THREE.Points(this.geometry, this.material)
    this.points.visible = false
    this.points.frustumCulled = false
    this.points.renderOrder = 10
    for (let index = 0; index < count; index += 1) this.reset(index, false)
  }

  private reset(index: number, burst: boolean) {
    const offset = index * 3
    this.positions[offset] = (Math.random() - .5) * .74
    this.positions[offset + 1] = (Math.random() - .5) * .82
    this.positions[offset + 2] = .035 + Math.random() * .08
    this.velocities[offset] = (Math.random() - .5) * (burst ? .42 : .22)
    this.velocities[offset + 1] = (burst ? .48 : .28) + Math.random() * (burst ? .7 : .35)
    this.velocities[offset + 2] = (Math.random() - .5) * .16
    this.ages[index] = burst ? Math.random() * -.65 : Math.random() * -.35
    this.lifetimes[index] = (burst ? 1.45 : 1.8) + Math.random() * .9
    this.phase[index] = Math.random() * Math.PI * 2
    this.alpha[index] = 0
  }

  trigger(kind: ParticleBurst) {
    const burst = kind !== 'scan'
    for (let index = 0; index < this.ages.length; index += 1) this.reset(index, burst)
    this.active = true
    this.hasLoggedUpdate = false
    this.points.visible = true
    debugAr('particles:trigger', { targetId: this.targetId, kind, count: this.ages.length, visible: this.points.visible, parent: Boolean((this.points as unknown as { parent?: unknown }).parent) })
  }

  update(delta: number, elapsed: number) {
    if (!this.active) return
    if (!this.hasLoggedUpdate) {
      debugAr('particles:first-update', { targetId: this.targetId, delta, position: Array.from(this.positions.slice(0, 3)), velocity: Array.from(this.velocities.slice(0, 3)), lifetime: this.lifetimes[0], pointVisible: this.points.visible })
      this.hasLoggedUpdate = true
    }
    let visible = false
    for (let index = 0; index < this.ages.length; index += 1) {
      const offset = index * 3
      this.ages[index] += delta
      if (this.ages[index] > this.lifetimes[index]) {
        this.reset(index, false)
        this.ages[index] = 0
      }
      const age = this.ages[index]
      const lifetime = this.lifetimes[index]
      const progress = Math.max(0, Math.min(1, age / lifetime))
      if (age < 0) { this.alpha[index] = 0; continue }
      visible = true
      this.velocities[offset + 1] -= 1.25 * delta
      this.velocities[offset] *= Math.max(0, 1 - .12 * delta)
      this.velocities[offset + 2] *= Math.max(0, 1 - .08 * delta)
      this.positions[offset] += this.velocities[offset] * delta + Math.sin(elapsed * 2.1 + this.phase[index]) * .003
      this.positions[offset + 1] += this.velocities[offset + 1] * delta
      this.positions[offset + 2] += this.velocities[offset + 2] * delta
      if (this.positions[offset + 1] < -.78) {
        this.positions[offset + 1] = -.78
        this.velocities[offset + 1] = Math.abs(this.velocities[offset + 1]) * .34
        this.velocities[offset] *= .82
      }
      const fadeIn = Math.min(1, progress * 8)
      const fadeOut = Math.min(1, (1 - progress) * 5)
      this.alpha[index] = fadeIn * fadeOut
    }
    this.points.visible = visible
    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.aAlpha.needsUpdate = true
  }

  hide() { this.active = false; this.points.visible = false }

  dispose() { this.geometry.dispose(); this.material.dispose() }
}

const TARGET_VISUALS: Record<TargetId, { src: string; width: number; height: number; scale: number; accent: string; filter: string }> = {
  'colombia-completa': { src: '/assets/ui/white-map.png', width: 737, height: 1000, scale: 1, accent: '#ffd166', filter: 'brightness(0) saturate(100%) invert(82%) sepia(91%) saturate(810%) hue-rotate(350deg) brightness(105%) contrast(103%)' },
  'region-caribe': { src: '/assets/ui/regions/caribe-white.png', width: 1095, height: 1000, scale: 1.06, accent: '#00d3a7', filter: 'brightness(0) saturate(100%) invert(64%) sepia(83%) saturate(1010%) hue-rotate(126deg) brightness(92%) contrast(103%)' },
  'region-andina': { src: '/assets/ui/regions/andes-white.png', width: 591, height: 1000, scale: 1.22, accent: '#ff9f43', filter: 'brightness(0) saturate(100%) invert(72%) sepia(83%) saturate(1137%) hue-rotate(335deg) brightness(104%) contrast(103%)' },
  'region-pacifica': { src: '/assets/ui/regions/pacifico-white.png', width: 349, height: 1000, scale: 1.28, accent: '#55c7ff', filter: 'brightness(0) saturate(100%) invert(76%) sepia(75%) saturate(1264%) hue-rotate(166deg) brightness(101%) contrast(103%)' },
  'region-orinoquia': { src: '/assets/ui/regions/orinoquia-white.png', width: 1376, height: 1000, scale: 1.04, accent: '#ff6b6b', filter: 'brightness(0) saturate(100%) invert(60%) sepia(80%) saturate(1300%) hue-rotate(315deg) brightness(104%) contrast(103%)' },
  'region-amazonia': { src: '/assets/ui/regions/amazonas-white.png', width: 1208, height: 1000, scale: 1.04, accent: '#a8e44e', filter: 'brightness(0) saturate(100%) invert(79%) sepia(83%) saturate(900%) hue-rotate(39deg) brightness(104%) contrast(103%)' },
}

type ArExperienceProps = {
  onValidationChange?: (result: ReturnType<typeof deriveGlobalValidation>) => void
  onTargetConfirmed?: (targetId: TargetId) => void
  onTargetFound?: (targetId: TargetId) => void
  onTargetLost?: (targetId: TargetId) => void
  activeTargetIds?: readonly TargetId[]
  anchorTargetIds?: readonly TargetId[]
  heading?: string
  description?: string
  autoStart?: boolean
  confirmationDurationMs?: number
  cameraOverlay?: ReactNode
  anchoredScan?: boolean
  anchoredScanImage?: string
  cameraStream?: MediaStream
  paused?: boolean
  disabled?: boolean
  showDetails?: boolean
}

export function ArExperience({ onValidationChange, onTargetConfirmed, onTargetFound, onTargetLost, activeTargetIds = TARGETS.map((target) => target.id), anchorTargetIds = activeTargetIds, heading = 'Image tracking', description = 'Point the camera at the complete map or one of the five regional pieces. Labels appear only after MindAR confirms a target.', autoStart = false, confirmationDurationMs = TARGET_CONFIRMATION_MS, cameraOverlay, anchoredScan = false, cameraStream, paused = false, disabled = false, showDetails = true }: ArExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mindarRef = useRef<MindARThree | null>(null)
  const hideTimersRef = useRef(new Map<string, number>())
  const highlightHideTimersRef = useRef(new Map<string, number>())
  const confirmationTimersRef = useRef(new Map<string, number>())
  const confirmedTargetsRef = useRef(new Set<string>())
  const discoveredTargetsRef = useRef(new Set<string>())
  const runIdRef = useRef(0)
  const startRef = useRef<() => Promise<void>>(() => Promise.resolve())
  const activeTargetIdsRef = useRef(new Set<TargetId>(activeTargetIds))
  const onTargetConfirmedRef = useRef(onTargetConfirmed)
  const labelsRef = useRef(new Map<TargetId, HTMLDivElement>())
  const scanElementsRef = useRef(new Map<TargetId, HTMLDivElement>())
  const highlightElementsRef = useRef(new Map<TargetId, HTMLDivElement>())
  const particleSystemsRef = useRef(new Map<TargetId, AnchoredParticleSystem>())
  const animationLoopRef = useRef<(() => void) | null>(null)
  const cameraStreamsRef = useRef(new Set<MediaStream>())
  const externalCameraStreamRef = useRef<MediaStream | null>(null)
  const elapsedRef = useRef(0)
  const [experienceState, setExperienceState] = useState<'idle' | 'starting' | 'active' | 'error' | 'stopped'>('idle')
  const [error, setError] = useState('')
  const [tracking, setTracking] = useState<Record<string, TrackingStatus>>(() => Object.fromEntries(TARGETS.map((target) => [target.id, 'not-detected'])))

  activeTargetIdsRef.current = new Set(activeTargetIds)
  onTargetConfirmedRef.current = onTargetConfirmed

  useEffect(() => {
    // Warm the local silhouette assets before MindAR can confirm a target. This
    // prevents the first celebration from waiting for an image request while a
    // reacquisition appears to work only because the browser cache is warm.
    Object.values(TARGET_VISUALS).forEach(({ src }) => {
      const image = new Image()
      image.src = src
      debugAr('asset:preload', { src, complete: image.complete })
    })
  }, [])

  useEffect(() => {
    const active = activeTargetIdsRef.current
    labelsRef.current.forEach((label) => { label.style.display = 'none' })
    scanElementsRef.current.forEach((scan, targetId) => {
      if (!active.has(targetId)) { scan.style.visibility = 'hidden'; scan.style.display = 'none' }
      else if (!scan.classList.contains('is-complete')) scan.style.display = 'block'
    })
    highlightElementsRef.current.forEach((highlight, targetId) => {
      if (!active.has(targetId)) { highlight.style.visibility = 'hidden'; highlight.style.display = 'none'; highlight.classList.remove('is-scanning', 'is-confirmed', 'is-persistent', 'is-reacquired') }
      else highlight.style.display = 'block'
    })
    setTracking((current) => Object.fromEntries(TARGETS.map((target) => [target.id, active.has(target.id) ? current[target.id] : 'not-detected'])))
  }, [activeTargetIds.join('|')])

  useEffect(() => {
    if (activeTargetIdsRef.current.size !== 1) return
    const controller = (mindarRef.current as (MindARThree & { controller?: { interestedTargetIndex: number } }) | null)?.controller
    if (controller) controller.interestedTargetIndex = TARGETS.findIndex((target) => activeTargetIdsRef.current.has(target.id))
  }, [activeTargetIds.join('|')])

  const clearHideTimers = () => {
    hideTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    hideTimersRef.current.clear()
    highlightHideTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    highlightHideTimersRef.current.clear()
  }

  const clearConfirmationTimers = () => {
    confirmationTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    confirmationTimersRef.current.clear()
  }

  const stopAttachedCameraTracks = () => {
    cameraStreamsRef.current.forEach((stream) => stream.getTracks().forEach((track) => track.stop()))
    cameraStreamsRef.current.clear()
    containerRef.current?.querySelectorAll('video').forEach((video) => {
      video.pause()
      const stream = video.srcObject as MediaStream | null
      if (stream && stream !== externalCameraStreamRef.current) stream.getTracks().forEach((track) => track.stop())
    })
  }

  const stop = () => {
    debugAr('session:stop', { hasMindAR: Boolean(mindarRef.current), particleSystems: particleSystemsRef.current.size })
    runIdRef.current += 1
    clearHideTimers()
    highlightHideTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    highlightHideTimersRef.current.clear()
    clearConfirmationTimers()
    confirmedTargetsRef.current.clear()
    discoveredTargetsRef.current.clear()
    scanElementsRef.current.clear()
    highlightElementsRef.current.clear()
    particleSystemsRef.current.forEach((particles) => particles.dispose())
    particleSystemsRef.current.clear()
    const instance = mindarRef.current
    stopAttachedCameraTracks()
    if (instance) {
      instance.renderer.setAnimationLoop(null)
      animationLoopRef.current = null
      try { instance.stop() } catch { /* MindAR may not have started its video yet. */ }
      instance.renderer.dispose()
      mindarRef.current = null
    }
    containerRef.current?.querySelectorAll('video').forEach((video) => { video.srcObject = null })
    externalCameraStreamRef.current = null
    if (containerRef.current) containerRef.current.replaceChildren()
    setExperienceState('stopped')
    setTracking(Object.fromEntries(TARGETS.map((target) => [target.id, 'not-detected'])))
  }

  useEffect(() => () => {
    runIdRef.current += 1
    clearHideTimers()
    clearConfirmationTimers()
    confirmedTargetsRef.current.clear()
    discoveredTargetsRef.current.clear()
    scanElementsRef.current.clear()
    highlightElementsRef.current.clear()
    particleSystemsRef.current.forEach((particles) => particles.dispose())
    particleSystemsRef.current.clear()
    const instance = mindarRef.current
    stopAttachedCameraTracks()
    if (instance) {
      instance.renderer.setAnimationLoop(null)
      animationLoopRef.current = null
      try { instance.stop() } catch { /* MindAR may not have started its video yet. */ }
      instance.renderer.dispose()
      mindarRef.current = null
    }
  }, [])

  const setTargetStatus = (index: number, status: TrackingStatus) => setTracking((current) => ({ ...current, [TARGETS[index].id]: status }))

  const start = async () => {
    if (!containerRef.current) return
    debugAr('session:start-request', { activeTargets: [...activeTargetIdsRef.current], anchorTargets: [...new Set(anchorTargetIds)] })
    stop(); setError(''); setExperienceState('starting')
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access requires HTTPS or localhost.')
      }
      const anchorTargetSet = new Set(anchorTargetIds)
      const targetsToTrack = TARGETS.filter((target) => anchorTargetSet.has(target.id))
      const instance = new MindARThree({ container: containerRef.current, imageTargetSrc: '/assets/tracking/colombia-targets.mind', maxTrack: Math.max(1, activeTargetIdsRef.current.size), warmupTolerance: MINDAR_WARMUP_TOLERANCE, missTolerance: MINDAR_MISS_TOLERANCE, filterMinCF: MINDAR_FILTER_MIN_CUTOFF, filterBeta: MINDAR_FILTER_BETA, uiLoading: 'no', uiScanning: 'no', uiError: 'no' })
      mindarRef.current = instance
      const mobile = window.matchMedia?.('(max-width: 768px)').matches ?? false
      const rendererWithPixelRatio = instance.renderer as unknown as { setPixelRatio?: (ratio: number) => void }
      rendererWithPixelRatio.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, isIosDevice() ? 1 : mobile ? 1.5 : 2))
      debugAr('mindar:created', { maxTrack: Math.max(1, activeTargetIdsRef.current.size), targetsToTrack: targetsToTrack.map((target) => target.id), hasRenderer: Boolean(instance.renderer), hasCssRenderer: Boolean(instance.cssRenderer) })
      const runId = runIdRef.current
      targetsToTrack.forEach((target) => {
        const index = TARGETS.findIndex((candidate) => candidate.id === target.id)
        const anchor = instance.addCSSAnchor(index)
        debugAr('anchor:css-created', { targetId: target.id, index, hasGroup: Boolean(anchor.group) })
        const label = document.createElement('div')
        label.className = 'ar-target-label'
        label.textContent = target.label
        label.dataset.targetId = target.id
        label.style.visibility = 'hidden'
        label.setAttribute('aria-hidden', 'true')
        labelsRef.current.set(target.id, label)
        label.style.display = 'none'
        containerRef.current?.appendChild(label)
        const highlight = document.createElement('div')
        const visual = TARGET_VISUALS[target.id]
        highlight.className = 'ar-target-highlight'
        highlight.dataset.targetId = target.id
        highlight.style.setProperty('--target-accent', visual.accent)
        highlight.style.setProperty('--target-filter', visual.filter)
        highlight.style.width = `${visual.width}px`
        highlight.style.height = `${visual.height}px`
        highlight.style.display = 'block'
        highlight.setAttribute('aria-hidden', 'true')
        highlight.style.visibility = 'visible'
        highlight.style.opacity = '0'
        highlight.innerHTML = `<span class="ar-target-highlight-halo"></span><img class="ar-target-highlight-image" src="${visual.src}" alt=""><i class="ar-target-highlight-sweep"></i><i class="ar-target-highlight-pulse"></i>`
        const highlightObject = new CSS3DObject(highlight)
        highlightObject.scale.set(visual.scale, visual.scale, visual.scale)
        anchor.group.add(highlightObject)
        highlightElementsRef.current.set(target.id, highlight)
        const particleAnchor = instance.addAnchor?.(index)
        if (particleAnchor) {
          try {
            const particles = new AnchoredParticleSystem(target.id, visual.accent)
            particleAnchor.group.add(particles.points)
            particleSystemsRef.current.set(target.id, particles)
            debugAr('anchor:three-created', { targetId: target.id, index, particleSystems: particleSystemsRef.current.size, pointsAttached: Boolean((particles.points as unknown as { parent?: unknown }).parent) })
          } catch (cause) {
            debugAr('anchor:three-error', { targetId: target.id, index, error: cause instanceof Error ? cause.message : String(cause) })
          }
        } else debugAr('anchor:three-missing', { targetId: target.id, index })
        if (anchoredScan) {
          const scan = document.createElement('div')
          // Each target owns its own silhouette. The optional prop is kept for
          // backwards compatibility, but must not make a regional target use
          // the complete-map artwork.
          const scanSource = visual.src
          scan.className = 'ar-anchored-scan'
          scan.setAttribute('aria-hidden', 'true')
          scan.style.visibility = 'hidden'
          scan.style.opacity = '0'
          scan.style.width = `${visual.width}px`
          scan.style.height = `${visual.height}px`
          scan.style.setProperty('--scan-filter', `${visual.filter} drop-shadow(0 0 16px ${visual.accent}) drop-shadow(0 0 34px ${visual.accent})`)
          scan.innerHTML = `<img class="ar-anchored-scan-base" src="${scanSource}" alt=""><img class="ar-anchored-scan-fill" src="${scanSource}" alt="">`
          debugAr('scan:created', { targetId: target.id, source: scanSource, accent: visual.accent, width: visual.width, height: visual.height })
          const scanObject = new CSS3DObject(scan)
          scanObject.scale.set(visual.scale, visual.scale, visual.scale)
          anchor.group.add(scanObject)
          scanElementsRef.current.set(target.id, scan)
        }
        label.style.display = 'none'
        anchor.onTargetFound = () => {
          if (runId !== runIdRef.current || mindarRef.current !== instance) return
          if (!activeTargetIdsRef.current.has(target.id)) return
          const scan = scanElementsRef.current.get(target.id)
          const highlight = highlightElementsRef.current.get(target.id)
          const particles = particleSystemsRef.current.get(target.id)
          const highlightTimer = highlightHideTimersRef.current.get(target.id)
          if (highlightTimer) { window.clearTimeout(highlightTimer); highlightHideTimersRef.current.delete(target.id) }
          const alreadyDiscovered = discoveredTargetsRef.current.has(target.id)
          debugAr('target:found', { targetId: target.id, alreadyDiscovered, confirmed: confirmedTargetsRef.current.has(target.id), hasScan: Boolean(scan), hasHighlight: Boolean(highlight), hasParticles: Boolean(particles) })
          if (alreadyDiscovered) {
            if (scan) { scan.style.visibility = 'visible'; scan.style.display = 'block'; scan.style.opacity = '1'; scan.classList.add('is-complete'); const fill = scan.querySelector('.ar-anchored-scan-fill') as HTMLElement | null; if (fill) { fill.style.animation = 'none'; fill.style.clipPath = 'inset(0 0 0 0)' } }
            particles?.trigger('reacquired')
            confirmedTargetsRef.current.add(target.id)
            debugAr('effect:reacquired-single-layer', { targetId: target.id, scanVisibility: scan?.style.visibility, scanComplete: scan?.classList.contains('is-complete') })
            setTargetStatus(index, 'detected')
            onTargetConfirmedRef.current?.(target.id)
            return
          }
          if (scan) {
            const fill = scan.querySelector('.ar-anchored-scan-fill') as HTMLElement | null
            scan.style.visibility = 'visible'
            scan.style.display = 'block'
            scan.style.opacity = '1'
            if (fill) { fill.style.animation = 'none'; void fill.offsetWidth; fill.style.animation = '' }
          }
          if (highlight) { highlight.classList.add('is-scanning'); highlight.style.visibility = 'visible'; highlight.style.opacity = '0' }
          particles?.trigger('scan')
          onTargetFound?.(target.id)
          if (confirmedTargetsRef.current.has(target.id) || confirmationTimersRef.current.has(target.id)) return
          const timer = hideTimersRef.current.get(target.id)
          if (timer) { window.clearTimeout(timer); hideTimersRef.current.delete(target.id) }
          label.style.visibility = 'hidden'
          label.setAttribute('aria-hidden', 'true')
          setTargetStatus(index, 'provisional')
          const confirmationTimer = window.setTimeout(() => {
            if (runId !== runIdRef.current || mindarRef.current !== instance) return
            confirmationTimersRef.current.delete(target.id)
            confirmedTargetsRef.current.add(target.id)
            const firstDiscovery = !discoveredTargetsRef.current.has(target.id)
            discoveredTargetsRef.current.add(target.id)
            if (scan) { scan.classList.add('is-complete'); const fill = scan.querySelector('.ar-anchored-scan-fill') as HTMLElement | null; if (fill) { fill.style.animation = 'none'; fill.style.clipPath = 'inset(0 0 0 0)' } }
            label.style.visibility = 'visible'
            label.setAttribute('aria-hidden', 'false')
            if (highlight) { highlight.classList.add('is-confirmed', 'is-persistent'); highlight.style.visibility = 'visible'; highlight.style.opacity = '0' }
            particles?.trigger(firstDiscovery ? 'confirmed' : 'reacquired')
            debugAr('confirmation:complete-single-layer', { targetId: target.id, firstDiscovery, scanVisibility: scan?.style.visibility, scanComplete: scan?.classList.contains('is-complete'), particleVisible: particles?.points.visible })
            setTargetStatus(index, 'detected')
            // The effect is active before the modal is notified. The modal does
            // not own the AR scene and must not be used to start the effect.
            onTargetConfirmedRef.current?.(target.id)
          }, confirmationDurationMs)
          confirmationTimersRef.current.set(target.id, confirmationTimer)
        }
        anchor.onTargetLost = () => {
          if (runId !== runIdRef.current || mindarRef.current !== instance) return
          if (!activeTargetIdsRef.current.has(target.id)) return
          const scan = scanElementsRef.current.get(target.id)
          const highlight = highlightElementsRef.current.get(target.id)
          const particles = particleSystemsRef.current.get(target.id)
          const highlightTimer = highlightHideTimersRef.current.get(target.id)
          if (highlightTimer) { window.clearTimeout(highlightTimer); highlightHideTimersRef.current.delete(target.id) }
          debugAr('target:lost', { targetId: target.id, discovered: discoveredTargetsRef.current.has(target.id), confirmed: confirmedTargetsRef.current.has(target.id), highlightVisibility: highlight?.style.visibility, scanVisibility: scan?.style.visibility })
          if (discoveredTargetsRef.current.has(target.id) && confirmedTargetsRef.current.has(target.id)) {
            // MindAR hides its anchor group on a brief miss. Keep the last
            // confirmed pose visible so the celebration does not blink out
            // between the scan and the discovery modal.
            const cssGroup = anchor.group as unknown as { visible: boolean }
            const threeGroup = particleAnchor?.group as unknown as { visible: boolean } | undefined
            cssGroup.visible = true
            if (threeGroup) threeGroup.visible = true
            if (particles) particles.points.visible = true
            debugAr('target:lost-preserved-confirmed-effect', { targetId: target.id, cssGroupVisible: cssGroup.visible, threeGroupVisible: threeGroup?.visible })
          }
          if (scan && discoveredTargetsRef.current.has(target.id)) { scan.style.visibility = 'visible'; scan.style.display = 'block'; scan.style.opacity = '1'; scan.classList.add('is-complete') }
          else if (scan) { scan.style.visibility = 'hidden'; scan.style.display = 'none'; scan.style.opacity = '0' }
          onTargetLost?.(target.id)
          const confirmationTimer = confirmationTimersRef.current.get(target.id)
          if (confirmationTimer) { window.clearTimeout(confirmationTimer); confirmationTimersRef.current.delete(target.id) }
          setTargetStatus(index, 'temporarily-lost')
          const timer = window.setTimeout(() => {
            if (runId === runIdRef.current && mindarRef.current === instance) {
              label.style.visibility = 'hidden'
              label.setAttribute('aria-hidden', 'true')
              if (scan && !discoveredTargetsRef.current.has(target.id)) { scan.classList.remove('is-complete'); scan.style.visibility = 'hidden'; scan.style.display = 'none' }
              if (!discoveredTargetsRef.current.has(target.id)) particles?.hide()
              setTargetStatus(index, 'lost')
            }
            hideTimersRef.current.delete(target.id)
          }, LABEL_HIDE_GRACE_MS)
          hideTimersRef.current.set(target.id, timer)
        }
        anchor.onTargetUpdate = () => {
          if (runId === runIdRef.current && mindarRef.current === instance && !confirmedTargetsRef.current.has(target.id)) label.style.visibility = 'hidden'
        }
      })
      const mediaDevices = navigator.mediaDevices
      const originalGetUserMedia = mediaDevices.getUserMedia
      try {
        mediaDevices.getUserMedia = (constraints) => {
          if (cameraStream) {
            externalCameraStreamRef.current = cameraStream
            return Promise.resolve(cameraStream)
          }
          if (!constraints?.video) return originalGetUserMedia.call(mediaDevices, constraints).then((stream) => { cameraStreamsRef.current.add(stream); return stream })
          const videoConstraints = typeof constraints.video === 'object' ? constraints.video : {}
          const mobile = window.matchMedia?.('(max-width: 768px)').matches ?? false
          return originalGetUserMedia.call(mediaDevices, {
            ...constraints,
            video: { ...videoConstraints, facingMode: 'environment', width: { ideal: mobile ? 1280 : 1920 }, height: { ideal: mobile ? 720 : 1080 }, frameRate: { ideal: 24, max: 30 } },
          }).then(async (stream) => { cameraStreamsRef.current.add(stream); await stabilizeCameraTrack(stream); return stream })
        }
        await instance.start()
      } finally {
        mediaDevices.getUserMedia = originalGetUserMedia
      }
      debugAr('mindar:started', { anchors: (instance as MindARThree & { anchors?: unknown[] }).anchors?.length, video: Boolean(containerRef.current.querySelector('video')), canvas: Boolean(containerRef.current.querySelector('canvas')) })
      if (activeTargetIdsRef.current.size === 1) {
        const controller = (instance as MindARThree & { controller?: { interestedTargetIndex: number } }).controller
        if (controller) controller.interestedTargetIndex = TARGETS.findIndex((target) => activeTargetIdsRef.current.has(target.id))
      }
      const video = containerRef.current.querySelector('video')
      if (video) {
        video.muted = true
        video.playsInline = true
        video.autoplay = true
        video.setAttribute('playsinline', '')
        video.style.zIndex = '0'
        if (video.paused) await video.play().catch((cause) => debugAr('video:play-failed', cause))
      }
      let previousTime = performance.now()
      let previousRender = 0
      animationLoopRef.current = () => {
        const now = performance.now()
        const delta = Math.min(.05, Math.max(0, (now - previousTime) / 1000))
        previousTime = now
        if (mobile && now - previousRender < 33) return
        previousRender = now
        elapsedRef.current += delta
        particleSystemsRef.current.forEach((particles) => particles.update(delta, elapsedRef.current))
        instance.renderer.render(instance.scene, instance.camera)
        instance.cssRenderer.render(instance.cssScene, instance.camera)
      }
      instance.renderer.setAnimationLoop(animationLoopRef.current)
      debugAr('renderer:loop-installed', { particleSystems: particleSystemsRef.current.size, canvas: Boolean(instance.renderer.domElement), cssScene: Boolean(instance.cssScene) })
      setExperienceState('active')
    } catch (cause) {
      stop(); setExperienceState('error')
      if (cause instanceof DOMException && cause.name === 'NotAllowedError') setError('Camera permission was denied. Allow camera access for this site and try again.')
      else if (cause instanceof Error && cause.message === 'Camera access requires HTTPS or localhost.') setError('Camera access requires HTTPS or localhost. Open the app through http://localhost:5173 or an HTTPS URL.')
      else if (isIosDevice() && cause instanceof Error && /shader|webgl|link/i.test(cause.message)) setError('Este iPhone tiene un problema de compatibilidad entre iOS y el motor AR. La cámara funciona, pero el detector no puede iniciar. Actualiza iOS y vuelve a probar; si continúa, usa temporalmente otro dispositivo.')
      else setError('AR tracking could not start. Check camera permissions, HTTPS/localhost, and the tracking resource.')
    }
  }

  const activeCount = Object.values(tracking).filter((status) => status === 'detected').length
  const globalValidation = deriveGlobalValidation(tracking)
  startRef.current = start
  useEffect(() => { onValidationChange?.(globalValidation) }, [globalValidation, onValidationChange])
  useEffect(() => {
    if (autoStart && !disabled) void startRef.current()
  }, [autoStart, disabled])
  useEffect(() => {
    if (disabled) stop()
  }, [disabled])
  useEffect(() => {
    const instance = mindarRef.current
    const video = containerRef.current?.querySelector('video')
    if (!instance || !video || experienceState !== 'active') return
    if (paused) {
      video.pause()
      instance.renderer.setAnimationLoop(null)
      debugAr('session:paused-for-discovery')
      return
    }
    void video.play().then(() => {
      if (mindarRef.current === instance && animationLoopRef.current) instance.renderer.setAnimationLoop(animationLoopRef.current)
      debugAr('session:resumed-after-discovery')
    }).catch((cause) => debugAr('session:resume-failed', cause))
  }, [paused, experienceState])
  return <section className={`ar-experience ${paused ? 'is-paused' : ''}`}>{(heading || description) && <div className="ar-header"><div><p className="eyebrow">Vuela por Colombia</p><h1>{heading}</h1><p>{description}</p></div><span className={`camera-state ${experienceState}`}>{experienceState === 'active' ? `${activeCount} tracked` : experienceState}</span></div>}<div className="ar-view-shell"><div ref={containerRef} className="ar-view" aria-label="AR camera view" /><div className="ar-camera-overlay">{cameraOverlay}</div></div>{error && <p className="ar-error" role="alert">{error}</p>}{showDetails && <><section className={`global-status ${globalValidation.state}`} aria-live="polite"><strong>{globalStatusLabel[globalValidation.state]}</strong><span>{globalValidation.confirmedRegions.length}/5 regions confirmed{globalValidation.fullMapConfirmed ? ' · complete map confirmed' : ''}</span>{globalValidation.mapRecognized && globalValidation.assemblyStatus === 'unknown' && <small>Recognition is complete; physical assembly remains unknown.</small>}</section><div className="tracking-status" aria-label="Target tracking status">{TARGETS.map((target) => <div key={target.id} className={`tracking-row ${tracking[target.id]}`}><span className="status-dot" /><span>{target.label}</span><small>{tracking[target.id] === 'detected' ? 'Detected and tracked' : tracking[target.id] === 'provisional' ? 'Confirming target' : tracking[target.id] === 'temporarily-lost' ? 'Brief tracking loss' : tracking[target.id] === 'lost' ? 'Tracking lost' : 'Not detected'}</small></div>)}</div></>}</section>
}
