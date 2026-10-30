# Assets de la experiencia final

La pantalla final está preparada para recibir fotografías locales sin modificar los componentes ni el layout. Las rutas son públicas y relativas a `frontend/public`.

| Archivo esperado | Uso | Formato recomendado | Estado |
| --- | --- | --- | --- |
| `assets/finale/hero/colombia-hero.webp` | Revelación inicial | Paisaje horizontal, 16:9 | Listo |
| `assets/regions/caribe/{paisaje,localidad,plato,cultura}` | Modal y catálogo Caribe | Cuatro fotos locales | Listo |
| `assets/regions/andina/{paisaje,localidad,plato,cultura}` | Modal y catálogo Andina | Cuatro fotos locales | Listo |
| `assets/regions/pacifica/{paisaje,localidad,plato,biodiversidad}` | Modal y catálogo Pacífica | Cuatro fotos locales | Listo |
| `assets/regions/orinoquia/{paisaje,localidad,plato,cultura}` | Modal y catálogo Orinoquía | Cuatro fotos locales | Listo |
| `assets/regions/amazonia/{paisaje,biodiversidad,plato,cultura}` | Modal y catálogo Amazonía | Cuatro fotos locales | Listo |

Las fotografías regionales y la imagen hero ya están activas. Las fotos de cada región se muestran tanto en el descubrimiento AR como en el modal del catálogo final. Se usa `object-fit: cover` para llenar el marco sin deformar las imágenes.

Las siluetas regionales actuales se conservan únicamente como textura decorativa de respaldo; no sustituyen las fotografías finales.

