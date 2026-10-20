import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ArExperience } from './components/ar/ArExperience'
import { TARGETS, type TargetId } from './types/api'
import { deriveGlobalValidation, type GlobalValidationResult } from './components/ar/globalValidation'
import { FinalExperience } from './components/finale/FinalExperience'
import { DiscoveryExperience } from './components/ar/DiscoveryExperience'
import whiteMap from './assets-white-map.png'

const debugApp = (...details: unknown[]) => {
  if (import.meta.env.DEV) console.debug('[APP AR DEBUG]', ...details)
}

type Screen = 'home' | 'map' | 'challenge' | 'mapSuccess' | 'regions' | 'regionInfo' | 'quiz' | 'complete' | 'finale'
const COUNTRY_ANSWER = 'COLOMBIA'
const regionOrdinals = ['PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA', 'QUINTA']
const regionalTargetIds = ['region-caribe', 'region-andina', 'region-pacifica', 'region-orinoquia', 'region-amazonia'] as const
type RegionalTargetId = (typeof regionalTargetIds)[number]
const initialValidation = deriveGlobalValidation(Object.fromEntries(TARGETS.map((target) => [target.id, 'not-detected'])))
const regionTargets = TARGETS.filter((target) => target.type === 'region')
const iconPath = (name: string) => `/assets/ui/icons/${name}`
const regionCopy: Record<string, { name: string; subtitle: string; color: string; icon: string; fact: string; discoveryTitle: string; discoveryBody: string; clue: string }> = {
  'region-caribe': { name: 'CARIBE', subtitle: 'Mar, música y alegría', color: 'caribe', icon: iconPath('caribe.svg'), fact: 'Mar, música y paisajes llenos de vida. ¡Aquí cada rincón tiene su propio ritmo!', discoveryTitle: '¡Pura energía!', discoveryBody: 'Mar, música y paisajes llenos de vida. ¡Aquí cada rincón tiene su propio ritmo!', clue: 'Busca donde el mar, la música y el calor se encuentran.' },
  'region-andina': { name: 'ANDINA', subtitle: 'Montañas y cambios de clima', color: 'andina', icon: iconPath('andes.svg'), fact: 'En las alturas puede hacer frío y, más abajo, el clima cambia por completo. ¡Qué variedad!', discoveryTitle: '¡Un paisaje, mil cambios!', discoveryBody: 'En las alturas puede hacer frío y, más abajo, el clima cambia por completo. ¡Qué variedad!', clue: 'Busca las montañas donde el clima cambia en pocos kilómetros.' },
  'region-pacifica': { name: 'PACÍFICA', subtitle: 'Selva, ríos y biodiversidad', color: 'pacifica', icon: iconPath('pacifico.svg'), fact: 'Selvas, ríos y una biodiversidad extraordinaria. Aquí la vida encuentra miles de formas de abrirse camino.', discoveryTitle: '¡La naturaleza sorprende!', discoveryBody: 'Selvas, ríos y una biodiversidad extraordinaria. Aquí la vida encuentra miles de formas de abrirse camino.', clue: 'Busca la región de selvas, agua y vida junto al océano.' },
  'region-orinoquia': { name: 'ORINOQUÍA', subtitle: 'Llanos y horizonte', color: 'orinoquia', icon: iconPath('orinoquia.svg'), fact: 'Sabanas inmensas, grandes ríos y una cultura llanera llena de música y tradición.', discoveryTitle: '¡Un horizonte sin fin!', discoveryBody: 'Sabanas inmensas, grandes ríos y una cultura llanera llena de música y tradición.', clue: 'Busca los llanos abiertos, los grandes ríos y el horizonte.' },
  'region-amazonia': { name: 'AMAZONÍA', subtitle: 'La gran selva', color: 'amazonia', icon: iconPath('amazonas.svg'), fact: 'Ríos inmensos, especies sorprendentes y pueblos con conocimientos y tradiciones profundamente vinculados a sus territorios.', discoveryTitle: '¡Una maravilla por descubrir!', discoveryBody: 'Ríos inmensos, especies sorprendentes y pueblos con conocimientos y tradiciones profundamente vinculados a sus territorios.', clue: 'Busca la gran selva de ríos inmensos y biodiversidad.' },
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

function CameraGuidanceOverlay({ referenceImage, discoveryOpen, message }: { referenceImage: string; discoveryOpen: boolean; message: string }) {
  return <>
    <div className={`ar-camera-guidance ${discoveryOpen ? 'is-hidden' : ''}`} aria-live="polite">
      <div className="ar-guidance-label"><img src={referenceImage} alt="" /><strong>{message}</strong></div>
      <div className="ar-scanning-frame" aria-hidden="true"><span /><span /><span /><span /><i /></div>
      <div className="ar-scanning-status"><span aria-hidden="true">⌕</span><span>Estamos buscando nuevos lugares...</span></div>
    </div>
  </>
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [regionIndex, setRegionIndex] = useState(0)
  const [foundRegions, setFoundRegions] = useState<TargetId[]>([])
  const [discoveryTargetId, setDiscoveryTargetId] = useState<RegionalTargetId | null>(null)
  const [mapDiscoveryOpen, setMapDiscoveryOpen] = useState(false)
  const [cameraPermissionError, setCameraPermissionError] = useState('')
  const [cameraPermissionBlocked, setCameraPermissionBlocked] = useState(false)
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
    debugApp('target-confirmed-callback', { targetId, screen, mapDiscoveryOpen, discoveryTargetId, regionIndex })
    if (screen === 'challenge' && targetId === 'colombia-completa') { setMapDiscoveryOpen(true); return }
    if (screen !== 'regions' || !currentRegion || targetId !== currentRegion.id) return
    if (foundRegions.includes(targetId)) return
    setFoundRegions((current) => current.includes(targetId) ? current : [...current, targetId])
    setDiscoveryTargetId(targetId as RegionalTargetId)
  }, [currentRegion, foundRegions, screen])
  const continueFromMapDiscovery = () => {
    debugApp('map-discovery-continue', { screen, mapDiscoveryOpen, cameraStillMounted: true })
    setMapDiscoveryOpen(false)
    setRegionIndex(0)
    setCloudTransition('idle')
    setScreen('regions')
  }
  const continueFromDiscovery = () => {
    setDiscoveryTargetId(null)
    if (regionIndex === regionTargets.length - 1) {
      transitionTo('quiz')
      return
    }
    setRegionIndex((current) => current + 1)
  }
  const resetGame = () => { cameraPreviewStream?.getTracks().forEach((track) => track.stop()); setCameraPreviewStream(null); setFoundRegions([]); setDiscoveryTargetId(null); setMapDiscoveryOpen(false); setRegionIndex(0); setQuizLetters(Array(COUNTRY_ANSWER.length).fill('')); setQuizHintCount(0); setQuizMessage(''); setValidation(initialValidation); transitionTo('home') }
  const leaveCameraFor = (nextScreen: Screen) => {
    cameraPreviewStream?.getTracks().forEach((track) => track.stop())
    setCameraPreviewStream(null)
    setMapDiscoveryOpen(false)
    setDiscoveryTargetId(null)
    transitionTo(nextScreen)
  }
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
      leaveCameraFor('finale')
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
  const activeTargets: TargetId[] = screen === 'challenge' ? ['colombia-completa'] : screen === 'regions' && currentRegion ? [currentRegion.id] : []
  const allArTargetIds: TargetId[] = ['colombia-completa', ...regionalTargetIds]
  const isArScreen = screen === 'challenge' || screen === 'regions' || screen === 'quiz' || screen === 'complete'
  const isRegionSearch = screen === 'regions' && Boolean(currentRegion && currentCopy)
  const arDiscoveryOpen = mapDiscoveryOpen || Boolean(discoveryTargetId) || screen === 'quiz' || screen === 'complete'
  const discoveryCopy = discoveryTargetId ? regionCopy[discoveryTargetId] : null

  return <div className={`game-shell ${isArScreen ? 'ar-game-shell' : ''}`}>
    <div className={`cloud-transition ${cloudTransition}`} aria-hidden="true"><div className="cloud-curtain"><i className="cloud-lobe cloud-lobe-one" /><i className="cloud-lobe cloud-lobe-two" /><i className="cloud-lobe cloud-lobe-three" /><i className="cloud-lobe cloud-lobe-four" /></div><div className="cloud-bank cloud-bank-one" /><div className="cloud-bank cloud-bank-two" /><div className="cloud-bank cloud-bank-three" /><div className="cloud-bank cloud-bank-extra cloud-bank-four" /><div className="cloud-bank cloud-bank-extra cloud-bank-five" /><div className="cloud-bank cloud-bank-extra cloud-bank-six" /><div className="cloud-bank cloud-bank-extra cloud-bank-seven" /><div className="cloud-bank cloud-bank-extra cloud-bank-eight" /></div>
    <main className={`game-main ${isArScreen ? 'ar-game-main' : ''}`}>
      {screen === 'home' && <section className="game-screen home-screen" aria-labelledby="game-title"><div className="home-copy"><div className="game-kicker">¡UNA AVENTURA PARA TODOS!</div><h1 id="game-title">¡HAY UN MUNDO <em>POR DESCUBRIR!</em></h1><p className="game-lead strong-lead volume-notice"><img className="inline-icon volume-notice-icon" src={iconPath('volumen.svg')} alt="" /> Para disfrutar mejor, activa y sube el volumen.</p><button className="game-primary" onClick={() => transitionTo('map')}>¡JUGAR AHORA! <img className="button-icon" src={iconPath('celebracion-final.svg')} alt="" /></button><p className="home-hint"><img className="inline-icon" src={iconPath('flecha-continuar.svg')} alt="" /> Buscá este mapa por la UAP y descubre sus secretos</p></div><div className="home-map"><div className="map-rays" /><img src={whiteMap} alt="Silueta del mapa" /><img className="map-searcher" src={iconPath('buscar2.svg')} alt="" /><span className="map-sticker">¿DÓNDE ESTÁ? </span></div></section>}
      {screen === 'map' && <section className="game-screen mission-screen" aria-labelledby="map-title">
        <button className="back-button" onClick={() => transitionTo('home')}>← Volver</button>
        <div className="game-kicker">ANTES DE EMPEZAR</div>
        <h1 id="map-title">¿LISTO PARA EL <em>RETO?</em></h1>
        <p className="game-lead">¡A BUSCAR!</p>
        <div className="camera-permission-card">
          <img className="camera-permission-icon" src={iconPath('activar-permiso-camara.svg')} alt="" />
          <div><strong>PERMISO DE CÁMARA NECESARIO</strong><p>Activa la cámara para detectar el mapa y poder jugar.</p></div>
          <button className="game-primary" onClick={requestCameraPermission}>{cameraPermissionBlocked ? 'Ya permití la cámara: intentar de nuevo →' : 'Activar cámara para jugar →'}</button>
        </div>
        {cameraPermissionError && <p className="camera-permission-error" role="alert">{cameraPermissionError}</p>}
        <div className="setup-stack">
          <div className={`setup-preview ${cameraPreviewStream ? 'camera-active' : ''}`}>
            {cameraPreviewStream ? <><video ref={cameraPreviewRef} className="camera-preview-video" autoPlay muted playsInline aria-label="Vista previa de la cámara" /><img className="camera-preview-label-icon" src={iconPath('camara-activa.svg')} alt="Cámara activada" /><span className="camera-preview-label">CÁMARA ACTIVADA</span><b>Preparando el reto…</b></> : <><img className="camera-placeholder-icon" src={iconPath('camara-desactivada.svg')} alt="Cámara desactivada" /><strong>Tu cámara aparecerá aquí</strong><small>Actívala para comenzar</small></>}
          </div>
          <div className="setup-card"><span><img src={iconPath('camara-activa.svg')} alt="" /> <b>Apunta la cámara al mapa.</b></span><span><img src={iconPath('pieza-rompecabezas.svg')} alt="" /> <b>Pon las piezas dentro del marco.</b></span><span><img src={iconPath('confirmacion.svg')} alt="" /> <b>¡Todo listo para jugar!</b></span></div>
          <p className="pale-note"><img src={iconPath('candado.svg')} alt="" /> Es seguro: la cámara solo se usa para reconocer el mapa. No guardamos imágenes ni datos personales.</p>
        </div>
      </section>}
      {isArScreen && <section className={`game-screen mission-screen ar-fullscreen-screen ${arDiscoveryOpen ? 'discovery-open' : ''}`} aria-labelledby={isRegionSearch ? 'region-title' : 'challenge-title'}>
        <h1 id={isRegionSearch ? 'region-title' : 'challenge-title'} className="sr-only">{isRegionSearch ? `¡Encontremos la ${regionOrdinals[regionIndex].toLowerCase()} región!` : '¡Encuentra este mapa!'}</h1>
        <ArExperience activeTargetIds={activeTargets} anchorTargetIds={allArTargetIds} cameraStream={cameraPreviewStream ?? undefined} onTargetFound={(targetId) => { debugApp('target-found-callback', { targetId, screen }) }} onTargetLost={(targetId) => { debugApp('target-lost-callback', { targetId, screen }) }} onTargetConfirmed={handleTargetConfirmed} onValidationChange={updateValidation} heading="" description="" confirmationDurationMs={2000} cameraOverlay={null} anchoredScan={screen === 'challenge' || isRegionSearch} anchoredScanImage={isRegionSearch && currentRegion ? regionReferenceAssets[currentRegion.id] : '/assets/ui/white-map.png'} autoStart showDetails={false} />
        {(screen === 'challenge' || screen === 'regions') && <div className="ar-top-overlay"><RegionProgressOverlay foundRegions={foundRegions} /></div>}
        <CameraGuidanceOverlay referenceImage={isRegionSearch && currentRegion ? regionReferenceAssets[currentRegion.id] : whiteMap} discoveryOpen={arDiscoveryOpen} message={screen === 'challenge' ? '¡ACERCA TU CÁMARA AL MAPA!' : currentCopy?.clue ?? 'Estamos preparando el próximo descubrimiento.'} />
        {isRegionSearch && currentRegion && <div className="ar-region-guide-overlay">
          <img src={regionReferenceAssets[currentRegion.id]} alt="Silueta de la región que debes ubicar" />
          <div><strong>UBICA ESTA SILUETA</strong><span>EN EL MAPA</span></div>
        </div>}
        {mapDiscoveryOpen && <DiscoveryExperience map onContinue={continueFromMapDiscovery} />}
        {discoveryCopy && <DiscoveryExperience copy={discoveryCopy} onContinue={continueFromDiscovery} />}
        {screen === 'quiz' && <aside className="ar-discovery-card ar-quiz-card" aria-live="polite"><div className="ar-discovery-kicker">¡5 REGIONES DESCUBIERTAS! <img className="inline-icon" src={iconPath('estrella-logro.svg')} alt="" /></div><h2>¿CÓMO SE LLAMA ESTE PAÍS?</h2><p>Cinco regiones extraordinarias. Una tierra llena de vida, historias y contrastes.</p><div className="quiz-letters" aria-label="Escribe el nombre del país">{COUNTRY_ANSWER.split('').map((_, index) => <input key={index} ref={(element) => { quizInputRefs.current[index] = element }} className={index < quizHintCount ? 'hint-letter' : ''} aria-label={`Letra ${index + 1} de 7`} maxLength={1} readOnly={index < quizHintCount} value={quizLetters[index]} onChange={(event) => handleQuizLetterChange(index, event.target.value)} onKeyDown={(event) => handleQuizKeyDown(index, event)} autoFocus={index === quizHintCount} />)}</div>{quizMessage && <p className="quiz-message" role="status"><img className="inline-icon" src={iconPath('pista.svg')} alt="" /> {quizMessage}</p>}<button className="game-primary" onClick={checkCountryAnswer}>COMPROBAR <img className="button-icon" src={iconPath('flecha-continuar.svg')} alt="" /></button></aside>}
        {screen === 'complete' && <aside className="ar-discovery-card ar-final-card" aria-live="polite"><div className="ar-discovery-kicker">¡QUÉ GRAN EQUIPO! <img className="inline-icon" src={iconPath('celebracion-final.svg')} alt="" /></div><img src={whiteMap} alt="Mapa completo de Colombia" /><h2>¡LO DESCUBRISTE!</h2><p><strong>¡ESTO ES COLOMBIA!</strong><br />Cinco regiones extraordinarias. Una tierra llena de vida, historias y contrastes.</p><button className="game-primary" onClick={resetGame}>¡DESCUBRIR OTRA VEZ! <img className="button-icon" src={iconPath('repetir.svg')} alt="" /></button></aside>}
        <button className="ar-back-button" aria-label={isRegionSearch ? 'Volver a buscar el mapa completo' : 'Volver a los permisos de cámara'} onClick={() => { if (screen === 'quiz' || screen === 'complete') { transitionTo('regions'); return } if (isRegionSearch) { transitionTo('challenge'); return } transitionTo('map') }}><img src={iconPath('flecha-atras.svg')} alt="" /></button>
      </section>}
      {screen === 'regionInfo' && currentRegion && currentCopy && <section className="game-screen discovery-screen" aria-labelledby="region-info-title"><div className={`region-info-map ${currentCopy.color}`}><img src={regionReferenceAssets[currentRegion.id]} alt={`Mapa de la región ${currentCopy.name}`} /></div><div className="game-kicker">¡REGIÓN ENCONTRADA! <img className="inline-icon" src={iconPath('region-detectada.svg')} alt="" /></div><p className="game-lead strong-lead">Descubriste la región {regionIndex + 1} de 5</p><h1 id="region-info-title"><em>{currentCopy.name} <img className="title-icon" src={currentCopy.icon} alt="" /></em></h1><p className="region-fact">{currentCopy.fact}</p><p className="region-subtitle">{currentCopy.subtitle}</p><button className="game-primary" onClick={continueFromRegionInfo}>{regionIndex === regionTargets.length - 1 ? '¡VER RESULTADO FINAL!' : '¡BUSCAR LA SIGUIENTE REGIÓN!'} <img className="button-icon" src={iconPath('flecha-continuar.svg')} alt="" /></button></section>}
      {screen === 'finale' && <FinalExperience onPlay={resetGame} onExploreMap={() => leaveCameraFor('map')} />}
    </main>
  </div>
}
