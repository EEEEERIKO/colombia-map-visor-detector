import { useEffect, useRef, useState } from 'react'
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'
import { TARGETS } from '../../types/api'
import { deriveGlobalValidation, globalStatusLabel, type TrackingStatus } from './globalValidation'
import './ar.css'

const LABEL_HIDE_GRACE_MS = 250
const TARGET_CONFIRMATION_MS = 180
const MINDAR_WARMUP_TOLERANCE = 8

export function ArExperience({ onValidationChange }: { onValidationChange?: (result: ReturnType<typeof deriveGlobalValidation>) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mindarRef = useRef<MindARThree | null>(null)
  const hideTimersRef = useRef(new Map<string, number>())
  const confirmationTimersRef = useRef(new Map<string, number>())
  const confirmedTargetsRef = useRef(new Set<string>())
  const runIdRef = useRef(0)
  const [experienceState, setExperienceState] = useState<'idle' | 'starting' | 'active' | 'error' | 'stopped'>('idle')
  const [error, setError] = useState('')
  const [tracking, setTracking] = useState<Record<string, TrackingStatus>>(() => Object.fromEntries(TARGETS.map((target) => [target.id, 'not-detected'])))

  const clearHideTimers = () => {
    hideTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    hideTimersRef.current.clear()
  }

  const clearConfirmationTimers = () => {
    confirmationTimersRef.current.forEach((timer) => window.clearTimeout(timer))
    confirmationTimersRef.current.clear()
  }

  const stop = () => {
    runIdRef.current += 1
    clearHideTimers()
    clearConfirmationTimers()
    confirmedTargetsRef.current.clear()
    const instance = mindarRef.current
    if (instance) {
      instance.renderer.setAnimationLoop(null)
      try { instance.stop() } catch { /* MindAR may not have started its video yet. */ }
      instance.renderer.dispose()
      mindarRef.current = null
    }
    if (containerRef.current) containerRef.current.replaceChildren()
    setExperienceState('stopped')
    setTracking(Object.fromEntries(TARGETS.map((target) => [target.id, 'not-detected'])))
  }

  useEffect(() => () => {
    runIdRef.current += 1
    clearHideTimers()
    clearConfirmationTimers()
    confirmedTargetsRef.current.clear()
    const instance = mindarRef.current
    if (instance) {
      instance.renderer.setAnimationLoop(null)
      try { instance.stop() } catch { /* MindAR may not have started its video yet. */ }
      instance.renderer.dispose()
      mindarRef.current = null
    }
  }, [])

  const setTargetStatus = (index: number, status: TrackingStatus) => setTracking((current) => ({ ...current, [TARGETS[index].id]: status }))

  const start = async () => {
    if (!containerRef.current) return
    stop(); setError(''); setExperienceState('starting')
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access requires HTTPS or localhost.')
      }
      const instance = new MindARThree({ container: containerRef.current, imageTargetSrc: '/assets/tracking/colombia-targets.mind', maxTrack: 6, warmupTolerance: MINDAR_WARMUP_TOLERANCE, uiLoading: 'no', uiScanning: 'no', uiError: 'no' })
      mindarRef.current = instance
      const runId = runIdRef.current
      TARGETS.forEach((target, index) => {
        const anchor = instance.addCSSAnchor(index)
        const label = document.createElement('div')
        label.className = 'ar-target-label'
        label.textContent = target.label
        label.dataset.targetId = target.id
        label.style.visibility = 'hidden'
        label.setAttribute('aria-hidden', 'true')
        const object = new CSS3DObject(label); object.scale.set(1, 1, 1); anchor.group.add(object)
        anchor.onTargetFound = () => {
          if (runId !== runIdRef.current || mindarRef.current !== instance) return
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
            label.style.visibility = 'visible'
            label.setAttribute('aria-hidden', 'false')
            setTargetStatus(index, 'detected')
          }, TARGET_CONFIRMATION_MS)
          confirmationTimersRef.current.set(target.id, confirmationTimer)
        }
        anchor.onTargetLost = () => {
          if (runId !== runIdRef.current || mindarRef.current !== instance) return
          const confirmationTimer = confirmationTimersRef.current.get(target.id)
          if (confirmationTimer) { window.clearTimeout(confirmationTimer); confirmationTimersRef.current.delete(target.id) }
          confirmedTargetsRef.current.delete(target.id)
          label.setAttribute('aria-hidden', 'true')
          setTargetStatus(index, 'temporarily-lost')
          const timer = window.setTimeout(() => {
            if (runId === runIdRef.current && mindarRef.current === instance) {
              label.style.visibility = 'hidden'
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
      await instance.start()
      const video = containerRef.current.querySelector('video')
      if (video) { video.muted = true; video.playsInline = true; video.style.zIndex = '0' }
      instance.renderer.setAnimationLoop(() => { instance.renderer.render(instance.scene, instance.camera); instance.cssRenderer.render(instance.cssScene, instance.camera) })
      setExperienceState('active')
    } catch (cause) {
      stop(); setExperienceState('error')
      if (cause instanceof DOMException && cause.name === 'NotAllowedError') setError('Camera permission was denied. Allow camera access for this site and try again.')
      else if (cause instanceof Error && cause.message === 'Camera access requires HTTPS or localhost.') setError('Camera access requires HTTPS or localhost. Open the app through http://localhost:5173 or an HTTPS URL.')
      else setError('AR tracking could not start. Check camera permissions, HTTPS/localhost, and the tracking resource.')
    }
  }

  const activeCount = Object.values(tracking).filter((status) => status === 'detected').length
  const globalValidation = deriveGlobalValidation(tracking)
  useEffect(() => { onValidationChange?.(globalValidation) }, [globalValidation, onValidationChange])
  return <section className="ar-experience"><div className="ar-header"><div><p className="eyebrow">Vuela por Colombia</p><h1>Image tracking</h1><p>Point the camera at the complete map or one of the five regional pieces. Labels appear only after MindAR confirms a target.</p></div><span className={`camera-state ${experienceState}`}>{experienceState === 'active' ? `${activeCount} tracked` : experienceState}</span></div><div ref={containerRef} className="ar-view" aria-label="AR camera view" /><div className="ar-actions"><button onClick={start} disabled={experienceState === 'starting'}>{experienceState === 'active' ? 'Restart tracking' : 'Start camera'}</button>{experienceState === 'active' && <button className="secondary" onClick={stop}>Stop camera</button>}</div>{error && <p className="ar-error" role="alert">{error}</p>}<section className={`global-status ${globalValidation.state}`} aria-live="polite"><strong>{globalStatusLabel[globalValidation.state]}</strong><span>{globalValidation.confirmedRegions.length}/5 regions confirmed{globalValidation.fullMapConfirmed ? ' · complete map confirmed' : ''}</span>{globalValidation.mapRecognized && globalValidation.assemblyStatus === 'unknown' && <small>Recognition is complete; physical assembly remains unknown.</small>}</section><div className="tracking-status" aria-label="Target tracking status">{TARGETS.map((target) => <div key={target.id} className={`tracking-row ${tracking[target.id]}`}><span className="status-dot" /><span>{target.label}</span><small>{tracking[target.id] === 'detected' ? 'Detected and tracked' : tracking[target.id] === 'provisional' ? 'Confirming target' : tracking[target.id] === 'temporarily-lost' ? 'Brief tracking loss' : tracking[target.id] === 'lost' ? 'Tracking lost' : 'Not detected'}</small></div>)}</div></section>
}
