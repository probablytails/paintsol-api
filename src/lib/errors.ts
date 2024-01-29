export const isError = (err: unknown): err is Error => err instanceof Error

export const handleThrowError = (error: unknown) => {
  if (isError(error)) {
    console.error('Error creating Image:', error.message)
    throw new Error(error.message)
  } else {
    console.error('Error object has an invalid type', error)
    throw new Error('Unknown error type')
  }
}

export const handleLogError = (str: string) => {
  console.log(str)
}
