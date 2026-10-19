import { useCallback, useState } from 'react'
import { ArExperience } from './components/ar/ArExperience'
import { TARGETS, type TargetId } from './types/api'
import { deriveGlobalValidation, type GlobalValidationResult } from './components/ar/globalValidation'

type Screen = 'home' | 'map' | 'challenge' | 'regions' | 'complete'
const initialValidation = deriveGlobalValidation(Object.fromEntries(TARGETS.map((target) => [target.id, 'not-detected'])))
const regionTargets = TARGETS.filter((target) => target.type === 'region')
const regionCopy: Record<string, { name: string; subtitle: string; color: string; emoji: string }> = {
  'region-caribe': { name: 'CARIBE', subtitle: 'Mar, música y alegría', color: 'caribe', emoji: '🌊' },
  'region-andina': { name: 'ANDINA', subtitle: 'Montañas y cultura', color: 'andina', emoji: '⛰️' },
  'region-pacifica': { name: 'PACÍFICA', subtitle: 'Selva y océano', color: 'pacifica', emoji: '🐋' },
  'region-orinoquia': { name: 'ORINOQUÍA', subtitle: 'Llanos y horizonte', color: 'orinoquia', emoji: '🦜' },
  'region-amazonia': { name: 'AMAZONÍA', subtitle: 'Naturaleza sin límites', color: 'amazonia', emoji: '🌿' },
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [regionIndex, setRegionIndex] = useState(0)
  const [foundRegions, setFoundRegions] = useState<TargetId[]>([])
  const [cameraPermissionError, setCameraPermissionError] = useState('')
  const [, setValidation] = useState<GlobalValidationResult>(initialValidation)
  const currentRegion = regionTargets[regionIndex]
  const currentCopy = currentRegion ? regionCopy[currentRegion.id] : null
  const updateValidation = useCallback((next: GlobalValidationResult) => setValidation((current) => {
    const sameRegions = current.confirmedRegions.length === next.confirmedRegions.length && current.confirmedRegions.every((id) => next.confirmedRegions.includes(id))
    return current.state === next.state && current.fullMapConfirmed === next.fullMapConfirmed && sameRegions ? current : next
  }), [])
  const handleTargetConfirmed = useCallback((targetId: TargetId) => {
    if (screen === 'challenge' && targetId === 'colombia-completa') { setRegionIndex(0); setScreen('regions'); return }
    if (screen !== 'regions' || !currentRegion || targetId !== currentRegion.id) return
    setFoundRegions((current) => current.includes(targetId) ? current : [...current, targetId])
    if (regionIndex === regionTargets.length - 1) setScreen('complete')
    else setRegionIndex((current) => current + 1)
  }, [currentRegion, regionIndex, screen])
  const resetGame = () => { setFoundRegions([]); setRegionIndex(0); setValidation(initialValidation); setScreen('home') }
  const requestCameraPermission = async () => {
    setCameraPermissionError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraPermissionError('Tu navegador no permite usar la cámara aquí.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((track) => track.stop())
      setScreen('challenge')
    } catch (error) {
      setCameraPermissionError(error instanceof DOMException && error.name === 'NotAllowedError' ? 'Debes permitir la cámara para poder jugar.' : 'No pudimos activar la cámara. Revisa los permisos e inténtalo de nuevo.')
    }
  }
  const activeTargets = screen === 'challenge' ? ['colombia-completa' as TargetId] : screen === 'regions' && currentRegion ? [currentRegion.id] : []

  return <div className="game-shell">
    <main className="game-main">
      {screen === 'home' && <section className="game-screen home-screen" aria-labelledby="game-title"><div className="home-copy"><div className="game-kicker">¡UNA AVENTURA PARA TODOS!</div><h1 id="game-title">¡HAY UN MUNDO <em>POR DESCUBRIR!</em></h1><p className="game-lead strong-lead">🔊 Para disfrutar mejor, activa y sube el volumen.</p><button className="game-primary" onClick={() => setScreen('map')}>¡JUGAR AHORA! <span>🎉</span></button><p className="home-hint"><span>➜</span> Buscá este mapa por la UAP y descubre sus secretos</p></div><div className="home-map"><div className="map-rays" /><img src="/assets/ui/white-map.png" alt="Mapa de Colombia" /><span className="map-searcher" aria-hidden="true">🔍</span><span className="map-sticker">¿DÓNDE ESTÁ? </span></div></section>}
      {screen === 'map' && <section className="game-screen mission-screen" aria-labelledby="map-title">
        <button className="back-button" onClick={() => setScreen('home')}>← Volver</button>
        <div className="game-kicker">ANTES DE EMPEZAR</div>
        <h1 id="map-title">¿LISTO PARA EL <em>RETO?</em></h1>
        <p className="game-lead">¡ARMA EL MAPA!</p>
        <div className="camera-permission-card">
          <span className="camera-permission-icon" aria-hidden="true">📸</span>
          <div><strong>PERMISO DE CÁMARA NECESARIO</strong><p>Activa la cámara para detectar el mapa y poder jugar.</p></div>
          <button className="game-primary" onClick={requestCameraPermission}>Activar cámara para jugar →</button>
        </div>
        {cameraPermissionError && <p className="camera-permission-error" role="alert">{cameraPermissionError}</p>}
        <div className="setup-stack">
          <div className="setup-preview"><span>BUSCA ESTE MAPA</span><img src="/assets/ui/white-map.png" alt="Mapa dentro del marco" /><span className="map-searcher" aria-hidden="true">🔍</span><b>Mapa dentro del marco ✓</b></div>
          <div className="setup-card"><span>📸 <b>Apunta la cámara al mapa.</b></span><span>🧩 <b>Pon las piezas dentro del marco.</b></span><span>✅ <b>¡Todo listo para jugar!</b></span></div>
          <p className="pale-note">🔒 Es seguro: la cámara solo se usa para reconocer el mapa. No guardamos imágenes ni datos personales.</p>
        </div>
      </section>}
      {screen === 'challenge' && <section className="game-screen mission-screen" aria-labelledby="challenge-title"><button className="back-button" onClick={() => setScreen('map')}>← Volver</button><div className="game-kicker">EL GRAN RETO</div><h1 id="challenge-title">¡ARMA EL <em>MAPA!</em></h1><p className="game-lead">¡ENCUENTRA LAS 5 REGIONES! ⛰️</p><ArExperience activeTargetIds={activeTargets} onTargetConfirmed={handleTargetConfirmed} onValidationChange={updateValidation} heading="Apunta al mapa" description="Activa la cámara para comenzar." startLabel="Activar cámara" showDetails={false} /></section>}
      {screen === 'regions' && currentRegion && currentCopy && <section className="game-screen mission-screen" aria-labelledby="region-title"><div className="game-kicker">EL GRAN RETO</div><div className="region-progress"><span style={{ width: `${(foundRegions.length / 5) * 100}%` }} /></div><h1 id="region-title">ENCUENTRA <em>{currentCopy.name} {currentCopy.emoji}</em></h1><p className="game-lead strong-lead">REGIÓN {regionIndex + 1} DE 5</p><div className={`current-region-card ${currentCopy.color}`}><img src={`/assets/targets/${({ 'region-caribe': 'caribean-region', 'region-andina': 'andes-region', 'region-pacifica': 'pacific-region', 'region-orinoquia': 'orinoquia-region', 'region-amazonia': 'amazonas-region' } as Record<string, string>)[currentRegion.id]}.png`} alt="" /><div><strong>{currentCopy.name} {currentCopy.emoji}</strong><span>{currentCopy.subtitle}</span></div></div><ArExperience activeTargetIds={activeTargets} onTargetConfirmed={handleTargetConfirmed} onValidationChange={updateValidation} heading="Apunta la cámara" description="Mantén la región dentro del marco." startLabel="Activar cámara" showDetails={false} /></section>}
      {screen === 'complete' && <section className="game-screen complete-screen" aria-labelledby="complete-title"><div className="game-kicker">¡QUÉ GRAN EQUIPO! ✨</div><div className="complete-map"><img src="/assets/ui/white-map.png" alt="Mapa completo de Colombia" /><span>🇨🇴</span></div><h1 id="complete-title">¡COLOMBIA <em>COMPLETA!</em> 🇨🇴</h1><p className="game-lead strong-lead">¡LO LOGRASTE!</p><button className="game-primary" onClick={resetGame}>¡DESCUBRIR OTRA VEZ! <span>🎉</span></button></section>}
    </main>
  </div>
}
