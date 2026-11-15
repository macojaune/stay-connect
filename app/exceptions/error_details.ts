/** Read error metadata without assuming that a thrown value is an Error. */
export function errorDetails(error: unknown) {
  const value = typeof error === 'object' && error !== null ? error : {}

  return {
    name: 'name' in value && typeof value.name === 'string' ? value.name : undefined,
    message:
      'message' in value && typeof value.message === 'string' ? value.message : String(error),
    stack: 'stack' in value && typeof value.stack === 'string' ? value.stack : undefined,
    code: 'code' in value && typeof value.code === 'string' ? value.code : undefined,
  }
}
