import type { Request, Response } from "express";
import { getCountryFactsByCountryName } from "../services/countryFacts.service";
import { sendError } from "../utils/respond";
import { paramCountryName } from "../utils/validation";

export async function getCountryFactsByName(
  req: Request,
  res: Response
): Promise<void> {
  const raw = paramCountryName(req);
  const normalized = raw.trim();
  if (!normalized) {
    res.status(400).json({ error: "Country name is required" });
    return;
  }

  try {
    const data = await getCountryFactsByCountryName(normalized);
    res.json(data);
  } catch (e: unknown) {
    sendError(res, e, { status: 500, message: "Failed to load country facts" });
  }
}
