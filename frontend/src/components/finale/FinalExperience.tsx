import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { finaleDiscoveries, finaleHeroPhoto, finaleRegions, type FinaleDiscovery, type FinaleImageAsset, type FinaleRegion } from './finaleContent'
import './finale.css'

function PhotoFrame({ asset, silhouette, className = '' }: { asset: FinaleImageAsset; silhouette?: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const showPhoto = asset.available && !failed
  return <div className={`finale-photo-frame ${showPhoto ? 'has-photo' : 'is-placeholder'} ${className}`} style={{ aspectRatio: asset.ratio }}>
    {showPhoto ? <img src={asset.src} alt={asset.alt} loading="lazy" onError={() => setFailed(true)} /> : <>
      {silhouette && <img className="finale-placeholder-silhouette" src={silhouette} alt="" aria-hidden="true" />}
      <span className="finale-placeholder-label">{asset.placeholder ?? 'Fotografía por añadir'}</span>
    </>}
  </div>
}

function PhotoCarousel({ photos }: { photos: FinaleImageAsset[] }) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const photo = photos[photoIndex]
  const changePhoto = (direction: number) => setPhotoIndex((current) => (current + direction + photos.length) % photos.length)
  return <div className="finale-photo-carousel"><PhotoFrame asset={photo} className="finale-carousel-photo" /><div className="finale-carousel-copy"><span>{photoIndex + 1} / {photos.length}</span><p>{photo.caption ?? photo.alt}</p><div className="finale-carousel-controls"><button type="button" aria-label="Foto anterior" onClick={() => changePhoto(-1)}>←</button><button type="button" aria-label="Foto siguiente" onClick={() => changePhoto(1)}>→</button></div></div></div>
}

function RegionStory({ region, index, onOpen }: { region: FinaleRegion; index: number; onOpen: () => void }) {
  return <article className={`finale-story finale-story-${index + 1}`} style={{ '--region-accent': region.accent } as CSSProperties}>
    <div className="finale-flip-card"><button className="finale-flip-face finale-flip-front" type="button" onClick={onOpen}><PhotoFrame asset={region.photos[0]} silhouette={region.silhouette} className="finale-region-photo" /><span className="finale-flip-shade" /><span className="finale-flip-hint">Toca para ampliar ↗</span><div className="finale-story-copy"><span className="finale-story-index">0{index + 1} / 05</span><h3>{region.name} <img className="story-icon" src={region.icon} alt="" /></h3><strong>{region.title}</strong><p>{region.description}</p></div></button></div>
  </article>
}

function DiscoveryFlipCard({ discovery, index, onOpen }: { discovery: FinaleDiscovery; index: number; onOpen: () => void }) {
  return <article id={`discovery-${index}`} className="finale-discovery-card" style={{ '--discovery-accent': discovery.accent } as CSSProperties}>
    <div className="finale-flip-card"><button className="finale-flip-face finale-flip-front" type="button" onClick={onOpen}><div className="finale-discovery-background"><PhotoFrame asset={discovery.photos[0]} className="finale-discovery-photo" /></div><span className="finale-flip-shade" /><span className="finale-discovery-top"><img src={discovery.icon} alt="" /><small>{discovery.teaser}</small></span><strong>{discovery.title}</strong><span className="finale-discovery-detail">Abrir descubrimiento ↗</span></button></div>
  </article>
}

function DiscoveryModal({ region, discovery, onClose }: { region?: FinaleRegion; discovery?: FinaleDiscovery; onClose: () => void }) {
  const title = region?.name ?? discovery?.title ?? ''
  const subtitle = region?.title ?? discovery?.teaser ?? ''
  const description = region?.description ?? discovery?.detail ?? ''
  const photos = region?.photos ?? discovery?.photos ?? []
  const icon = region?.icon ?? discovery?.icon
  return <div className="finale-modal-backdrop" role="presentation" onClick={onClose}><section className="finale-modal" role="dialog" aria-modal="true" aria-labelledby="finale-modal-title" onClick={(event) => event.stopPropagation()}><button className="finale-modal-close" type="button" onClick={onClose} aria-label="Cerrar galería">×</button><div className="finale-modal-heading"><span>{region ? 'REGIÓN DESCUBIERTA' : 'CUADERNO DE VIAJE'}</span><h2 id="finale-modal-title">{title} {icon && <img src={icon} alt="" />}</h2><strong>{subtitle}</strong><p>{description}</p></div><PhotoCarousel photos={photos} /></section></div>
}

export function FinalExperience({ onExploreMap }: { onExploreMap: () => void }) {
  const [revealReady, setRevealReady] = useState(false)
  const [skippedReveal, setSkippedReveal] = useState(false)
  const [modal, setModal] = useState<{ region?: FinaleRegion; discovery?: FinaleDiscovery } | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealReady(true), 800)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!modal) return
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setModal(null) }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', handleKeyDown) }
  }, [modal])

  return <div className={`finale-page ${revealReady || skippedReveal ? 'finale-ready' : ''}`}>
    <section className="finale-reveal" aria-labelledby="finale-title">
      <div className="finale-reveal-backdrop"><PhotoFrame asset={finaleHeroPhoto} className="finale-hero-photo" /></div>
      <div className="finale-reveal-shade" />
      <div className="finale-reveal-copy"><span className="finale-kicker">VUELA POR COLOMBIA</span><p className="finale-overline">Cinco regiones. Miles de mundos.</p><h1 id="finale-title">¡ERA<br /><em>COLOMBIA!</em></h1><p className="finale-intro">El mapa que encontraste acaba de abrirse.</p><button className="finale-continue" onClick={() => document.getElementById('finale-regions')?.scrollIntoView({ behavior: 'smooth' })}>Explorar el mapa <span aria-hidden="true">↓</span></button></div>
      {!revealReady && !skippedReveal && <button className="finale-skip" onClick={() => setSkippedReveal(true)}>Saltar animación</button>}
    </section>

    <section className="finale-regions" id="finale-regions" aria-labelledby="regions-title"><div className="finale-section-heading"><span>EL MAPA SE ABRE</span><h2 id="regions-title">Cinco formas<br /><em>de vivir Colombia.</em></h2><p>Elige una región y sigue la pista.</p></div><div className="finale-story-grid">{finaleRegions.map((region, index) => <RegionStory key={region.id} region={region} index={index} onOpen={() => setModal({ region })} />)}</div></section>

    <section className="finale-discoveries" aria-labelledby="discoveries-title"><div className="finale-section-heading"><span>CUADERNO DE VIAJE</span><h2 id="discoveries-title">Sigue la<br /><em>curiosidad.</em></h2></div><div className="finale-discovery-grid">{finaleDiscoveries.map((discovery, index) => <DiscoveryFlipCard key={discovery.title} discovery={discovery} index={index} onOpen={() => setModal({ discovery })} />)}</div></section>

    {modal && <DiscoveryModal region={modal.region} discovery={modal.discovery} onClose={() => setModal(null)} />}

    <section className="finale-invitation" aria-labelledby="invitation-title"><img src="/assets/ui/white-map.png" alt="" aria-hidden="true" /><span className="finale-kicker">LA AVENTURA SIGUE</span><h2 id="invitation-title">Ya viste el mapa.<br /><em>Ahora vuélalo.</em></h2><p>Tu próxima misión.</p><div className="finale-actions"><button className="game-primary" onClick={() => window.open('https://vuela-por-colombia.vercel.app', '_blank', 'noopener,noreferrer')}>¡JUGAR AHORA! →</button><button className="finale-secondary" onClick={onExploreMap}>Volver al mapa</button></div></section>
  </div>
}
