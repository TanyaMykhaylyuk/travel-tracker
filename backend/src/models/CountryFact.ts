import mongoose from "mongoose";

const countryFactSchema = new mongoose.Schema(
  {
    countryName: { type: String, required: true, unique: true, trim: true },
    facts: { type: [String], default: [] },
  },
  { timestamps: true }
);

export type CountryFactDoc = mongoose.InferSchemaType<typeof countryFactSchema>;

export const CountryFactModel =
  (mongoose.models.CountryFact as mongoose.Model<CountryFactDoc>) ??
  mongoose.model<CountryFactDoc>("CountryFact", countryFactSchema);
