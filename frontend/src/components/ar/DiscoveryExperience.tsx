import { useRef, useState } from 'react'
import whiteMap from '../../assets-white-map.png'

type RegionCopy = {
  name: string
  subtitle: string
  icon: string
  discoveryTitle: string
  discoveryBody: string
}

type DiscoveryExperienceProps = {
  copy?: RegionCopy
  onContinue: () => void
  map?: boolean
}

type Slide = {
  eyebrow: string
  title: string
  body: string
  image?: string
  video?: string
  alt?: string
  pending?: string
}

const gallery = (name: string) => `/assets/finale/gallery/${name}.webp`

const regionalSlides: Record<string, Slide[]> = {
  CARIBE: [
    { eyebrow: 'PAISAJE', title: 'El sol tiene otro ritmo', body: 'Mar, ciudades llenas de color y paisajes que invitan a quedarse un rato más.', image: gallery('foto-caribe'), alt: 'Paisaje caribeño de Colombia' },
    { eyebrow: 'CULTURA', title: 'Una región que se mueve', body: 'La música, la fiesta y las tradiciones hacen que cada encuentro tenga su propio pulso.', image: gallery('foto-baile-fiesta'), alt: 'Danza festiva colombiana' },
    { eyebrow: 'SABORES', title: 'Sabores del territorio', body: 'Aquí falta una fotografía para completar esta postal gastronómica.', pending: 'Añadir fotografía de sabores y cocina del Caribe colombiano' },
    { eyebrow: 'VIDA', title: 'Entre mar y ciudad', body: 'Un último vistazo para seguir la pista de la diversidad del Caribe.', image: gallery('foto-cartagena'), alt: 'Calle colorida de Cartagena' },
  ],
  ANDINA: [
    { eyebrow: 'PAISAJE', title: 'Montañas que esconden mundos', body: 'Valles, alturas y cambios de clima se encuentran en una misma región.', image: gallery('foto-andes'), alt: 'Paisaje montañoso de los Andes colombianos' },
    { eyebrow: 'TERRITORIO', title: 'La altura cambia la mirada', body: 'Las montañas dibujan caminos, pueblos y paisajes llenos de historias.', image: gallery('foto-valle-cocora'), alt: 'Palmas de cera en el Valle del Cocora' },
    { eyebrow: 'CIUDADES', title: 'Historias entre calles', body: 'La vida andina también se descubre caminando por sus ciudades y pueblos.', image: gallery('foto-antioquia'), alt: 'Paisaje urbano y montañoso de Antioquia' },
    { eyebrow: 'NATURALEZA', title: 'Un paisaje para explorar', body: 'Cada cambio de altura abre una nueva pista del territorio.', image: gallery('foto-piedra-penol'), alt: 'Paisaje de Piedra del Peñol' },
  ],
  PACÍFICA: [
    { eyebrow: 'PAISAJE', title: 'Un mundo lleno de vida', body: 'Selva, ríos y un océano extraordinario forman un paisaje en movimiento.', image: gallery('foto-pacifico'), alt: 'Paisaje de la región Pacífica' },
    { eyebrow: 'BIODIVERSIDAD', title: 'Vida por descubrir', body: 'Aquí falta una fotografía para mostrar de cerca la biodiversidad de esta región.', pending: 'Añadir fotografía de fauna o flora de la región Pacífica' },
    { eyebrow: 'CULTURA', title: 'Ritmos junto al océano', body: 'La cultura se expresa en la música, la celebración y las formas de encontrarse.', image: gallery('foto-fiesta-colombia'), alt: 'Celebración cultural colombiana' },
    { eyebrow: 'SABORES', title: 'Una postal pendiente', body: 'Aquí falta una fotografía para completar la historia de sus sabores.', pending: 'Añadir fotografía de cocina o ingredientes del Pacífico colombiano' },
  ],
  ORINOQUÍA: [
    { eyebrow: 'PAISAJE', title: 'Hasta donde alcanza la mirada', body: 'Llanuras, ríos y horizonte abierto construyen una sensación de amplitud.', image: gallery('foto-orinoquia'), alt: 'Paisaje abierto de la Orinoquía' },
    { eyebrow: 'HORIZONTE', title: 'El cielo también cuenta', body: 'La luz cambia el paisaje y revela nuevas formas de recorrerlo.', image: gallery('foto-atardecer'), alt: 'Atardecer sobre un paisaje colombiano' },
    { eyebrow: 'CULTURA', title: 'Tradición que suena', body: 'La música y las tradiciones llaneras son otra forma de orientarse en el territorio.', image: gallery('foto-baile'), alt: 'Presentación de baile tradicional colombiano' },
    { eyebrow: 'SABORES', title: 'Una postal pendiente', body: 'Aquí falta una fotografía para completar la historia de sus sabores.', pending: 'Añadir fotografía de cocina o ingredientes de la Orinoquía' },
  ],
  AMAZONÍA: [
    { eyebrow: 'PAISAJE', title: 'Los secretos de la gran selva', body: 'Ríos inmensos, especies sorprendentes y una diversidad que se descubre paso a paso.', image: gallery('foto-amazonas'), alt: 'Paisaje de la Amazonía colombiana' },
    { eyebrow: 'BIODIVERSIDAD', title: 'Una vida extraordinaria', body: 'Aquí falta una fotografía para mostrar una especie o ecosistema de la Amazonía.', pending: 'Añadir fotografía de fauna o flora amazónica' },
    { eyebrow: 'TERRITORIO', title: 'Conocimientos del territorio', body: 'Los pueblos y sus tradiciones están profundamente vinculados con la selva y sus ríos.', pending: 'Añadir fotografía de comunidades y conocimientos amazónicos' },
    { eyebrow: 'CUIDADO', title: 'La aventura continúa', body: 'Aquí falta una fotografía que invite a proteger este territorio extraordinario.', pending: 'Añadir fotografía sobre conservación de la Amazonía' },
  ],
}

