/* global URL, console, process */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { loadImage } from '@napi-rs/canvas'
import { NodeOfflineCompiler } from './offline-compiler.mjs'

const targets = [
  'full-map.png',
  'caribean-region.png',
  'andes-region.png',
  'pacific-region.png',
  'orinoquia-region.png',
  'amazonas-region.png',
]
const root = new URL('../public/assets/targets/', import.meta.url)
const compiler = new NodeOfflineCompiler()
const images = []

for (const filename of targets) {
  const path = new URL(filename, root)
  const image = await loadImage(await readFile(path))
  images.push(image)
  console.log(`Loaded ${filename}: ${image.width}x${image.height}`)
}

await compiler.compileImageTargets(images, (progress) => process.stdout.write(`\rCompiling targets: ${progress.toFixed(1)}%`))
const output = await compiler.exportData()
await mkdir(new URL('../public/assets/tracking/', import.meta.url), { recursive: true })
await writeFile(new URL('../public/assets/tracking/colombia-targets.mind', import.meta.url), output)
console.log(`\nWrote colombia-targets.mind (${output.byteLength} bytes)`)
