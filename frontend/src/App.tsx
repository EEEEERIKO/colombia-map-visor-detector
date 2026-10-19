import { useCallback, useState } from 'react'
import { ArExperience } from './components/ar/ArExperience'
import { AcquisitionWorkspace } from './components/camera/AcquisitionWorkspace'
import { TARGETS, type TargetId } from './types/api'
import { deriveGlobalValidation, type GlobalValidationResult } from './components/ar/globalValidation'

const initialValidation = deriveGlobalValidation(Object.fromEntries(TARGETS.map((target) => [target.id, 'not-detected'])))

const regionCopy: Record<Extract<TargetId, `region-${string}`>, { name: string; subtitle: string; color: string }> = {
  'region-caribe': { name: 'CARIBE', subtitle: 'Mar, música y alegría', color: 'caribe' },
  'region-andina': { name: 'ANDINA', subtitle: 'Montañas y cultura', color: 'andina' },
  'region-pacifica': { name: 'PACÍFICA', subtitle: 'Selva y océano', color: 'pacifica' },
  'region-orinoquia': { name: 'ORINOQUÍA', subtitle: 'Llanos y horizonte', color: 'orinoquia' },
  'region-amazonia': { name: 'AMAZONÍA', subtitle: 'Naturaleza sin límites', color: 'amazonia' },
}

export default function App() {
  const [validation, setValidation] = useState<GlobalValidationResult>(initialValidation)
  const updateValidation = useCallback((next: GlobalValidationResult) => setValidation((current) => {
    const sameRegions = current.confirmedRegions.length === next.confirmedRegions.length && current.confirmedRegions.every((id) => next.confirmedRegions.includes(id))
    return current.state === next.state && current.fullMapConfirmed === next.fullMapConfirmed && sameRegions ? current : next
  }), [])
  const confirmed = new Set(validation.confirmedRegions)

  return <div className="app-shell">
    <header className="site-header">
      <a className="brand" href="#inicio" aria-label="Vuela por Colombia, inicio"><span className="brand-mark">✦</span><span>VUELA<br /><b>POR COLOMBIA</b></span></a>
      <nav aria-label="Navegación principal"><a className="active" href="#inicio">Inicio</a><a href="#descubre">Descubre</a><a href="#regiones">Regiones</a><a href="#como-jugar">Cómo jugar</a></nav>
      <span className="header-progress" aria-label={`${validation.confirmedRegions.length} de 5 regiones encontradas`}><span>{validation.confirmedRegions.length}</span>/5 regiones</span>
    </header>

    <main>
      <section className="welcome-section" id="inicio">
        <div className="welcome-copy"><p className="reference-kicker">UNA AVENTURA DE REALIDAD AUMENTADA</p><h1>DESCUBRE<br /><em>COLOMBIA!</em></h1><p className="welcome-subtitle">5 REGIONES. 1 SOLO PAÍS.<br /><strong>¿LISTO PARA EXPLORAR?</strong></p><a className="primary-cta" href="#descubre">Comenzar aventura <span>→</span></a></div>
        <div className="welcome-art" aria-label="Mapa ilustrado de Colombia"><div className="sunburst" /><img src="/assets/targets/full-map.png" alt="Mapa completo de Colombia" /><span className="art-badge badge-caribe">CARIBE</span><span className="art-badge badge-andina">ANDINA</span><span className="art-badge badge-amazonia">AMAZONÍA</span></div>
      </section>

      <section className="discover-section" id="descubre">
        <div className="section-heading"><div><p className="reference-kicker">TU MISIÓN</p><h2>ENCUENTRA LAS <em>5 REGIONES!</em></h2></div><span className="mission-count">{validation.confirmedRegions.length} <small>DE 5</small></span></div>
        <div className="mission-card"><div className="mission-instruction"><span className="mission-icon">⌁</span><div><strong>APUNTA TU CÁMARA</strong><p>Encuentra cada región en el mapa físico para desbloquearla.</p></div></div><a className="secondary-cta" href="#camera">Ir a la cámara <span>↓</span></a></div>
        <div className="progress-track" role="progressbar" aria-label="Regiones encontradas" aria-valuemin={0} aria-valuemax={5} aria-valuenow={validation.confirmedRegions.length}><span style={{ width: `${validation.confirmedRegions.length * 20}%` }} /></div>
      </section>

      <section className="camera-section" id="camera"><div className="camera-section-heading"><div><p className="reference-kicker">REALIDAD AUMENTADA</p><h2>EXPLORA CON TU <em>CÁMARA</em></h2><p>Apunta al mapa físico y descubre las regiones en tiempo real.</p></div><span className={`live-pill ${validation.mapRecognized ? 'complete' : ''}`}><span />{validation.mapRecognized ? 'MAPA COMPLETO' : 'CÁMARA LISTA'}</span></div><ArExperience onValidationChange={updateValidation} /></section>

      <section className="regions-section" id="regiones"><div className="section-heading"><div><p className="reference-kicker">TU PROGRESO</p><h2>DESCUBRE LAS <em>5 REGIONES!</em></h2></div><span className="region-count">{validation.confirmedRegions.length}/5</span></div><div className="region-cards">{TARGETS.filter((target) => target.type === 'region').map((target) => { const copy = regionCopy[target.id as keyof typeof regionCopy]; const isFound = confirmed.has(target.id); return <article className={`region-card-large ${copy.color} ${isFound ? 'found' : 'locked'}`} key={target.id}><span className="region-status">{isFound ? 'ENCONTRADA' : 'POR DESCUBRIR'}</span><div className="region-art"><span>✦</span></div><h3>{copy.name}</h3><p>{isFound ? copy.subtitle : 'Apunta tu cámara para descubrirla'}</p><span className="lock-mark" aria-hidden="true">{isFound ? '✓' : '▣'}</span></article> })}</div></section>

      <section className={`completion-section ${validation.mapRecognized ? 'unlocked' : ''}`} id="como-jugar"><div className="completion-map"><img src="/assets/targets/full-map.png" alt="Mapa completo de Colombia" /></div><div><p className="reference-kicker">{validation.mapRecognized ? 'MISIÓN CUMPLIDA' : 'SIGUE EXPLORANDO'}</p><h2>{validation.mapRecognized ? <>COLOMBIA<br /><em>COMPLETA!</em></> : <>TU AVENTURA<br /><em>TE ESPERA</em></>}</h2><p>{validation.mapRecognized ? 'Has reconocido el mapa completo y sus cinco regiones.' : 'Encuentra las cinco regiones y el mapa completo para completar la experiencia.'}</p><span className="completion-status" role="status">{validation.canUnlockGame ? 'Experiencia lista' : 'Cámara activa para comenzar'}</span></div></section>

      <details className="diagnostics"><summary>Developer calibration tools</summary><p>Use this secondary area to inspect still captures and preprocessing. It is not part of the AR tracking flow.</p><AcquisitionWorkspace /></details>
    </main>
    <footer><span>✦ VUELA POR COLOMBIA</span><span>Una experiencia para descubrir, aprender y volar.</span></footer>
  </div>
}
