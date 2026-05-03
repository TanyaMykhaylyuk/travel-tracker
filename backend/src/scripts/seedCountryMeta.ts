import "dotenv/config";
import mongoose from "mongoose";
import countries from "world-countries";
import type { Country } from "world-countries";
import { CountryLandmarkModel } from "../models/CountryLandmark";
import { CountryMetaModel } from "../models/CountryMeta";

const countryByCca2 = new Map(
  countries.map((c) => [String(c.cca2 || "").toUpperCase(), c] as const)
);

function resolveCurrencyCode(country: Country): string | null {
  const codes = Object.keys(country.currencies ?? {});
  return codes[0] ?? null;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const landmarkDocs = await CountryLandmarkModel.find(
    {},
    { isoA2: 1, countryName: 1 }
  ).lean();

  const allowedIso = landmarkDocs
    .map((d) => String(d.isoA2 ?? "").trim().toUpperCase())
    .filter((iso) => /^[A-Z]{2}$/.test(iso));

  const removed = await CountryMetaModel.deleteMany({
    isoA2: { $nin: allowedIso },
  });

  let upserted = 0;
  const unresolved: string[] = [];

  for (const doc of landmarkDocs) {
    const isoA2 = String(doc.isoA2 ?? "")
      .trim()
      .toUpperCase();
    if (!/^[A-Z]{2}$/.test(isoA2)) {
      unresolved.push(`${doc.countryName} (iso: ${doc.isoA2})`);
      continue;
    }

    const countryName = String(doc.countryName ?? "").trim() || isoA2;
    const wc = countryByCca2.get(isoA2);

    let capital: string;
    let currency: string;

    if (wc) {
      const cap = wc.capital?.[0]?.trim();
      const cur = resolveCurrencyCode(wc);
      if (cap && cur) {
        capital = cap;
        currency = cur;
      } else {
        capital = cap || countryName;
        currency = cur || "XXX";
      }
    } else {
      capital = countryName;
      currency = "XXX";
    }

    await CountryMetaModel.findOneAndUpdate(
      { isoA2 },
      {
        isoA2,
        countryName,
        capital,
        currency,
      },
      { upsert: true }
    );
    upserted += 1;
  }

  console.log(
    `Removed ${removed.deletedCount} country meta rows not in CountryLandmark. Upserted ${upserted} (one per landmark; matches progress set).`
  );
  if (unresolved.length) {
    console.warn("Skipped invalid isoA2:", unresolved);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