const mapSlides: Slide[] = [
  { eyebrow: 'PRIMERA PISTA', title: 'Algo acaba de aparecer', body: 'Montañas, selvas, llanuras y costas… ¿qué secretos esconderá este lugar?', video: '/assets/map-discovered/map-approach-lite.webp', alt: 'Animación dorada del mapa detectado' },
  { eyebrow: 'SIGUE LA PISTA', title: 'Hay más por investigar', body: 'Acabamos de encontrar una pista. Exploremos más de cerca.', image: '/assets/map-discovered/map-contour.webp', alt: 'Detalle luminoso del mapa detectado' },
]

function SlideVisual({ slide, mapSlide }: { slide: Slide; mapSlide: boolean }) {
  if (slide.pending) return <div className="ar-discovery-visual ar-discovery-pending"><span>IMAGEN PENDIENTE</span><small>{slide.pending}</small></div>
  if (mapSlide && slide.video) return <div className="ar-discovery-visual ar-discovery-map-media"><img src={slide.video} alt={slide.alt ?? ''} /></div>
  if (!slide.image && mapSlide) return <div className="ar-discovery-visual ar-discovery-map-visual"><img src={whiteMap} alt={slide.alt ?? ''} /></div>
  return <div className="ar-discovery-visual"><img src={slide.image} alt={slide.alt ?? ''} loading="eager" /></div>
}

export function DiscoveryExperience({ copy, onContinue, map = false }: DiscoveryExperienceProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(0)
  const [maxPageReached, setMaxPageReached] = useState(0)
  const slides = map ? mapSlides : regionalSlides[copy?.name ?? ''] ?? []
  const title = map ? '¡Hay algo extraordinario aquí!' : copy?.discoveryTitle ?? 'Región descubierta'
  const subtitle = map ? 'MAPA ENCONTRADO' : copy?.name ?? ''
  const goTo = (next: number) => {
    const bounded = Math.max(0, Math.min(next, Math.min(slides.length - 1, maxPageReached + 1)))
    setPage(bounded)
    trackRef.current?.children[bounded]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }
  return <aside className="ar-discovery-experience" aria-live="polite" aria-label={map ? 'Descubrimiento del mapa' : `Descubrimiento de ${copy?.name ?? 'la región'}`}>
    <div className="ar-discovery-handle" aria-hidden="true" />
    <header className="ar-discovery-header">
      <div><span className="ar-discovery-overline">{subtitle}</span><h2>{title}</h2></div>
    </header>
    <div className="ar-discovery-track" ref={trackRef} onScroll={(event) => { const element = event.currentTarget; const requested = Math.round(element.scrollLeft / element.clientWidth); const next = Math.min(requested, maxPageReached + 1); if (requested !== next) element.scrollTo({ left: next * element.clientWidth, behavior: 'smooth' }); if (next !== page) { setPage(next); setMaxPageReached((current) => Math.max(current, next)) } }}>
      {slides.map((slide) => <article className="ar-discovery-slide" key={`${slide.eyebrow}-${slide.title}`}>
        <SlideVisual slide={slide} mapSlide={map} />
        <div className="ar-discovery-slide-copy"><span className="ar-discovery-kicker">{slide.eyebrow}</span><h3>{slide.title}</h3><p>{slide.body}</p></div>
      </article>)}
    </div>
    <div className="ar-discovery-navigation">
      <button type="button" className="ar-carousel-arrow" onClick={() => goTo(page - 1)} disabled={page === 0} aria-label="Fotografía anterior">←</button>
      <div className="ar-carousel-dots" aria-label={`Página ${page + 1} de ${slides.length}`}>{slides.map((slide, index) => <button key={slide.title} type="button" className={index === page ? 'active' : ''} onClick={() => goTo(index)} aria-label={`Ir a la página ${index + 1}`} />)}</div>
      <button type="button" className="ar-carousel-arrow" onClick={() => goTo(page + 1)} disabled={page === slides.length - 1} aria-label="Fotografía siguiente">→</button>
    </div>
    {page === 0 && <div className="ar-discovery-swipe-hint">Desliza para explorar <span aria-hidden="true">→</span></div>}
    {page === slides.length - 1 && maxPageReached === slides.length - 1 && <button className="game-primary ar-discovery-continue" onClick={onContinue}>{map ? 'INVESTIGAR EL MAPA →' : copy?.name === 'AMAZONÍA' ? '¡DESCUBRIR EL MISTERIO! →' : '¡CONTINUAR! →'}</button>}
  </aside>
}
