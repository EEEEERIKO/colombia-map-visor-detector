import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ArExperience } from './components/ar/ArExperience'
import { TARGETS, type TargetId } from './types/api'
import { deriveGlobalValidation, type GlobalValidationResult } from './components/ar/globalValidation'
import whiteMap from './assets-white-map.png'

type Screen = 'home' | 'map' | 'challenge' | 'mapSuccess' | 'regions' | 'regionInfo' | 'quiz' | 'complete'
const COUNTRY_ANSWER = 'COLOMBIA'
const regionOrdinals = ['PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA', 'QUINTA']
const regionalTargetIds = ['region-caribe', 'region-andina', 'region-pacifica', 'region-orinoquia', 'region-amazonia'] as const
type RegionalTargetId = (typeof regionalTargetIds)[number]
const initialValidation = deriveGlobalValidation(Object.fromEntries(TARGETS.map((target) => [target.id, 'not-detected'])))
const regionTargets = TARGETS.filter((target) => target.type === 'region')
const regionCopy: Record<string, { name: string; subtitle: string; color: string; emoji: string; fact: string; discoveryTitle: string; discoveryBody: string }> = {
  'region-caribe': { name: 'CARIBE', subtitle: 'Mar, música y alegría', color: 'caribe', emoji: '🌊', fact: 'Aquí viven el ritmo, las playas y la alegría de Colombia.', discoveryTitle: 'Un mundo de mar', discoveryBody: 'El ritmo, las playas y la alegría se encuentran en esta región.' },
  'region-andina': { name: 'ANDINA', subtitle: 'Montañas y cultura', color: 'andina', emoji: '⛰️', fact: 'Sus montañas guardan ciudades, páramos y mucha historia.', discoveryTitle: 'Entre montañas', discoveryBody: 'Sus alturas conectan ciudades, páramos y paisajes llenos de historia.' },
  'region-pacifica': { name: 'PACÍFICA', subtitle: 'Selva y océano', color: 'pacifica', emoji: '🐋', fact: 'Es una región de selvas, océano y una biodiversidad increíble.', discoveryTitle: 'Selva junto al océano', discoveryBody: 'La selva, la lluvia y el océano crean un territorio lleno de vida.' },
  'region-orinoquia': { name: 'ORINOQUÍA', subtitle: 'Llanos y horizonte', color: 'orinoquia', emoji: '🦜', fact: 'Sus llanos se extienden hasta el horizonte y celebran la vida a caballo.', discoveryTitle: 'Un horizonte sin fin', discoveryBody: 'Los llanos se abren hasta el horizonte y guardan historias a caballo.' },
  'region-amazonia': { name: 'AMAZONÍA', subtitle: 'Naturaleza sin límites', color: 'amazonia', emoji: '🌿', fact: 'Es un territorio de selva, ríos y naturaleza sin límites.', discoveryTitle: 'Naturaleza sin límites', discoveryBody: 'La selva y los ríos forman un territorio de vida extraordinaria.' },
}
const regionReferenceAssets: Record<string, string> = {
  'region-caribe': '/assets/ui/regions/caribe-white.png',
  'region-andina': '/assets/ui/regions/andes-white.png',
  'region-pacifica': '/assets/ui/regions/pacifico-white.png',
  'region-orinoquia': '/assets/ui/regions/orinoquia-white.png',
  'region-amazonia': '/assets/ui/regions/amazonas-white.png',
}

function RegionProgressOverlay({ foundRegions }: { foundRegions: TargetId[] }) {
  const confirmedCount = regionalTargetIds.filter((targetId) => foundRegions.includes(targetId)).length
  return <div className="ar-progress-overlay" aria-label={`${confirmedCount} de 5 regiones descubiertas`}><div className="ar-progress-copy"><strong>{confirmedCount} de 5 regiones</strong><span>El misterio continúa</span></div><div className="ar-progress-markers">{regionalTargetIds.map((targetId) => <span key={targetId} className={foundRegions.includes(targetId) ? 'confirmed' : ''} aria-label={foundRegions.includes(targetId) ? 'Región descubierta' : 'Región pendiente'} />)}</div></div>
}

