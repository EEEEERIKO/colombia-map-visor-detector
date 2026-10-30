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

const regionPhoto = (region: string, name: string) => `/assets/regions/${region}/${name}`

const regionalSlides: Record<string, Slide[]> = {
  CARIBE: [
    { eyebrow: 'PAISAJE', title: 'El sol tiene otro ritmo', body: 'El mar Caribe abre la región con luz, color y paisajes que invitan a quedarse.', image: regionPhoto('caribe', 'paisaje.jpg'), alt: 'Playa del Caribe colombiano' },
    { eyebrow: 'LOCALIDAD', title: 'Historia junto al mar', body: 'Cartagena guarda su historia entre calles, plazas y arquitectura viva.', image: regionPhoto('caribe', 'localidad.webp'), alt: 'Catedral de Santa Catalina en Cartagena' },
    { eyebrow: 'SABORES', title: 'Sabores del territorio', body: 'La cocina caribeña reúne ingredientes, colores y recetas que también cuentan historias.', image: regionPhoto('caribe', 'plato.jpg'), alt: 'Plato típico del Caribe colombiano' },
    { eyebrow: 'CULTURA', title: 'Una región que se mueve', body: 'El carnaval y sus trajes convierten la celebración en una forma de reconocerse.', image: regionPhoto('caribe', 'cultura.jpeg'), alt: 'Mujer con traje de carnaval en Cartagena' },
  ],
  ANDINA: [
    { eyebrow: 'PAISAJE', title: 'Montañas que esconden mundos', body: 'La cordillera y sus frailejones reúnen alturas, agua y cambios de clima.', image: regionPhoto('andina', 'paisaje.jpeg'), alt: 'Cordillera de los Andes con frailejones' },
    { eyebrow: 'LOCALIDAD', title: 'Historias entre calles', body: 'Bogotá es una de las ciudades que crece y se transforma entre las montañas andinas.', image: regionPhoto('andina', 'localidad.jpg'), alt: 'Vista urbana de Bogotá' },
    { eyebrow: 'SABORES', title: 'Una mesa con historia', body: 'La bandeja paisa reúne ingredientes y tradiciones de la cocina andina.', image: regionPhoto('andina', 'plato.jpeg'), alt: 'Bandeja paisa' },
    { eyebrow: 'CULTURA', title: 'El territorio también baila', body: 'El bambuco convierte la música, el movimiento y la memoria en una celebración.', image: regionPhoto('andina', 'cultura.jpg'), alt: 'Pareja bailando bambuco' },
  ],
  PACÍFICA: [
    { eyebrow: 'PAISAJE', title: 'Un mundo lleno de vida', body: 'Selva, ríos y un océano extraordinario forman un paisaje en movimiento.', image: regionPhoto('pacifica', 'paisaje.webp'), alt: 'Paisaje de la región Pacífica' },
    { eyebrow: 'LOCALIDAD', title: 'Historia a orillas del Pacífico', body: 'La arquitectura y los lugares de encuentro también guardan la memoria de la región.', image: regionPhoto('pacifica', 'localidad.jpg'), alt: 'Iglesia La Ermita en Cali' },
    { eyebrow: 'SABORES', title: 'Sabores del litoral', body: 'Los productos del mar llegan a la mesa en preparaciones llenas de identidad.', image: regionPhoto('pacifica', 'plato.jpg'), alt: 'Cazuela de mariscos' },
    { eyebrow: 'BIODIVERSIDAD', title: 'Vida por descubrir', body: 'Las ballenas y otras especies recuerdan que este océano es uno de los grandes tesoros del Pacífico.', image: regionPhoto('pacifica', 'biodiversidad.jpg'), alt: 'Ballena saltando en el océano Pacífico' },
  ],
  ORINOQUÍA: [
    { eyebrow: 'PAISAJE', title: 'Hasta donde alcanza la mirada', body: 'Las llanuras, los ríos y el horizonte abierto construyen una sensación de amplitud.', image: regionPhoto('orinoquia', 'paisaje.jpg'), alt: 'Panorámica de Villavicencio y la Orinoquía' },
    { eyebrow: 'LOCALIDAD', title: 'Un territorio de caminos', body: 'El atardecer sobre el llano muestra la relación entre paisaje, trabajo y recorrido.', image: regionPhoto('orinoquia', 'localidad.jpg'), alt: 'Hombre a caballo al atardecer en la Orinoquía' },
    { eyebrow: 'SABORES', title: 'Fuego y tradición', body: 'La carne a la llanera es una de las preparaciones que identifica la cocina de los Llanos.', image: regionPhoto('orinoquia', 'plato.jpg'), alt: 'Carne a la llanera' },
    { eyebrow: 'CULTURA', title: 'Tradición que suena', body: 'El joropo reúne música, baile y una manera propia de celebrar el territorio.', image: regionPhoto('orinoquia', 'cultura.jpg'), alt: 'Baile tradicional de joropo' },
  ],
  AMAZONÍA: [
    { eyebrow: 'PAISAJE', title: 'Los secretos de la gran selva', body: 'El río Amazonas y su vegetación muestran un territorio que se descubre paso a paso.', image: regionPhoto('amazonia', 'paisaje.jpg'), alt: 'Río y vegetación de la Amazonía colombiana' },
    { eyebrow: 'BIODIVERSIDAD', title: 'Una vida extraordinaria', body: 'La fauna amazónica convierte cada recorrido en una oportunidad para descubrir nuevas especies.', image: regionPhoto('amazonia', 'biodiversidad.jpg'), alt: 'Fauna de la Amazonía colombiana' },
    { eyebrow: 'SABORES', title: 'Sabores de río y selva', body: 'El pirarucú ahumado reúne ingredientes y conocimientos ligados a los ríos amazónicos.', image: regionPhoto('amazonia', 'plato.jpeg'), alt: 'Pirarucú ahumado de la Amazonía' },
    { eyebrow: 'CULTURA', title: 'Conocimientos del territorio', body: 'Los pueblos y sus trajes tradicionales mantienen viva la relación con la selva y sus ríos.', image: regionPhoto('amazonia', 'cultura.jpg'), alt: 'Personas con trajes tradicionales amazónicos' },
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
