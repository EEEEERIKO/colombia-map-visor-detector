import { useEffect, useRef, useState } from 'react'
import { api } from '../../services/api'
import { TARGETS, type ImageMetadata, type ProcessingOptions, type TargetId } from '../../types/api'

const MAX_BYTES = 10 * 1024 * 1024
type CaptureSource = 'camera' | 'upload'

function readMetadata(file: File, url: string): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight, format: file.type, byte_size: file.size })
    image.onerror = () => reject(new Error('The selected file cannot be decoded as an image.'))
    image.src = url
  })
}

export function AcquisitionWorkspace() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState<CaptureSource>('upload')
  const [capturedAt, setCapturedAt] = useState<string | null>(null)
  const [originalUrl, setOriginalUrl] = useState('')
  const [processedUrl, setProcessedUrl] = useState('')
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null)
  const [status, setStatus] = useState('Start the camera to capture the physical map, or upload a test image.')
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'active' | 'stopped' | 'error'>('idle')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState('')
  const [cameraResolution, setCameraResolution] = useState('—')
  const [brightness, setBrightness] = useState(0)
  const [contrast, setContrast] = useState(1)
  const [width, setWidth] = useState(1280)
  const [perspective, setPerspective] = useState('')
  const [target, setTarget] = useState<TargetId>('colombia-completa')
  const [notes, setNotes] = useState('')
  const [distance, setDistance] = useState('')
  const [orientation, setOrientation] = useState('')
  const [lighting, setLighting] = useState('')
  const [visibility, setVisibility] = useState('entire map')
  const [saving, setSaving] = useState(false)

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraState('stopped')
    setCameraResolution('—')
  }

  useEffect(() => () => stopCamera(), [])

  const refreshDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    const allDevices = await navigator.mediaDevices.enumerateDevices()
    const cameras = allDevices.filter((device) => device.kind === 'videoinput')
    setDevices(cameras)
    if (!deviceId && cameras[0]) setDeviceId(cameras[0].deviceId)
  }

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) { setCameraState('error'); setStatus('Camera access requires a supported browser in a secure context.'); return }
    stopCamera(); setCameraState('starting'); setStatus('Requesting camera permission…')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: deviceId ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } } : { width: { ideal: 1280 }, height: { ideal: 720 } } })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play() }
      const track = stream.getVideoTracks()[0]
      const settings = track?.getSettings()
      setCameraResolution(settings?.width && settings?.height ? `${settings.width} × ${settings.height}` : 'available resolution')
      await refreshDevices(); setCameraState('active'); setStatus('Camera active. Capture a frame when the map is positioned.')
    } catch (error) {
      stopCamera(); setCameraState('error'); setStatus(error instanceof DOMException && error.name === 'NotAllowedError' ? 'Camera permission was denied.' : 'Camera could not be started. Check that a device is connected and not in use.')
    }
  }

  const selectFile = async (next: File, captureSource: CaptureSource = 'upload', timestamp = new Date().toISOString()) => {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(next.type)) return setStatus('Use a PNG, JPEG, or WebP image.')
    if (next.size > MAX_BYTES) return setStatus('This image exceeds the 10 MB upload limit.')
    const url = URL.createObjectURL(next)
    try { const nextMetadata = await readMetadata(next, url); setFile(next); setSource(captureSource); setCapturedAt(timestamp); setMetadata(nextMetadata); setOriginalUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return url }); setProcessedUrl(''); setStatus(`${captureSource === 'camera' ? 'Camera frame' : 'Uploaded image'} ready for calibration.`) } catch (error) { URL.revokeObjectURL(url); setStatus(error instanceof Error ? error.message : 'Image validation failed.') }
  }

  const captureFrame = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) { setStatus('The camera preview is not ready yet.'); return }
    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob((blob) => { if (blob) void selectFile(new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' }), 'camera') }, 'image/jpeg', .92)
  }

  const process = async () => {
    if (!file) return
    setStatus('Processing image…')
    try {
      const values = perspective.split(';').filter(Boolean).map((point) => point.split(',').map(Number))
      if (values.length && (values.length !== 4 || values.some((point) => point.length !== 2 || point.some((value) => !Number.isFinite(value))))) throw new Error('Perspective points must be four finite x,y pairs separated by semicolons.')
      const options: ProcessingOptions = { width, brightness, contrast, perspectivePoints: values.length ? values as [number, number][] : undefined }
      const result = await api.processImage(file, options); setProcessedUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return URL.createObjectURL(result.blob) }); setStatus(`Processed ${result.metadata.metadata.width} × ${result.metadata.metadata.height}px · ${result.metadata.transformations.join(', ')}`)
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Processing failed.') }
  }

  const save = async () => {
    if (!file) return
    setSaving(true)
    try { await api.saveCapture(file, target, { map_width_cm: 230, map_height_cm: 250, camera_distance_cm: distance ? Number(distance) : undefined, camera_orientation: orientation, lighting_conditions: lighting, visibility, quality_notes: notes }, notes, source); setStatus('Capture metadata saved persistently in local capture storage.') } catch (error) { setStatus(error instanceof Error ? error.message : 'Capture could not be saved.') } finally { setSaving(false) }
  }

  const reset = () => { setBrightness(0); setContrast(1); setWidth(1280); setPerspective(''); setProcessedUrl((previous) => { if (previous) URL.revokeObjectURL(previous); return '' }); setStatus('Adjustments reset; the original remains unchanged.') }

  return <section className="acquisition panel">
    <div className="camera-heading"><div><h2>Live camera calibration</h2><p>Capture still frames deliberately; continuous video detection is intentionally not enabled.</p></div><span className={`camera-state ${cameraState}`}>{cameraState}</span></div>
    <div className="camera-preview"><video ref={videoRef} playsInline muted aria-label="Live camera preview" /><div className="camera-actions"><button onClick={startCamera} disabled={cameraState === 'starting'}>{cameraState === 'active' ? 'Restart camera' : 'Start camera'}</button><button className="secondary" onClick={stopCamera} disabled={cameraState !== 'active'}>Stop camera</button><button onClick={captureFrame} disabled={cameraState !== 'active'}>Capture frame</button></div><small>Verified camera resolution: {cameraResolution}</small></div>
    {devices.length > 1 && <label>Camera device<select value={deviceId} onChange={(event) => setDeviceId(event.target.value)}>{devices.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Camera ${index + 1}`}</option>)}</select></label>}
    <div className="toolbar"><label className="button secondary">Upload fallback<input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => event.target.files?.[0] && selectFile(event.target.files[0])} /></label></div>
    <div className="controls"><label>Reference target<select value={target} onChange={(event) => setTarget(event.target.value as TargetId)}>{TARGETS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Processing width<select value={width} onChange={(event) => setWidth(Number(event.target.value))}><option value="640">640 px</option><option value="1280">1280 px</option><option value="1920">1920 px</option></select></label><label>Brightness ({brightness})<input type="range" min="-100" max="100" value={brightness} onChange={(event) => setBrightness(Number(event.target.value))} /></label><label>Contrast ({contrast.toFixed(1)})<input type="range" min="0" max="3" step=".1" value={contrast} onChange={(event) => setContrast(Number(event.target.value))} /></label><label>Perspective points (optional)<input value={perspective} onChange={(event) => setPerspective(event.target.value)} placeholder="x,y; x,y; x,y; x,y" /></label></div>
    <div className="calibration"><h3>Physical map calibration</h3><p>Reference dimensions: 230 cm wide × 250 cm high. These values do not calibrate intrinsics or absolute scale by themselves.</p><label>Camera distance (cm)<input type="number" min="0" value={distance} onChange={(event) => setDistance(event.target.value)} /></label><label>Camera orientation<input value={orientation} onChange={(event) => setOrientation(event.target.value)} placeholder="Frontal, oblique…" /></label><label>Lighting conditions<input value={lighting} onChange={(event) => setLighting(event.target.value)} placeholder="Bright, dim, glare…" /></label><label>Visible area<select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option>entire map</option><option>particular region</option><option>partial / occluded</option></select></label><label>Observations<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Blur, glare, shadows, occlusion…" /></label></div>
    {metadata && <><div className="capture-meta"><strong>{source === 'camera' ? 'Camera capture' : 'Uploaded image'}</strong><span>{metadata.width} × {metadata.height}px · {metadata.format} · {(metadata.byte_size / 1024).toFixed(1)} KB</span><span>Target: {TARGETS.find((item) => item.id === target)?.label} · {capturedAt ? new Date(capturedAt).toLocaleString() : '—'}</span></div><div className="image-comparison"><figure><img src={originalUrl} alt="Original capture" /><figcaption>Original capture · preserved</figcaption></figure>{processedUrl ? <figure><img src={processedUrl} alt="Processed capture" /><figcaption>Processed preview</figcaption></figure> : <div className="empty-preview">Process to compare with the original.</div>}</div><div className="toolbar"><button onClick={process}>Process image</button><button className="secondary" onClick={reset}>Reset adjustments</button>{processedUrl && <a className="button secondary" href={processedUrl} download="colombia-processed.png">Download processed</a>}<button className="secondary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save capture record'}</button></div></>}
    <p className="feedback-text" role="status">{status}</p>
  </section>
}
