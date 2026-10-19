type Props = { onFile: (file: File) => void; disabled?: boolean }
export function ImageInput({ onFile, disabled }: Props) { return <section className="panel"><h2>Camera or image input</h2><p>Upload an image to send it to the detection service.</p><input disabled={disabled} type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) onFile(file) }} /></section> }

