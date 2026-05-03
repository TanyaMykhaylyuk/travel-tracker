import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import mongoose from "mongoose";
import { CountryLandmarkModel } from "../models/CountryLandmark";
import { resolveCsvCountryToIso } from "../lib/resolveCountryIso";
import { getWorldTravelIsoCountries } from "../lib/travelProgressUniverse";

const LANDMARKS_CSV_PATH = path.join(
  __dirname,
  "../../data/all_195_countries_landmarks.csv"
);

const EXTRA_CSV_PATH = path.join(
  __dirname,
  "../../data/globe_extra_territories_landmarks.csv"
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

function buildLandmarkCsvByIso(rows: CsvRow[], unresolved: string[]): Map<string, CsvRow> {
  const map = new Map<string, CsvRow>();
  for (const row of rows) {
    const label = row.country?.trim();
    if (!label) continue;
    const iso = resolveCsvCountryToIso(label);
    if (!iso) {
      unresolved.push(label);
      continue;
    }
    const upper = iso.toUpperCase();
    if (!/^[A-Z]{2}$/.test(upper)) {
      unresolved.push(`${label} (bad iso: ${iso})`);
      continue;
    }
    map.set(upper, row);
  }
  return map;
}

async function upsertLandmarkRows(
  rows: CsvRow[],
  resolveIso: (row: CsvRow, countryName: string) => string | null,
  unresolved: string[]
): Promise<number> {
  let upserted = 0;
  for (const row of rows) {
    const countryName = row.country?.trim();
    if (!countryName) continue;
    const isoA2 = resolveIso(row, countryName);
    if (!isoA2) {
      unresolved.push(countryName);
      continue;
    }
    const upper = isoA2.toUpperCase();
    if (!/^[A-Z]{2}$/.test(upper)) {
      unresolved.push(`${countryName} (bad iso: ${isoA2})`);
      continue;
    }
    const landmarks = buildLandmarks(upper, row);
    await CountryLandmarkModel.findOneAndUpdate(
      { isoA2: upper },
      {
        isoA2: upper,
        countryName,
        landmarks,
      },
      { upsert: true }
    );
    upserted += 1;
  }
  return upserted;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI in backend/.env");
    process.exit(1);
  }

  const raw = fs.readFileSync(LANDMARKS_CSV_PATH, "utf8");
  const csvRows = parse(raw, { columns: true, skip_empty_lines: true }) as CsvRow[];

  await mongoose.connect(uri);

  const unresolved: string[] = [];
  const landmarkCsvByIso = buildLandmarkCsvByIso(csvRows, unresolved);

  const travel = getWorldTravelIsoCountries();
  let upserted = 0;
  for (const c of travel) {
    const iso = c.cca2.toUpperCase();
    const row = landmarkCsvByIso.get(iso);
    const landmarks = row ? buildLandmarks(iso, row) : [];
    const countryName = row?.country?.trim() || c.name.common;
    await CountryLandmarkModel.findOneAndUpdate(
      { isoA2: iso },
      {
        isoA2: iso,
        countryName,
        landmarks,
      },
      { upsert: true }
    );
    upserted += 1;
  }

  const travelIso = new Set(travel.map((x) => x.cca2.toUpperCase()));
  const csvOnly = [...landmarkCsvByIso.keys()].filter((iso) => !travelIso.has(iso));
  if (csvOnly.length) {
    console.warn("CSV landmark rows whose ISO is not in UN+PSE travel set (ignored):", csvOnly);
  }

  if (fs.existsSync(EXTRA_CSV_PATH)) {
    const extraRaw = fs.readFileSync(EXTRA_CSV_PATH, "utf8");
    const extraRows = parse(extraRaw, {
      columns: true,
      skip_empty_lines: true,
    }) as CsvRow[];
    const extraUpserts = await upsertLandmarkRows(
      extraRows,
      (row) => row.isoA2?.trim() ?? null,
      unresolved
    );
    upserted += extraUpserts;
    if (extraUpserts > 0) {
      console.log(
        "Globe extras: JY/JZ in DB are internal isoA2 keys for Northern Cyprus and Somaliland (NE ISO_A2=-99); the client loads landmarks by country name."
      );
    }
  }

  console.log(
    `Upserted ${upserted} countries (world-countries UN+PSE set + optional globe extras; CSV supplies landmark text).`
  );
  if (unresolved.length) {
    console.warn("Unresolved CSV country labels:", unresolved);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
