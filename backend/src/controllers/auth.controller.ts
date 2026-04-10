import type { Request, Response } from 'express'
import {
  claimAccountWithPassword,
  loginWithPassword,
  registerWithPassword,
} from '../services/auth.service'
import { sendError } from '../utils/respond'
import {
  parseAuthClaimBody,
  parseAuthLoginBody,
  parseAuthRegisterBody,
} from '../utils/validation'

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { handle, password } = parseAuthLoginBody(req.body as Record<string, unknown>)
    const user = await loginWithPassword(handle, password)
    res.json(user)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Login failed' })
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const body = parseAuthRegisterBody(req.body as Record<string, unknown>)
    const user = await registerWithPassword(body)
    res.json(user)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Registration failed' })
  }
}

export async function claim(req: Request, res: Response): Promise<void> {
  try {
    const body = parseAuthClaimBody(req.body as Record<string, unknown>)
    const user = await claimAccountWithPassword(body)
    res.json(user)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Could not secure account' })
  }
}
