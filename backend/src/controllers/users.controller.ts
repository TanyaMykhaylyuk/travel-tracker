import type { Request, Response } from 'express'
import {
  createOrUpdateUser,
  getUserById,
  patchUserVisits,
} from '../services/users.service'
import { sendError } from '../utils/respond'
import {
  parseCreateOrUpdateUserBody,
  parsePatchVisitsBody,
  paramUserId,
} from '../utils/validation'

export async function upsertUser(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>
  try {
    const parsed = parseCreateOrUpdateUserBody(body)
    const user = await createOrUpdateUser(parsed)
    res.json(user)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to save user' })
  }
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const id = paramUserId(req)
  try {
    const user = await getUserById(id)
    res.json(user)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to load user' })
  }
}

export async function patchVisits(req: Request, res: Response): Promise<void> {
  const id = paramUserId(req)
  const body = req.body as Record<string, unknown>
  try {
    const parsed = parsePatchVisitsBody(body)
    const data = await patchUserVisits(id, parsed)
    res.json(data)
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: 'Failed to update visits' })
  }
}
