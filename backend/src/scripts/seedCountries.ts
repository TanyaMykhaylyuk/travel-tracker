import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { CountryCollectionModel } from "../models/Country";

const GEOJSON_PATH = path.join(
  __dirname,
  "../../../frontend/public/datasets/ne_110m_admin_0_countries.geojson"
);

type RawGeoJson = {
  features?: unknown[];
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Set MONGODB_URI in backend/.env");
    process.exit(1);
  }

  const raw = fs.readFileSync(GEOJSON_PATH, "utf8");
  const parsed = JSON.parse(raw) as RawGeoJson;
  const features = Array.isArray(parsed.features) ? parsed.features : [];

  await mongoose.connect(uri);
  await CountryCollectionModel.findOneAndUpdate(
    { key: "default" },
    { key: "default", features },
    { upsert: true }
  );
  console.log(`Upserted countries dataset with ${features.length} features.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
