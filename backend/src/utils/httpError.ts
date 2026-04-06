export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export function isHttpError(e: unknown): e is HttpError {
  return e instanceof HttpError
}
