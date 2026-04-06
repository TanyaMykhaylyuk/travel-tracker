import type { Response } from 'express'
import { isHttpError } from './httpError'

export function sendError(
  res: Response,
  err: unknown,
  fallback: { status: number; message: string }
): void {
  if (isHttpError(err)) {
    res.status(err.status).json({ error: err.message })
    return
  }
  res.status(fallback.status).json({ error: fallback.message })
}
