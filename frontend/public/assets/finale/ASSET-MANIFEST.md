# Assets de la experiencia final

La pantalla final está preparada para recibir fotografías locales sin modificar los componentes ni el layout. Las rutas son públicas y relativas a `frontend/public`.

| Archivo esperado | Uso | Formato recomendado | Estado |
| --- | --- | --- | --- |
| `assets/finale/hero/colombia-hero.webp` | Revelación inicial | Paisaje horizontal, 16:9, mínimo 1600×900 | Opcional |
| `assets/finale/regions/caribe/caribe.webp` | Panel Caribe | Vertical, 4:5, mínimo 900×1125 | Pendiente |
| `assets/finale/regions/andina/andina.webp` | Panel Andina | Horizontal, 5:4, mínimo 1200×960 | Pendiente |
| `assets/finale/regions/pacifica/pacifica.webp` | Panel Pacífica | Vertical, 4:5, mínimo 900×1125 | Pendiente |
| `assets/finale/regions/orinoquia/orinoquia.webp` | Panel Orinoquía | Horizontal, 5:4, mínimo 1200×960 | Pendiente |
| `assets/finale/regions/amazonia/amazonia.webp` | Panel Amazonía | Vertical, 4:5, mínimo 900×1125 | Pendiente |

Para activar una fotografía, agrega el archivo en la ruta indicada y cambia `available: false` a `available: true` en `src/components/finale/finaleContent.ts`. Cada entrada incluye texto alternativo y proporción para evitar saltos de layout.

Las siluetas regionales actuales se conservan únicamente como textura decorativa de respaldo; no sustituyen las fotografías finales.

