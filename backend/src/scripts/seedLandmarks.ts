import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import mongoose from "mongoose";
import { CountryLandmarkModel } from "../models/CountryLandmark";
import { resolveCsvCountryToIso } from "../lib/resolveCountryIso";

const CSV_PATH = path.join(
  __dirname,
  "../../data/all_195_countries_landmarks.csv"
);

const LANDMARK_KEYS = [
  "landmark1",
  "landmark2",
  "landmark3",
  "landmark4",
  "landmark5",
  "landmark6",
] as const;

type CsvRow = Record<string, string>;

function buildLandmarks(isoA2: string, row: CsvRow) {
  const lower = isoA2.toLowerCase();
  const out: { id: string; name: string }[] = [];
  let i = 0;
  for (const key of LANDMARK_KEYS) {
    const name = row[key]?.trim();
    if (!name) continue;
    out.push({ id: `${lower}-l${i}`, name });
    i += 1;
  }
  return out;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI in backend/.env");
    process.exit(1);
  }

  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true }) as CsvRow[];

  await mongoose.connect(uri);

  let upserted = 0;
  const unresolved: string[] = [];

  for (const row of rows) {
    const countryName = row.country?.trim();
    if (!countryName) continue;
    const isoA2 = resolveCsvCountryToIso(countryName);
    if (!isoA2) {
      unresolved.push(countryName);
      continue;
    }
    const landmarks = buildLandmarks(isoA2, row);
    await CountryLandmarkModel.findOneAndUpdate(
      { isoA2: isoA2.toUpperCase() },
      {
        isoA2: isoA2.toUpperCase(),
        countryName,
        landmarks,
      },
      { upsert: true }
    );
    upserted += 1;
  }

  console.log(`Upserted ${upserted} countries.`);
  if (unresolved.length) {
    console.warn("Unresolved CSV names:", unresolved);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
