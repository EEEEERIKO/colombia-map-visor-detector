# Phase 03: AR image tracking

The browser uses MindAR Image Tracking with the Three.js integration. Recognition runs locally in the browser; camera frames are not sent to FastAPI. The six existing PNGs are compiled into `frontend/public/assets/tracking/colombia-targets.mind` in this stable order:

1. `colombia-completa` — `full-map.png`
2. `region-caribe` — `caribean-region.png`
3. `region-andina` — `andes-region.png`
4. `region-pacifica` — `pacific-region.png`
5. `region-orinoquia` — `orinoquia-region.png`
6. `region-amazonia` — `amazonas-region.png`

The resource is reproducible with:

```sh
cd frontend
npm run compile-targets
```

The compiler uses MindAR's offline compiler with `@napi-rs/canvas` so it can run on the current Node toolchain. It is an explicit build step and is not run during camera startup. The generated file must remain available at `/assets/tracking/colombia-targets.mind`.

The main UI creates one CSS3D anchor per target and attaches a text label to that tracked anchor. `targetFound` changes the target state to detected; `targetLost` changes it to lost and MindAR hides the anchor. The target list is status-only until the engine emits a real event; no detection result is fabricated.

MindAR supports multiple targets with `maxTrack: 6`, but simultaneous stability depends on camera resolution, lighting, target distance, motion, and the visual quality of the physical artwork. The current implementation has not been verified with a physical camera in this environment.

The PNG inspection found six opaque, full-canvas assets with the following dimensions: complete map `1623×2000`, Caribe `1297×1200`, Andina `709×1200`, Pacífica `633×1200`, Orinoquía `1361×1200`, and Amazónica `1399×1200`. These dimensions are metadata only; they do not establish physical scale or camera pose.

