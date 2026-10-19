import { CompilerBase } from 'mind-ar/src/image-target/compiler-base.js'
import { buildTrackingImageList } from 'mind-ar/src/image-target/image-list.js'
import { extractTrackingFeatures } from 'mind-ar/src/image-target/tracker/extract-utils.js'
import '@napi-rs/canvas'
import 'mind-ar/src/image-target/detector/kernels/cpu/index.js'
import { createCanvas } from '@napi-rs/canvas'

export class NodeOfflineCompiler extends CompilerBase {
  createProcessCanvas(image) { return createCanvas(image.width, image.height) }

  compileTrack({ progressCallback, targetImages, basePercent }) {
    const percentPerImage = (100 - basePercent) / targetImages.length
    let percent = 0
    const list = targetImages.map((targetImage) => {
      const imageList = buildTrackingImageList(targetImage)
      const percentPerAction = percentPerImage / imageList.length
      const trackingData = extractTrackingFeatures(imageList, () => {
        percent += percentPerAction
        progressCallback(basePercent + percent)
      })
      return trackingData
    })
    return Promise.resolve(list)
  }
}
