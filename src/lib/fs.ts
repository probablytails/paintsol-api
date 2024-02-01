// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')

const getFilePath = (filePath: string) => {
  return path.join(__dirname, filePath)
}

export function readImageFile(filePath: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const finalFilePath = getFilePath(filePath)
    fs.readFile(finalFilePath, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
