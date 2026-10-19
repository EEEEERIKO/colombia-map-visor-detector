import { useEffect, useRef, useState } from 'react'
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { MindARThree } from 'mind-ar/dist/mindar-image-three.prod.js'
import { TARGETS } from '../../types/api'
import './ar.css'

type TrackStatus = 'not-detected' | 'detected' | 'lost'

export function ArExperience() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mindarRef = useRef<MindARThree | null>(null)
  const [experienceState, setExperienceState] = useState<'idle' | 'starting' | 'active' | 'error' | 'stopped'>('idle')
  const [error, setError] = useState('')
  const [tracking, setTracking] = useState<Record<string, TrackStatus>>(() => Object.fromEntries(TARGETS.map((target) => [target.id, 'not-detected'])))

  const stop = () => {
    const instance = mindarRef.current
    if (instance) { instance.renderer.setAnimationLoop(null); instance.stop(); instance.renderer.dispose(); mindarRef.current = null }
    if (containerRef.current) containerRef.current.replaceChildren()
    setExperienceState('stopped')
    setTracking(Object.fromEntries(TARGETS.map((target) => [target.id, 'not-detected'])))
  }

  useEffect(() => () => { const instance = mindarRef.current; if (instance) { instance.renderer.setAnimationLoop(null); instance.stop(); instance.renderer.dispose(); mindarRef.current = null } }, [])

  const setTargetStatus = (index: number, status: TrackStatus) => setTracking((current) => ({ ...current, [TARGETS[index].id]: status }))

  const start = async () => {
    if (!containerRef.current) return
    stop(); setError(''); setExperienceState('starting')
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access requires HTTPS or localhost.')
      }
      const instance = new MindARThree({ container: containerRef.current, imageTargetSrc: '/assets/tracking/colombia-targets.mind', maxTrack: 6, uiLoading: 'no', uiScanning: 'no', uiError: 'no' })
      mindarRef.current = instance
      TARGETS.forEach((target, index) => {
        const anchor = instance.addCSSAnchor(index)
        const label = document.createElement('div'); label.className = 'ar-target-label'; label.textContent = target.label
        const object = new CSS3DObject(label); object.scale.set(0.001, 0.001, 0.001); anchor.group.add(object)
        anchor.onTargetFound = () => setTargetStatus(index, 'detected')
        anchor.onTargetLost = () => setTargetStatus(index, 'lost')
      })
      await instance.start()
      instance.renderer.setAnimationLoop(() => { instance.renderer.render(instance.scene, instance.camera); instance.cssRenderer.render(instance.cssScene, instance.camera) })
      setExperienceState('active')
    } catch (cause) {
      stop(); setExperienceState('error'); setError(cause instanceof DOMException && cause.name === 'NotAllowedError' ? 'Camera permission was denied.' : 'AR tracking could not start. Check camera permissions, HTTPS/localhost, and the tracking resource.')
    }
  }

  const activeCount = Object.values(tracking).filter((status) => status === 'detected').length
  return <section className="ar-experience"><div className="ar-header"><div><p className="eyebrow">Vuela por Colombia</p><h1>Image tracking</h1><p>Point the camera at the complete map or one of the five regional pieces. Labels appear only after MindAR recognizes a target.</p></div><span className={`camera-state ${experienceState}`}>{experienceState === 'active' ? `${activeCount} tracked` : experienceState}</span></div><div ref={containerRef} className="ar-view" aria-label="AR camera view" /><div className="ar-actions"><button onClick={start} disabled={experienceState === 'starting'}>{experienceState === 'active' ? 'Restart tracking' : 'Start camera'}</button>{experienceState === 'active' && <button className="secondary" onClick={stop}>Stop camera</button>}</div>{error && <p className="ar-error" role="alert">{error}</p>}<div className="tracking-status" aria-label="Target tracking status">{TARGETS.map((target) => <div key={target.id} className={`tracking-row ${tracking[target.id]}`}><span className="status-dot" /><span>{target.label}</span><small>{tracking[target.id] === 'detected' ? 'Detected and tracked' : tracking[target.id] === 'lost' ? 'Tracking lost' : 'Not detected'}</small></div>)}</div></section>
}
