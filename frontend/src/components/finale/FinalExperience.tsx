import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { finaleDiscoveries, finaleHeroPhoto, finaleRegions, type FinaleImageAsset, type FinaleRegion } from './finaleContent'
import './finale.css'

function PhotoFrame({ asset, silhouette, className = '' }: { asset: FinaleImageAsset; silhouette?: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const showPhoto = asset.available && !failed
  return <div className={`finale-photo-frame ${showPhoto ? 'has-photo' : 'is-placeholder'} ${className}`} style={{ aspectRatio: asset.ratio }}>
    {showPhoto ? <img src={asset.src} alt={asset.alt} loading="lazy" onError={() => setFailed(true)} /> : <>
      {silhouette && <img className="finale-placeholder-silhouette" src={silhouette} alt="" aria-hidden="true" />}
      <span className="finale-placeholder-label">Fotografía por añadir</span>
    </>}
  </div>
}

function RegionStory({ region, index }: { region: FinaleRegion; index: number }) {
  return <article className={`finale-story finale-story-${index + 1}`} style={{ '--region-accent': region.accent } as CSSProperties}>
    <PhotoFrame asset={region.photo} silhouette={region.silhouette} className="finale-region-photo" />
    <div className="finale-story-copy"><span className="finale-story-index">0{index + 1} / 05</span><h3>{region.name} <span>{region.emoji}</span></h3><strong>{region.title}</strong><p>{region.description}</p><button className="finale-story-action" type="button" onClick={() => document.getElementById(`discovery-${region.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>Descubrir <span aria-hidden="true">↗</span></button></div>
  </article>
}

export function FinalExperience({ onPlay, onExploreMap }: { onPlay: () => void; onExploreMap: () => void }) {
  const [revealReady, setRevealReady] = useState(false)
  const [skippedReveal, setSkippedReveal] = useState(false)
  const [openDiscovery, setOpenDiscovery] = useState<number | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealReady(true), 800)
    return () => window.clearTimeout(timer)
  }, [])

  return <div className={`finale-page ${revealReady || skippedReveal ? 'finale-ready' : ''}`}>
    <section className="finale-reveal" aria-labelledby="finale-title">
      <div className="finale-reveal-backdrop"><PhotoFrame asset={finaleHeroPhoto} className="finale-hero-photo" /></div>
      <div className="finale-reveal-shade" />
      <div className="finale-reveal-copy"><span className="finale-kicker">VUELA POR COLOMBIA</span><p className="finale-overline">Cinco regiones. Miles de mundos.</p><h1 id="finale-title">¡ERA<br /><em>COLOMBIA!</em></h1><p className="finale-intro">El mapa que encontraste acaba de abrirse.</p><button className="finale-continue" onClick={() => document.getElementById('finale-regions')?.scrollIntoView({ behavior: 'smooth' })}>Explorar el mapa <span aria-hidden="true">↓</span></button></div>
      <div className="finale-map-stage" aria-hidden="true"><div className="finale-map-aura" /><img src="/assets/ui/white-map.png" alt="" /><div className="finale-particles"><i /><i /><i /><i /><i /><i /><i /><i /></div></div>
      {!revealReady && !skippedReveal && <button className="finale-skip" onClick={() => setSkippedReveal(true)}>Saltar animación</button>}
    </section>

    <section className="finale-regions" id="finale-regions" aria-labelledby="regions-title"><div className="finale-section-heading"><span>EL MAPA SE ABRE</span><h2 id="regions-title">Cinco formas<br /><em>de vivir Colombia.</em></h2><p>Elige una región y sigue la pista.</p></div><div className="finale-story-grid">{finaleRegions.map((region, index) => <RegionStory key={region.id} region={region} index={index} />)}</div></section>

    <section className="finale-discoveries" aria-labelledby="discoveries-title"><div className="finale-section-heading"><span>CUADERNO DE VIAJE</span><h2 id="discoveries-title">Sigue la<br /><em>curiosidad.</em></h2></div><div className="finale-discovery-grid">{finaleDiscoveries.map((discovery, index) => <button id={`discovery-${finaleRegions[index].id}`} className={`finale-discovery-card ${openDiscovery === index ? 'is-open' : ''}`} style={{ '--discovery-accent': discovery.accent } as CSSProperties} key={discovery.title} onClick={() => setOpenDiscovery(openDiscovery === index ? null : index)} aria-expanded={openDiscovery === index}><span className="finale-discovery-top"><span>{discovery.emoji}</span><small>{discovery.teaser}</small></span><strong>{discovery.title}</strong><span className="finale-discovery-detail">{openDiscovery === index ? discovery.detail : 'Abrir descubrimiento →'}</span></button>)}</div></section>

    <section className="finale-invitation" aria-labelledby="invitation-title"><img src="/assets/ui/white-map.png" alt="" aria-hidden="true" /><span className="finale-kicker">LA AVENTURA SIGUE</span><h2 id="invitation-title">Ya viste el mapa.<br /><em>Ahora vívelo.</em></h2><p>Tu próxima misión empieza aquí.</p><div className="finale-actions"><button className="game-primary" onClick={onPlay}>¡JUGAR AHORA! →</button><button className="finale-secondary" onClick={onExploreMap}>Volver al mapa</button></div></section>
  </div>
}
