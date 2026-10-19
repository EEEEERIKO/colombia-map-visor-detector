export const REGION_IDS = ['caribe', 'andina', 'pacifica', 'orinoquia', 'amazonia'] as const
export type RegionId = (typeof REGION_IDS)[number]
export type BoundingBox = { x: number; y: number; width: number; height: number }
export type DetectedRegion = { region_id: RegionId; bounding_box: BoundingBox; orientation_degrees: number | null; confidence: number | null }
export type DetectionResult = { status: string; message: string; regions: DetectedRegion[]; missing_regions: RegionId[]; duplicated_regions: RegionId[] }
export type HealthResponse = { status: string; service: string; detection_engine: string }
export const TARGETS = [
  { id: 'colombia-completa', label: 'Colombia completa', type: 'map' },
  { id: 'region-caribe', label: 'Región Caribe', type: 'region' },
  { id: 'region-andina', label: 'Región Andina', type: 'region' },
  { id: 'region-pacifica', label: 'Región Pacífica', type: 'region' },
  { id: 'region-orinoquia', label: 'Región Orinoquía', type: 'region' },
  { id: 'region-amazonia', label: 'Región Amazónica', type: 'region' },
] as const
export type TargetId = (typeof TARGETS)[number]['id']
export type ProcessingOptions = { width?: number; brightness: number; contrast: number; perspectivePoints?: [number, number][] }
export type ImageMetadata = { width: number; height: number; format: string; byte_size: number }
export type ProcessedImage = { source_capture_id: string | null; metadata: ImageMetadata; transformations: string[]; status: string; error: string | null }
export type CapturedImage = { capture_id: string; associated_target_id: TargetId | null; original: ImageMetadata; source: 'camera' | 'upload'; captured_at: string | null; notes: string | null }