function DiscoveryCard({ copy, onContinue }: { copy: typeof regionCopy[string]; onContinue: () => void }) {
  return <aside className="ar-discovery-card" aria-live="polite"><div className="ar-discovery-kicker">¡NUEVO DESCUBRIMIENTO! {copy.emoji}</div><h2>{copy.discoveryTitle}</h2><p>{copy.discoveryBody}</p><button className="game-primary" onClick={onContinue}>¡SIGAMOS! →</button></aside>
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [regionIndex, setRegionIndex] = useState(0)
  const [foundRegions, setFoundRegions] = useState<TargetId[]>([])
  const [discoveryTargetId, setDiscoveryTargetId] = useState<RegionalTargetId | null>(null)
  const [cameraPermissionError, setCameraPermissionError] = useState('')
  const [cameraPermissionBlocked, setCameraPermissionBlocked] = useState(false)
  const [mapDetected, setMapDetected] = useState(false)
  const [cameraPreviewStream, setCameraPreviewStream] = useState<MediaStream | null>(null)
  const [quizLetters, setQuizLetters] = useState<string[]>(() => Array(COUNTRY_ANSWER.length).fill(''))
  const [quizHintCount, setQuizHintCount] = useState(0)
  const [quizMessage, setQuizMessage] = useState('')
  const [cloudTransition, setCloudTransition] = useState<'idle' | 'covering' | 'revealing'>('idle')
  const cameraPreviewRef = useRef<HTMLVideoElement>(null)
  const quizInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const transitionTimerRef = useRef<number | null>(null)
  const revealTimerRef = useRef<number | null>(null)
  const [, setValidation] = useState<GlobalValidationResult>(initialValidation)
  const currentRegion = regionTargets[regionIndex]
  const currentCopy = currentRegion ? regionCopy[currentRegion.id] : null
  const runCloudTransition = useCallback((update: () => void) => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current)
    if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current)
    setCloudTransition('covering')
    transitionTimerRef.current = window.setTimeout(() => {
      update()
      setCloudTransition('revealing')
      revealTimerRef.current = window.setTimeout(() => setCloudTransition('idle'), 650)
    }, 420)
  }, [])
  const transitionTo = useCallback((nextScreen: Screen) => {
    if (nextScreen === screen) return
    runCloudTransition(() => setScreen(nextScreen))
  }, [runCloudTransition, screen])
  useEffect(() => () => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current)
    if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current)
  }, [])
  useEffect(() => () => {
    cameraPreviewStream?.getTracks().forEach((track) => track.stop())
  }, [cameraPreviewStream])
  const updateValidation = useCallback((next: GlobalValidationResult) => setValidation((current) => {
    const sameRegions = current.confirmedRegions.length === next.confirmedRegions.length && current.confirmedRegions.every((id) => next.confirmedRegions.includes(id))
    return current.state === next.state && current.fullMapConfirmed === next.fullMapConfirmed && sameRegions ? current : next
  }), [])
  const handleTargetConfirmed = useCallback((targetId: TargetId) => {
    if (screen === 'challenge' && targetId === 'colombia-completa') { setRegionIndex(0); transitionTo('mapSuccess'); return }
    if (screen !== 'regions' || !currentRegion || targetId !== currentRegion.id) return
    if (foundRegions.includes(targetId)) return
    setFoundRegions((current) => current.includes(targetId) ? current : [...current, targetId])
    setDiscoveryTargetId(targetId as RegionalTargetId)
  }, [currentRegion, foundRegions, screen, transitionTo])
  const continueFromDiscovery = () => {
    setDiscoveryTargetId(null)
    transitionTo('regionInfo')
  }
  const resetGame = () => { cameraPreviewStream?.getTracks().forEach((track) => track.stop()); setCameraPreviewStream(null); setFoundRegions([]); setDiscoveryTargetId(null); setRegionIndex(0); setMapDetected(false); setQuizLetters(Array(COUNTRY_ANSWER.length).fill('')); setQuizHintCount(0); setQuizMessage(''); setValidation(initialValidation); transitionTo('home') }
  const continueFromRegionInfo = () => {
    if (regionIndex === regionTargets.length - 1) transitionTo('quiz')
    else runCloudTransition(() => {
      setRegionIndex((current) => current + 1)
      setScreen('regions')
    })
  }
  const handleQuizLetterChange = (index: number, value: string) => {
    const letter = value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÜÑ]/g, '').slice(-1)
    if (index < quizHintCount) return
    setQuizLetters((current) => current.map((item, currentIndex) => currentIndex === index ? letter : item))
    if (letter && index < COUNTRY_ANSWER.length - 1) quizInputRefs.current[index + 1]?.focus()
  }
  const handleQuizKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !quizLetters[index] && index > quizHintCount) quizInputRefs.current[index - 1]?.focus()
    if (event.key === 'Enter') checkCountryAnswer()
  }
  const checkCountryAnswer = () => {
    if (quizLetters.join('') === COUNTRY_ANSWER) {
      setQuizMessage('¡Correcto!')
      transitionTo('complete')
      return
    }
    const nextHintCount = Math.min(quizHintCount + 1, COUNTRY_ANSWER.length)
    setQuizHintCount(nextHintCount)
    setQuizLetters((current) => current.map((letter, index) => index < nextHintCount ? COUNTRY_ANSWER[index] : letter))
    setQuizMessage(nextHintCount === COUNTRY_ANSWER.length ? '¡Ya tienes todas las letras! Completa la palabra.' : `Pista: la letra ${nextHintCount} es ${COUNTRY_ANSWER[nextHintCount - 1]}.`)
    quizInputRefs.current[nextHintCount]?.focus()
  }
  useEffect(() => {
    if (!cameraPreviewStream || screen !== 'map') return
    if (cameraPreviewRef.current) cameraPreviewRef.current.srcObject = cameraPreviewStream
    const transitionTimer = window.setTimeout(() => {
      transitionTo('challenge')
    }, 900)
    return () => {
      window.clearTimeout(transitionTimer)
    }
  }, [cameraPreviewStream, screen, transitionTo])
  const requestCameraPermission = async () => {
    setCameraPermissionError('')
    setCameraPermissionBlocked(false)
    setMapDetected(false)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraPermissionError('Tu navegador no permite usar la cámara aquí.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setCameraPreviewStream(stream)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setCameraPermissionBlocked(true)
        setCameraPermissionError('La cámara está bloqueada. Pulsa el candado de la barra del navegador, permite la cámara y vuelve a intentarlo.')
      } else setCameraPermissionError('No pudimos activar la cámara. Revisa los permisos e inténtalo de nuevo.')
    }
  }
  const activeTargets = screen === 'challenge' ? ['colombia-completa' as TargetId] : screen === 'regions' && currentRegion ? [currentRegion.id] : []
  const mapReferenceOverlay = !mapDetected ? <div className="map-reference-group" aria-hidden="true"><img className="map-reference-overlay" src={whiteMap} alt="" /><span>?</span></div> : null
  const isArScreen = screen === 'challenge' || screen === 'regions'
  const discoveryCopy = discoveryTargetId ? regionCopy[discoveryTargetId] : null

  return <div className={`game-shell ${isArScreen ? 'ar-game-shell' : ''}`}>
    <div className={`cloud-transition ${cloudTransition}`} aria-hidden="true"><div className="cloud-curtain"><i className="cloud-lobe cloud-lobe-one" /><i className="cloud-lobe cloud-lobe-two" /><i className="cloud-lobe cloud-lobe-three" /><i className="cloud-lobe cloud-lobe-four" /></div><div className="cloud-bank cloud-bank-one" /><div className="cloud-bank cloud-bank-two" /><div className="cloud-bank cloud-bank-three" /></div>
    <main className={`game-main ${isArScreen ? 'ar-game-main' : ''}`}>
      {screen === 'home' && <section className="game-screen home-screen" aria-labelledby="game-title"><div className="home-copy"><div className="game-kicker">¡UNA AVENTURA PARA TODOS!</div><h1 id="game-title">¡HAY UN MUNDO <em>POR DESCUBRIR!</em></h1><p className="game-lead strong-lead">🔊 Para disfrutar mejor, activa y sube el volumen.</p><button className="game-primary" onClick={() => transitionTo('map')}>¡JUGAR AHORA! <span>🎉</span></button><p className="home-hint"><span>➜</span> Buscá este mapa por la UAP y descubre sus secretos</p></div><div className="home-map"><div className="map-rays" /><img src={whiteMap} alt="Mapa de Colombia" /><span className="map-searcher" aria-hidden="true">🔍</span><span className="map-sticker">¿DÓNDE ESTÁ? </span></div></section>}
      {screen === 'map' && <section className="game-screen mission-screen" aria-labelledby="map-title">
        <button className="back-button" onClick={() => transitionTo('home')}>← Volver</button>
        <div className="game-kicker">ANTES DE EMPEZAR</div>
        <h1 id="map-title">¿LISTO PARA EL <em>RETO?</em></h1>
        <p className="game-lead">¡A BUSCAR!</p>
        <div className="camera-permission-card">
          <span className="camera-permission-icon" aria-hidden="true">📸</span>
          <div><strong>PERMISO DE CÁMARA NECESARIO</strong><p>Activa la cámara para detectar el mapa y poder jugar.</p></div>
          <button className="game-primary" onClick={requestCameraPermission}>{cameraPermissionBlocked ? 'Ya permití la cámara: intentar de nuevo →' : 'Activar cámara para jugar →'}</button>
        </div>
        {cameraPermissionError && <p className="camera-permission-error" role="alert">{cameraPermissionError}</p>}
        <div className="setup-stack">
          <div className={`setup-preview ${cameraPreviewStream ? 'camera-active' : ''}`}>
            {cameraPreviewStream ? <><video ref={cameraPreviewRef} className="camera-preview-video" autoPlay muted playsInline aria-label="Vista previa de la cámara" /><span className="camera-preview-label">CÁMARA ACTIVADA</span><b>Preparando el reto…</b></> : <><span className="camera-placeholder-icon" aria-hidden="true">📷</span><strong>Tu cámara aparecerá aquí</strong><small>Actívala para comenzar</small></>}
          </div>
          <div className="setup-card"><span>📸 <b>Apunta la cámara al mapa.</b></span><span>🧩 <b>Pon las piezas dentro del marco.</b></span><span>✅ <b>¡Todo listo para jugar!</b></span></div>
          <p className="pale-note">🔒 Es seguro: la cámara solo se usa para reconocer el mapa. No guardamos imágenes ni datos personales.</p>
        </div>
      </section>}
      {screen === 'challenge' && <section className="game-screen mission-screen ar-fullscreen-screen" aria-labelledby="challenge-title">
        <h1 id="challenge-title" className="sr-only">¡Encuentra este mapa!</h1>
        <ArExperience activeTargetIds={activeTargets} cameraStream={cameraPreviewStream ?? undefined} onTargetFound={() => setMapDetected(true)} onTargetLost={() => setMapDetected(false)} onTargetConfirmed={handleTargetConfirmed} onValidationChange={updateValidation} heading="" description="" confirmationDurationMs={2000} cameraOverlay={mapReferenceOverlay} anchoredScan autoStart showDetails={false} />
        <div className="ar-top-overlay">
          <RegionProgressOverlay foundRegions={foundRegions} />
          <div className="ar-instruction-overlay"><strong>ENCUENTRA EL MAPA</strong><span>Apunta la cámara al mapa.</span></div>
        </div>
        <button className="ar-back-button" aria-label="Volver a los permisos de cámara" onClick={() => { setMapDetected(false); transitionTo('map') }}>←</button>
      </section>}
      {screen === 'mapSuccess' && <section className="game-screen discovery-screen" aria-labelledby="map-success-title"><div className="game-kicker">¡MAPA ENCONTRADO! 🎉</div><div className="success-map"><img src={whiteMap} alt="Mapa completo de Colombia" /><span>✓</span></div><h1 id="map-success-title">¡FELICIDADES! <em>ENCONTRASTE EL MAPA</em></h1><p className="game-lead">Ahora comienza la aventura explorando cada región.</p><button className="game-primary" onClick={() => transitionTo('regions')}>¡COMENZAR A EXPLORAR! →</button></section>}
      {screen === 'regions' && currentRegion && currentCopy && <section className={`game-screen mission-screen ar-fullscreen-screen ${discoveryTargetId ? 'discovery-open' : ''}`} aria-labelledby="region-title">
        <h1 id="region-title" className="sr-only">¡Encontremos la {regionOrdinals[regionIndex].toLowerCase()} región!</h1>
        <ArExperience key={currentRegion.id} activeTargetIds={[currentRegion.id]} cameraStream={cameraPreviewStream ?? undefined} onTargetConfirmed={handleTargetConfirmed} onValidationChange={updateValidation} heading="" description="" confirmationDurationMs={2000} anchoredScan anchoredScanImage={regionReferenceAssets[currentRegion.id]} autoStart showDetails={false} />
        <div className="ar-top-overlay">
          <RegionProgressOverlay foundRegions={foundRegions} />
          <div className="ar-instruction-overlay"><strong>ENCUENTRA LA SILUETA</strong><span>Ubícala en el mapa.</span></div>
        </div>
        <div className="ar-region-guide-overlay">
          <img src={regionReferenceAssets[currentRegion.id]} alt="Silueta de la región que debes ubicar" />
          <div><strong>UBICA ESTA SILUETA</strong><span>EN EL MAPA</span></div>
        </div>
        {discoveryCopy && <DiscoveryCard copy={discoveryCopy} onContinue={continueFromDiscovery} />}
        <button className="ar-back-button" aria-label="Volver a la pantalla anterior" onClick={() => transitionTo(regionIndex === 0 ? 'mapSuccess' : 'regionInfo')}>←</button>
      </section>}
      {screen === 'regionInfo' && currentRegion && currentCopy && <section className="game-screen discovery-screen" aria-labelledby="region-info-title"><div className={`region-info-map ${currentCopy.color}`}><img src={regionReferenceAssets[currentRegion.id]} alt={`Mapa de la región ${currentCopy.name}`} /></div><div className="game-kicker">¡REGIÓN ENCONTRADA! ✅</div><p className="game-lead strong-lead">Descubriste la región {regionIndex + 1} de 5</p><h1 id="region-info-title"><em>{currentCopy.name} {currentCopy.emoji}</em></h1><p className="region-fact">{currentCopy.fact}</p><p className="region-subtitle">{currentCopy.subtitle}</p><button className="game-primary" onClick={continueFromRegionInfo}>{regionIndex === regionTargets.length - 1 ? '¡VER RESULTADO FINAL! 🎉' : '¡BUSCAR LA SIGUIENTE REGIÓN! →'}</button></section>}
      {screen === 'quiz' && <section className="game-screen discovery-screen quiz-screen" aria-labelledby="quiz-title"><div className="game-kicker">¡5 REGIONES DESCUBIERTAS! 🎉</div><div className="quiz-map"><img src={whiteMap} alt="Mapa completo de Colombia" /></div><h1 id="quiz-title">ACABAS DE DESCUBRIR UN <em>PAÍS COMPLETO</em></h1><p className="game-lead strong-lead">¿SABES CÓMO SE LLAMA?</p><div className="quiz-letters" aria-label="Escribe el nombre del país">{COUNTRY_ANSWER.split('').map((_, index) => <input key={index} ref={(element) => { quizInputRefs.current[index] = element }} className={index < quizHintCount ? 'hint-letter' : ''} aria-label={`Letra ${index + 1} de 7`} maxLength={1} readOnly={index < quizHintCount} value={quizLetters[index]} onChange={(event) => handleQuizLetterChange(index, event.target.value)} onKeyDown={(event) => handleQuizKeyDown(index, event)} autoFocus={index === quizHintCount} />)}</div>{quizMessage && <p className="quiz-message" role="status">💡 {quizMessage}</p>}<button className="game-primary" onClick={checkCountryAnswer}>COMPROBAR →</button></section>}
      {screen === 'complete' && <section className="game-screen complete-screen" aria-labelledby="complete-title"><div className="game-kicker">¡QUÉ GRAN EQUIPO! ✨</div><div className="complete-map"><img src={whiteMap} alt="Mapa completo de Colombia" /><span>🇨🇴</span></div><h1 id="complete-title">¡COLOMBIA <em>COMPLETA!</em> 🇨🇴</h1><p className="game-lead strong-lead">¡LO LOGRASTE!</p><button className="game-primary" onClick={resetGame}>¡DESCUBRIR OTRA VEZ! <span>🎉</span></button></section>}
    </main>
  </div>
}
