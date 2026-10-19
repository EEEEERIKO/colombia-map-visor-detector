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

The main UI creates one CSS3D anchor and one HTML label per target. MindAR's CSS anchor already applies its `0.001` coordinate conversion, so the label object uses unit scale; applying another `0.001` scale made the previous label effectively invisible. The label is hidden until that target's real `targetFound` event arrives, so it follows the target anchor instead of being positioned at a fixed screen coordinate. `targetFound` changes the target state to detected and restores the label; `targetLost` changes only that target to lost and schedules defensive label cleanup after a 250 ms grace period. A reacquisition cancels the pending cleanup. MindAR still controls the anchor's own visibility, and the UI does not fabricate confidence or detection results.

Each AR run has a generation identifier. Events from a stopped or replaced MindAR instance are ignored, pending hide timers are cleared, and the rendered container is emptied during camera restart or unmount. This prevents stale labels, duplicate anchors, and one target's loss from affecting another target. The status panel is derived independently from the six stable target IDs and can show multiple detected targets at once when MindAR reports them.

The UI uses a short 180 ms confirmation interval after `targetFound`. During that interval the target is `provisional` and its overlay remains hidden; a loss cancels confirmation. MindAR's supported `warmupTolerance` is also set to 8 tracking frames (the installed default is 5) before its anchor is shown. These filters transient event noise but cannot guarantee protection against a persistent visual false positive. MindAR 1.2.5 does not expose a public confidence score in this integration, so no synthetic confidence value is displayed.

MindAR updates each anchor with a camera-relative transformation matrix through its internal Three.js scene. The repository does not currently contain a common map-coordinate reference frame or expected region geometry. For that reason, `frontend/src/components/ar/placementValidation.ts` provides a tested, generic position/orientation validator for future calibrated data, but the live AR experience does not claim `correctly-placed` or `misplaced`; unavailable reference geometry and pose data resolve to `unknown`.

## Global map validation

`frontend/src/components/ar/globalValidation.ts` derives one typed result from the six per-target states. The five regional IDs are required independently from `colombia-completa`:

- `incomplete`: at least one region is not confirmed.
- `regions-complete`: all five regions are confirmed, but the complete map is not.
- `assembly-unknown`: all six targets are recognized, but physical placement cannot be verified.
- `assembly-valid` / `assembly-invalid`: reserved for reliable future placement evidence.

The result also exposes `mapRecognized` and `canUnlockGame`. The initial unlock policy is recognition-based: all five regions plus the complete-map target must be confirmed. A future policy can require verified assembly by selecting `verified-assembly`; recognition alone then does not unlock the game. A `temporarily-lost` target remains part of confirmed presence during the existing 250 ms loss grace period, while a target that reaches `lost` is removed.

MindAR supports multiple targets with `maxTrack: 6`, but simultaneous stability depends on camera resolution, lighting, target distance, motion, and the visual quality of the physical artwork. The current implementation has not been verified with a physical camera in this environment.

The PNG inspection found six opaque, full-canvas assets with the following dimensions: complete map `1623×2000`, Caribe `1297×1200`, Andina `709×1200`, Pacífica `633×1200`, Orinoquía `1361×1200`, and Amazónica `1399×1200`. These dimensions are metadata only; they do not establish physical scale or camera pose.

Automated tests mock MindAR events and cover label activation, per-target loss, reacquisition, duplicate prevention, and independent multi-target state. Physical-camera tests for frontal, oblique, distance, lighting, occlusion, and rapid reacquisition must still be performed manually with the printed/physical targets. The current implementation has not been verified under all of those conditions in this environment.

