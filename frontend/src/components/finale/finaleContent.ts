export type FinaleImageAsset = {
  src: string
  alt: string
  ratio: string
  available: boolean
  caption?: string
  placeholder?: string
}

export type FinaleRegion = {
  id: string
  name: string
  title: string
  description: string
  accent: string
  icon: string
  photos: FinaleImageAsset[]
  silhouette: string
}

export type FinaleDiscovery = {
  title: string
  teaser: string
  detail: string
  icon: string
  accent: string
  photos: FinaleImageAsset[]
}

// Central content manifest for the supplied, optimized local photographs.
export const finaleHeroPhoto: FinaleImageAsset = {
  src: '/assets/finale/hero/colombia-hero.webp',
  alt: 'Paisaje colombiano',
  ratio: '16 / 9',
  available: true,
}

const regionPhoto = (region: string, name: string, alt: string, ratio: string, caption = alt): FinaleImageAsset => ({ src: `/assets/regions/${region}/${name}`, alt, ratio, caption, available: true })
const missingPhoto = (ratio = '4 / 5'): FinaleImageAsset => ({ src: '', alt: 'Fotografía pendiente', ratio, available: false, placeholder: 'Fotos aún necesarias' })

export const finaleRegions: FinaleRegion[] = [
  { id: 'caribe', name: 'Caribe', title: 'El sol tiene otro ritmo', description: 'Mar, ciudades llenas de color y tradiciones que se viven en movimiento.', accent: '#12c5bc', icon: '/assets/ui/icons/caribe.svg', photos: [regionPhoto('caribe', 'paisaje.webp', 'Playa del Caribe colombiano', '16 / 9', 'El mar Caribe abre la región con luz y color.'), regionPhoto('caribe', 'localidad.webp', 'Catedral de Santa Catalina en Cartagena', '4 / 5'), regionPhoto('caribe', 'plato.webp', 'Plato típico del Caribe colombiano', '4 / 5'), regionPhoto('caribe', 'cultura.webp', 'Mujer con traje de carnaval en Cartagena', '4 / 3')], silhouette: '/assets/ui/regions/caribe-white.png' },
  { id: 'andina', name: 'Andina', title: 'Montañas que esconden mundos', description: 'Alturas, ciudades y tradiciones reunidas entre la cordillera.', accent: '#f1b94c', icon: '/assets/ui/icons/andes.svg', photos: [regionPhoto('andina', 'paisaje.webp', 'Cordillera de los Andes con frailejones', '16 / 9', 'La cordillera guarda alturas, agua y cambios de clima.'), regionPhoto('andina', 'localidad.webp', 'Vista urbana de Bogotá', '3 / 2'), regionPhoto('andina', 'plato.webp', 'Bandeja paisa', '3 / 2'), regionPhoto('andina', 'cultura.webp', 'Pareja bailando bambuco', '3 / 2')], silhouette: '/assets/ui/regions/andes-white.png' },
  { id: 'pacifica', name: 'Pacífica', title: 'Un mundo lleno de vida', description: 'Selva, océano, sabores y una biodiversidad extraordinaria.', accent: '#39b9d4', icon: '/assets/ui/icons/pacifico.svg', photos: [regionPhoto('pacifica', 'paisaje.webp', 'Paisaje de la región Pacífica', '3 / 2', 'Selva, ríos y océano forman un paisaje en movimiento.'), regionPhoto('pacifica', 'localidad.webp', 'Iglesia La Ermita en Cali', '4 / 5'), regionPhoto('pacifica', 'plato.webp', 'Cazuela de mariscos', '3 / 2'), regionPhoto('pacifica', 'biodiversidad.webp', 'Ballena saltando en el océano Pacífico', '3 / 2', 'Las ballenas recuerdan la riqueza viva de este océano.')], silhouette: '/assets/ui/regions/pacifico-white.png' },
  { id: 'orinoquia', name: 'Orinoquía', title: 'Hasta donde alcanza la mirada', description: 'Llanuras, caminos, sabores y tradiciones del territorio llanero.', accent: '#ef8757', icon: '/assets/ui/icons/orinoquia.svg', photos: [regionPhoto('orinoquia', 'paisaje.webp', 'Panorámica de Villavicencio y la Orinoquía', '3 / 2', 'El horizonte se abre entre ríos y sabanas.'), regionPhoto('orinoquia', 'localidad.webp', 'Hombre a caballo al atardecer en la Orinoquía', '2 / 1'), regionPhoto('orinoquia', 'plato.webp', 'Carne a la llanera', '16 / 9'), regionPhoto('orinoquia', 'cultura.webp', 'Baile tradicional de joropo', '3 / 2')], silhouette: '/assets/ui/regions/orinoquia-white.png' },
  { id: 'amazonia', name: 'Amazonía', title: 'Los secretos de la gran selva', description: 'Ríos, especies, sabores y comunidades vinculadas con la selva.', accent: '#80bd55', icon: '/assets/ui/icons/amazonas.svg', photos: [regionPhoto('amazonia', 'paisaje.webp', 'Río y vegetación de la Amazonía colombiana', '8 / 5', 'El río Amazonas conecta agua, selva y vida.'), regionPhoto('amazonia', 'biodiversidad.webp', 'Fauna de la Amazonía colombiana', '3 / 2'), regionPhoto('amazonia', 'plato.webp', 'Pirarucú ahumado de la Amazonía', '1 / 1'), regionPhoto('amazonia', 'cultura.webp', 'Personas con trajes tradicionales amazónicos', '3 / 2')], silhouette: '/assets/ui/regions/amazonas-white.png' },
]

