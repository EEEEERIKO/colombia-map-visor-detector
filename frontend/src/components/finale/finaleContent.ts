export type FinaleImageAsset = {
  src: string
  alt: string
  ratio: string
  available: boolean
}

export type FinaleRegion = {
  id: string
  name: string
  title: string
  description: string
  accent: string
  emoji: string
  photo: FinaleImageAsset
  silhouette: string
}

export type FinaleDiscovery = {
  title: string
  teaser: string
  detail: string
  emoji: string
  accent: string
}

// Central content manifest. Add the supplied local photographs here and set
// `available` to true; the layout and components do not need to change.
export const finaleHeroPhoto: FinaleImageAsset = {
  src: '/assets/finale/hero/colombia-hero.webp',
  alt: 'Paisaje colombiano',
  ratio: '16 / 9',
  available: false,
}

export const finaleRegions: FinaleRegion[] = [
  { id: 'caribe', name: 'Caribe', title: 'El sol tiene otro ritmo', description: 'Mar, música y ciudades llenas de color.', accent: '#12c5bc', emoji: '🌊', photo: { src: '/assets/finale/regions/caribe/caribe.webp', alt: 'Paisaje del Caribe colombiano', ratio: '4 / 5', available: false }, silhouette: '/assets/ui/regions/caribe-white.png' },
  { id: 'andina', name: 'Andina', title: 'Montañas que esconden mundos', description: 'Valles, alturas y pueblos llenos de historias.', accent: '#f1b94c', emoji: '⛰️', photo: { src: '/assets/finale/regions/andina/andina.webp', alt: 'Paisaje de la región Andina', ratio: '5 / 4', available: false }, silhouette: '/assets/ui/regions/andes-white.png' },
  { id: 'pacifica', name: 'Pacífica', title: 'Un mundo lleno de vida', description: 'Selva, ríos y un océano extraordinario.', accent: '#39b9d4', emoji: '🐋', photo: { src: '/assets/finale/regions/pacifica/pacifica.webp', alt: 'Paisaje de la región Pacífica', ratio: '4 / 5', available: false }, silhouette: '/assets/ui/regions/pacifico-white.png' },
  { id: 'orinoquia', name: 'Orinoquía', title: 'Hasta donde alcanza la mirada', description: 'Llanuras, ríos y horizonte abierto.', accent: '#ef8757', emoji: '🐎', photo: { src: '/assets/finale/regions/orinoquia/orinoquia.webp', alt: 'Paisaje de la Orinoquía', ratio: '5 / 4', available: false }, silhouette: '/assets/ui/regions/orinoquia-white.png' },
  { id: 'amazonia', name: 'Amazonía', title: 'Los secretos de la gran selva', description: 'Una diversidad que se descubre paso a paso.', accent: '#80bd55', emoji: '🦜', photo: { src: '/assets/finale/regions/amazonia/amazonia.webp', alt: 'Paisaje de la Amazonía colombiana', ratio: '4 / 5', available: false }, silhouette: '/assets/ui/regions/amazonas-white.png' },
]

export const finaleDiscoveries: FinaleDiscovery[] = [
  { title: 'Vida que transforma', teaser: 'Biodiversidad', detail: 'En Colombia, cada región cambia la forma de mirar el paisaje y la vida que lo habita.', emoji: '🦋', accent: '#8fcf67' },
  { title: 'Sabores del territorio', teaser: 'Ingredientes', detail: 'Los ingredientes y las recetas también cuentan la historia de los lugares.', emoji: '🥭', accent: '#f0bd45' },
  { title: 'Ritmos para encontrarse', teaser: 'Música', detail: 'La música acompaña encuentros, celebraciones y memorias en todo el país.', emoji: '🎶', accent: '#ef836b' },
  { title: 'Un mapa para seguir', teaser: 'Curiosidad', detail: 'El mapa que encontraste es apenas el comienzo de la próxima exploración.', emoji: '🧭', accent: '#4cb5d1' },
]

