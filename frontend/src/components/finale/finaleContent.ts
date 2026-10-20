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

const galleryPhoto = (name: string, alt: string, ratio: string, caption = alt): FinaleImageAsset => ({ src: `/assets/finale/gallery/${name}.webp`, alt, ratio, caption, available: true })
const missingPhoto = (ratio = '4 / 5'): FinaleImageAsset => ({ src: '', alt: 'Fotografía pendiente', ratio, available: false, placeholder: 'Fotos aún necesarias' })

export const finaleRegions: FinaleRegion[] = [
  { id: 'caribe', name: 'Caribe', title: 'El sol tiene otro ritmo', description: 'Mar, música y ciudades llenas de color.', accent: '#12c5bc', icon: '/assets/ui/icons/caribe.svg', photos: [{ src: '/assets/finale/regions/caribe/caribe.webp', alt: 'Paisaje del Caribe colombiano', ratio: '4 / 5', caption: 'El Caribe colombiano vibra entre mar, color y alegría.', available: true }, galleryPhoto('foto-cartagena', 'Arquitectura de Cartagena', '1 / 1'), galleryPhoto('foto-cartagena1', 'Calle colonial de Cartagena', '7 / 8'), galleryPhoto('foto-cartagena4', 'Cultura del Caribe colombiano', '3 / 4'), galleryPhoto('foto-playa', 'Playa del Caribe colombiano', '16 / 9')], silhouette: '/assets/ui/regions/caribe-white.png' },
  { id: 'andina', name: 'Andina', title: 'Montañas que esconden mundos', description: 'Valles, alturas y pueblos llenos de historias.', accent: '#f1b94c', icon: '/assets/ui/icons/andes.svg', photos: [{ src: '/assets/finale/regions/andina/andina.webp', alt: 'Paisaje de la región Andina', ratio: '5 / 4', caption: 'Las montañas andinas guardan pueblos, valles y caminos.', available: true }, galleryPhoto('foto-andes', 'Paisaje de los Andes colombianos', '16 / 9'), galleryPhoto('foto-antioquia', 'Paisaje de Antioquia', '3 / 2'), galleryPhoto('foto-piedra-penol', 'Piedra del Peñol', '3 / 2'), galleryPhoto('foto-valle-cocora', 'Valle de Cocora', '3 / 2'), galleryPhoto('foto-valle-cocora3', 'Paisaje del Valle de Cocora', '2 / 1'), galleryPhoto('foto-valle-cocora2', 'Palma de cera en el Valle de Cocora', '2 / 3'), galleryPhoto('foto-catedral', 'Santuario en las montañas', '3 / 2')], silhouette: '/assets/ui/regions/andes-white.png' },
  { id: 'pacifica', name: 'Pacífica', title: 'Un mundo lleno de vida', description: 'Selva, ríos y un océano extraordinario.', accent: '#39b9d4', icon: '/assets/ui/icons/pacifico.svg', photos: [{ src: '/assets/finale/regions/pacifica/pacifica.webp', alt: 'Paisaje de la región Pacífica', ratio: '4 / 5', caption: 'El Pacífico une selva, océano y una biodiversidad inmensa.', available: true }, missingPhoto('4 / 5'), missingPhoto('16 / 9')], silhouette: '/assets/ui/regions/pacifico-white.png' },
  { id: 'orinoquia', name: 'Orinoquía', title: 'Hasta donde alcanza la mirada', description: 'Llanuras, ríos y horizonte abierto.', accent: '#ef8757', icon: '/assets/ui/icons/orinoquia.svg', photos: [{ src: '/assets/finale/regions/orinoquia/orinoquia.webp', alt: 'Paisaje de la Orinoquía', ratio: '5 / 4', caption: 'En la Orinoquía, el horizonte se abre entre ríos y sabanas.', available: true }, galleryPhoto('foto-atardecer', 'Atardecer colombiano', '3 / 4'), galleryPhoto('foto-baile', 'Celebración cultural colombiana', '8 / 5'), missingPhoto('5 / 4')], silhouette: '/assets/ui/regions/orinoquia-white.png' },
  { id: 'amazonia', name: 'Amazonía', title: 'Los secretos de la gran selva', description: 'Una diversidad que se descubre paso a paso.', accent: '#80bd55', icon: '/assets/ui/icons/amazonas.svg', photos: [{ src: '/assets/finale/regions/amazonia/amazonia.webp', alt: 'Paisaje de la Amazonía colombiana', ratio: '4 / 5', caption: 'La Amazonía es una inmensa red de agua, selva y vida.', available: true }, galleryPhoto('foto-amazonas', 'Paisaje de la Amazonía colombiana', '8 / 5'), missingPhoto('4 / 5')], silhouette: '/assets/ui/regions/amazonas-white.png' },
]

export const finaleDiscoveries: FinaleDiscovery[] = [
  { title: 'Vida que transforma', teaser: 'Biodiversidad', detail: 'En Colombia, cada región cambia la forma de mirar el paisaje y la vida que lo habita.', icon: '/assets/ui/icons/mariposa.svg', accent: '#00a982', photos: [{ src: '/assets/finale/regions/amazonia/amazonia.webp', alt: 'Paisaje de la Amazonía colombiana', ratio: '4 / 5', caption: 'La Amazonía reúne una biodiversidad extraordinaria.', available: true }, { src: '/assets/finale/regions/pacifica/pacifica.webp', alt: 'Paisaje de la región Pacífica', ratio: '4 / 5', caption: 'El Pacífico une selva, océano y una biodiversidad inmensa.', available: true }, missingPhoto('4 / 5')] },
  { title: 'Sabores del territorio', teaser: 'Ingredientes', detail: 'Los ingredientes y las recetas también cuentan la historia de los lugares.', icon: '/assets/ui/icons/sabores.svg', accent: '#ffd500', photos: [{ src: '/assets/finale/regions/caribe/caribe.webp', alt: 'Paisaje del Caribe colombiano', ratio: '4 / 5', caption: 'El Caribe colombiano vibra entre mar, color y alegría.', available: true }, galleryPhoto('foto-calle-colorida', 'Calle colorida de Colombia', '3 / 2'), missingPhoto('1 / 1')] },
  { title: 'Ritmos para encontrarse', teaser: 'Música', detail: 'La música acompaña encuentros, celebraciones y memorias en todo el país.', icon: '/assets/ui/icons/musica.svg', accent: '#ef3340', photos: [galleryPhoto('foto-baile-fiesta', 'Baile tradicional colombiano', '3 / 2'), galleryPhoto('foto-fiesta-colombia', 'Fiesta colombiana', '7 / 4'), galleryPhoto('foto-calle-fiesta-colombia', 'Fiesta en una calle colombiana', '3 / 2')] },
  { title: 'Un mapa para seguir', teaser: 'Curiosidad', detail: 'El mapa que encontraste es apenas el comienzo de la próxima exploración.', icon: '/assets/ui/icons/exploracion.svg', accent: '#005bbb', photos: [galleryPhoto('foto-bogota', 'Vista urbana de Bogotá', '4 / 5'), galleryPhoto('foto-calle-sombrilla-colores', 'Calle de colores', '3 / 2'), galleryPhoto('foto-hero-bandera-colombia', 'Bandera de Colombia', '4 / 3'), galleryPhoto('foto=catedral', 'Catedral entre montañas', '3 / 2')] },
]

