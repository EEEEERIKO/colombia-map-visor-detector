# Colombia Map Vision Detector

Full-stack scaffold for detecting five cardboard pieces representing Colombia's natural regions: Caribe, Andina, Pacífica, Orinoquía, and Amazónica. The repository currently provides contracts, UI, API boundaries, tests, and development tooling; computer-vision algorithms are intentionally not implemented.

## Status and architecture

The FastAPI backend exposes versioned health, image-detection, region-list, and map-validation endpoints. Vision modules are replaceable interfaces that raise `NotImplementedError`, and the API reports this explicitly with HTTP 501. The React/Vite frontend renders an honest empty state and sends uploaded images to the backend.

Phase 02 adds safe PNG/JPEG/WebP ingestion, EXIF orientation normalization, non-destructive resizing and brightness/contrast processing, optional four-point rectification, camera capture, calibration metadata, and local capture records. The six inspected reference targets are served from `frontend/public/assets/targets`; these are reference images, not photographs of physical captures.

Phase 03 adds a camera-first local AR prototype using MindAR Image Tracking. The six targets are precompiled into `frontend/public/assets/tracking/colombia-targets.mind`; recognized target names appear as tracked text overlays. Detection and map-validation backend routes remain explicit placeholders.

Completeness cannot be inferred from finding five objects: the future pipeline must identify every expected region, detect missing/duplicated pieces, validate spatial arrangement, and compare the assembled silhouette.

## Prerequisites and setup

Python 3.12+, Node.js 20+, npm, and (optionally) Docker are recommended.

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
make install
make test
make lint
```

## Cómo levantar el proyecto

### Opción recomendada: desarrollo local

Desde la raíz del proyecto, abre dos terminales:

Terminal 1 — backend:

```sh
make backend-dev
```

API disponible en `http://localhost:8000`. Documentación interactiva: `http://localhost:8000/docs`.

Terminal 2 — frontend:

```sh
make frontend-dev
```

Interfaz disponible en `http://localhost:5173`.

Antes de levantar por primera vez, ejecuta:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
make install
```

### Opción Docker Compose

```sh
cp backend/.env.example backend/.env
docker compose up --build
```

La interfaz queda en `http://localhost:5173` y el backend en `http://localhost:8000`. Para detener los servicios usa `Ctrl+C`; para ejecutarlos en segundo plano usa `docker compose up --build -d` y detenlos con `docker compose down`.

### Comandos útiles

```sh
make test       # pytest + Vitest
make lint       # Ruff + ESLint
make format     # formateadores Python y TypeScript
make check      # lint + tests
make dev        # Docker Compose
npm run compile-targets --prefix frontend  # regenerate MindAR resource after target changes
```

Run locally in two terminals:

```sh
make backend-dev   # http://localhost:8000
make frontend-dev  # http://localhost:5173
```

Or run `docker compose up --build`. Browser camera access belongs to the browser; a server-side camera requires the capture process to run on the machine physically connected to that camera, and is not automatically shared with a container.

Capture metadata is stored as JSON and original bytes in `data/captures` (configurable with `CAPTURE_STORAGE_DIR`). This is intentionally simple local persistence for calibration work; it is not a multi-user or durable object-storage solution, and the directory must be mounted or backed up when using containers.

## Commands

`make install` installs backend development requirements and frontend npm packages. `make dev` starts both services through Docker Compose. `make test`, `make lint`, `make format`, and `make check` run the configured checks.

The frontend source is written in TypeScript. Edit `.ts` and `.tsx` files; do not edit generated JavaScript files.

## Repository layout

`backend/` contains FastAPI, Pydantic contracts, service orchestration, vision boundaries, and pytest tests. `frontend/` contains the React dashboard, API client, matching TypeScript types, and Vitest tests. `data/` is reserved for future fixtures/templates; `docs/` contains architecture notes; `scripts/` contains setup/check helpers.

## Planned phases

1. Image acquisition and camera calibration.
2. Preprocessing.
3. Individual region detection and identification.
4. Localization, orientation, and spatial arrangement validation.
5. Silhouette validation.
6. Frontend integration and real-time feedback.

Do not add model weights, reference templates, accuracy claims, or heavyweight ML dependencies until their design and data requirements are known.

