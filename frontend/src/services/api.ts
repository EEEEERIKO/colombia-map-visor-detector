import type { CapturedImage, DetectionResult, HealthResponse, ProcessingOptions, ProcessedImage } from '../types/api'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, options)
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail ?? `Request failed (${response.status})`)
  return response.json() as Promise<T>
}

export const api = {
  health: () => request<HealthResponse>('/health'),
  detectImage: (file: File) => { const body = new FormData(); body.append('file', file); return request<DetectionResult>('/detection/image', { method: 'POST', body }) },
  processImage: async (file: File, options: ProcessingOptions) => {
    const body = new FormData(); body.append('file', file); body.append('parameters', JSON.stringify({ width: options.width, brightness: options.brightness, contrast: options.contrast, perspective_points: options.perspectivePoints }))
    const response = await fetch(`${baseUrl}/images/process/content`, { method: 'POST', body })
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.detail ?? 'Image processing failed.')
    return { blob: await response.blob(), metadata: JSON.parse(response.headers.get('X-Processed-Metadata') ?? '{}') as ProcessedImage }
  },
  saveCapture: (file: File, targetId: string, calibration: object, notes: string, source: 'camera' | 'upload') => { const body = new FormData(); body.append('file', file); body.append('source', source); body.append('target_id', targetId); body.append('calibration', JSON.stringify(calibration)); body.append('notes', notes); return request<CapturedImage>('/images/captures', { method: 'POST', body }) },
}

