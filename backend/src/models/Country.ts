import mongoose from "mongoose";

const countryCollectionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    features: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export type CountryCollectionDoc = mongoose.InferSchemaType<
  typeof countryCollectionSchema
>;

export const CountryCollectionModel =
  (mongoose.models.CountryCollection as mongoose.Model<CountryCollectionDoc>) ??
  mongoose.model<CountryCollectionDoc>("CountryCollection", countryCollectionSchema);