export const finaleDiscoveries: FinaleDiscovery[] = [
  { title: 'Vida que transforma', teaser: 'Biodiversidad', detail: 'En Colombia, cada región cambia la forma de mirar el paisaje y la vida que lo habita.', icon: '/assets/ui/icons/mariposa.svg', accent: '#00a982', photos: [regionPhoto('amazonia', 'biodiversidad.webp', 'Fauna de la Amazonía colombiana', '3 / 2'), regionPhoto('pacifica', 'biodiversidad.webp', 'Ballena saltando en el océano Pacífico', '3 / 2'), regionPhoto('amazonia', 'paisaje.webp', 'Río y vegetación de la Amazonía colombiana', '8 / 5')] },
  { title: 'Sabores del territorio', teaser: 'Ingredientes', detail: 'Los ingredientes y las recetas también cuentan la historia de los lugares.', icon: '/assets/ui/icons/sabores.svg', accent: '#ffd500', photos: [regionPhoto('caribe', 'plato.webp', 'Plato típico del Caribe colombiano', '4 / 5'), regionPhoto('andina', 'plato.webp', 'Bandeja paisa', '3 / 2'), regionPhoto('orinoquia', 'plato.webp', 'Carne a la llanera', '16 / 9')] },
  { title: 'Ritmos para encontrarse', teaser: 'Música', detail: 'La música acompaña encuentros, celebraciones y memorias en todo el país.', icon: '/assets/ui/icons/musica.svg', accent: '#ef3340', photos: [regionPhoto('orinoquia', 'cultura.webp', 'Baile tradicional de joropo', '3 / 2'), regionPhoto('andina', 'cultura.webp', 'Pareja bailando bambuco', '3 / 2'), regionPhoto('caribe', 'cultura.webp', 'Mujer con traje de carnaval en Cartagena', '4 / 3')] },
  { title: 'Un mapa para seguir', teaser: 'Curiosidad', detail: 'El mapa que encontraste es apenas el comienzo de la próxima exploración.', icon: '/assets/ui/icons/exploracion.svg', accent: '#005bbb', photos: [regionPhoto('andina', 'localidad.webp', 'Vista urbana de Bogotá', '3 / 2'), regionPhoto('caribe', 'localidad.webp', 'Catedral de Santa Catalina en Cartagena', '4 / 5'), regionPhoto('orinoquia', 'paisaje.webp', 'Panorámica de Villavicencio y la Orinoquía', '3 / 2'), regionPhoto('pacifica', 'localidad.webp', 'Iglesia La Ermita en Cali', '4 / 5')] },
]

