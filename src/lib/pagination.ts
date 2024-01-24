const perPageTotal = 20

export const getPaginationQueryParams = (page = 1) => {
  const skip = page > 1 ? (Math.ceil(page) - 1) * perPageTotal : 0

  return {
    take: perPageTotal,
    skip
  }
}
