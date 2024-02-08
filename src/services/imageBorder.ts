// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp')

import { readImageFile } from '../lib/fs'
import { arrayBufferToExpressMulterFile } from '../lib/multer'

const borderTopFramePath = '../assets/border_top_frame.png'
const border100pxMiddleFramePath = '../assets/border_100px_middle_frame.png'
const border10pxMiddleFramePath = '../assets/border_10px_middle_frame.png'
const border1pxMiddleFramePath = '../assets/border_1px_middle_frame.png'
const borderBottomFramePath = '../assets/border_bottom_frame.png'
const borderResizeWhitePath = '../assets/border_resize_white.png'
const borderResizeBluePath = '../assets/border_resize_blue.png'

const borderOffsets = {
  top: 37,
  left: 119,
  bottom: 94,
  right: 0
}

const imageMarginOffsets = {
  top: 6,
  left: 2,
  bottom: 10,
  right: 18
}

const maxAvailableArea = {
  width: 2000,
  height: 1000
}
// 129, 128, 129
export async function createBorderImage(borderlessImageFile: Express.Multer.File) {
  return new Promise<Express.Multer.File>((resolve, reject) => {
    (async () => {
      try {
        const resizedPaintImageBuffer = await resizeForImageBorder(borderlessImageFile?.buffer)
        const resizedPaintImage = sharp(resizedPaintImageBuffer)
        const { width: resizedPaintImageWidth, height: resizedPaintImageHeight } = await resizedPaintImage.metadata()

        const canvasWidth = resizedPaintImageWidth
          + borderOffsets.left + borderOffsets.right
          + imageMarginOffsets.left + imageMarginOffsets.right
        const canvasHeight = resizedPaintImageHeight
          + borderOffsets.top + borderOffsets.bottom
          + imageMarginOffsets.top + imageMarginOffsets.bottom

        const canvas = sharp({
          create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 4, // 4 channels for RGB color
            background: { r: 117, g: 117, b: 117, alpha: 1 }
          }
        }).png()
        
        const borderTopFrameBuffer = await readImageFile(borderTopFramePath)
        const { height: borderTopFrameHeight } = await sharp(borderTopFrameBuffer).metadata()
        const croppedBorderTopFrameBuffer = await sharp(borderTopFrameBuffer).extract({
          left: 0,
          top: 0,
          width: canvasWidth,
          height: borderTopFrameHeight
        }).toBuffer()

        const border100pxImageBuffer = await readImageFile(border100pxMiddleFramePath)
        const { height: border100pxImageHeight } = await sharp(border100pxImageBuffer).metadata()
        const croppedBorder100pxImageBuffer = await sharp(border100pxImageBuffer).extract({
          left: 0,
          top: 0,
          width: canvasWidth,
          height: border100pxImageHeight
        }).toBuffer()
        
        const border10pxImageBuffer = await readImageFile(border10pxMiddleFramePath)
        const { height: border10pxImageHeight } = await sharp(border10pxImageBuffer).metadata()
        const croppedBorder10pxImageBuffer = await sharp(border10pxImageBuffer).extract({
          left: 0,
          top: 0,
          width: canvasWidth,
          height: border10pxImageHeight
        }).toBuffer()

        const border1pxImageBuffer = await readImageFile(border1pxMiddleFramePath)
        const { height: border1pxImageHeight } = await sharp(border1pxImageBuffer).metadata()
        const croppedBorder1pxImageBuffer = await sharp(border1pxImageBuffer).extract({
          left: 0,
          top: 0,
          width: canvasWidth,
          height: border1pxImageHeight
        }).toBuffer()

        const borderBottomFrameBuffer = await readImageFile(borderBottomFramePath)
        const { height: borderBottomFrameHeight } = await sharp(borderBottomFrameBuffer).metadata()
        const croppedBorderBottomFrameBuffer = await sharp(borderBottomFrameBuffer).extract({
          left: 0,
          top: 0,
          width: canvasWidth,
          height: borderBottomFrameHeight
        }).toBuffer()

        const borderResizeWhiteBuffer = await readImageFile(borderResizeWhitePath)
        const borderResizeBlueBuffer = await readImageFile(borderResizeBluePath)

        const verticalHeightToFillWithBorder = canvasHeight - borderTopFrameHeight - borderBottomFrameHeight

        const { hundredsSectionCount, tensSectionCount, onesSectionCount } = calculateSectionCounts(verticalHeightToFillWithBorder)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const compositeItems: any[] = []
        let compositeTopOffset = 0

        compositeItems.push({
          input: croppedBorderTopFrameBuffer,
          left: 0,
          top: 0
        })
        compositeTopOffset = borderTopFrameHeight

        for (let i = 0; i < hundredsSectionCount; i++) {
          compositeItems.push({
            input: croppedBorder100pxImageBuffer,
            left: 0,
            top: compositeTopOffset
          })
          compositeTopOffset = compositeTopOffset + border100pxImageHeight
        }

        for (let i = 0; i < tensSectionCount; i++) {
          compositeItems.push({
            input: croppedBorder10pxImageBuffer,
            left: 0,
            top: compositeTopOffset
          })
          compositeTopOffset = compositeTopOffset + border10pxImageHeight
        }

        for (let i = 0; i < onesSectionCount; i++) {
          compositeItems.push({
            input: croppedBorder1pxImageBuffer,
            left: 0,
            top: compositeTopOffset
          })
          compositeTopOffset = compositeTopOffset + border1pxImageHeight
        }

        compositeItems.push({
          input: croppedBorderBottomFrameBuffer,
          left: 0,
          top: compositeTopOffset
        })
        compositeTopOffset = compositeTopOffset + borderBottomFrameHeight

        const paintImagePositionX = borderOffsets.left + imageMarginOffsets.left
        const paintImagePositionY = borderOffsets.top + imageMarginOffsets.top

        // const resizePixels = 

        const combinedImage = await canvas
          .composite([
            ...compositeItems,
            {
              input: resizedPaintImageBuffer,
              left: paintImagePositionX,
              top: paintImagePositionY
            }
          ])

        const finalImageBuffer = await combinedImage
          .extract({
            left: 0,
            top: 0,
            width: canvasWidth,
            height: canvasHeight
          })
          .toBuffer()

        const finalImageFile = arrayBufferToExpressMulterFile(finalImageBuffer, 'temp-border', 'image/png')

        resolve(finalImageFile)
      } catch (error) {
        reject(error)
      }
    })()
  })
}

async function resizeForImageBorder (borderlessImageBuffer: ArrayBuffer) {
  return new Promise((resolve, reject) => {
    const maxAvailableWidth = maxAvailableArea.width - borderOffsets.left - borderOffsets.right
      - imageMarginOffsets.left - imageMarginOffsets.right
    const maxAvailableHeight = maxAvailableArea.height - borderOffsets.top - borderOffsets.bottom
      - imageMarginOffsets.top - imageMarginOffsets.bottom

    sharp(borderlessImageBuffer)
      .resize(maxAvailableWidth, maxAvailableHeight, {
        fit: 'inside',
        kernel: sharp.kernel.lanczos3
      })
      .toBuffer((err, previewImageBuffer) => {
        if (err) {
          reject(err)
        } else {
          resolve(previewImageBuffer)
        }
      })
  })
}

function calculateSectionCounts(val: number) {
  const hundredsSectionCount = Math.floor(val / 100)
  const tensSectionCount = Math.floor((val % 100) / 10)
  const onesSectionCount = val % 10

  return { hundredsSectionCount, tensSectionCount, onesSectionCount }
}
