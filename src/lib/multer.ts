export function arrayBufferToExpressMulterFile(
  arrayBuffer: ArrayBuffer,
  fileName: string,
  fileType: string): Express.Multer.File
{
  const blob = new Blob([arrayBuffer], { type: fileType })

  const file: Express.Multer.File = {
    fieldname: 'file',
    originalname: fileName,
    encoding: '7bit',
    mimetype: fileType,
    size: blob.size,
    buffer: Buffer.from(arrayBuffer),
    destination: '',
    filename: fileName,
    path: '',
    stream: undefined,
  }

  return file
}
