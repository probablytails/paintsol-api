export const getFileExtension = (file: Express.Multer.File) => {
  const originalFileName = file.originalname
  const fileExtension = originalFileName?.split('.').pop()
  return fileExtension
}
