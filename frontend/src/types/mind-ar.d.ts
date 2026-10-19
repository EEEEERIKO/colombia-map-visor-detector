declare module 'mind-ar/dist/mindar-image-three.prod.js' {
  export class MindARThree {
    constructor(options: { container: HTMLElement; imageTargetSrc: string; maxTrack?: number; uiLoading?: string; uiScanning?: string; uiError?: string })
    renderer: { domElement: HTMLElement; setAnimationLoop(callback: (() => void) | null): void; render(scene: unknown, camera: unknown): void; dispose(): void }
    cssRenderer: { render(scene: unknown, camera: unknown): void }
    scene: unknown
    cssScene: unknown
    camera: unknown
    start(): Promise<void>
    stop(): void
    addCSSAnchor(targetIndex: number): { group: { add(object: unknown): void }; onTargetFound: (() => void) | null; onTargetLost: (() => void) | null; onTargetUpdate: (() => void) | null }
  }
}

declare module 'three/examples/jsm/renderers/CSS3DRenderer.js' {
  export class CSS3DObject {
    constructor(element: HTMLElement)
    scale: { set(x: number, y: number, z: number): void }
  }
}
