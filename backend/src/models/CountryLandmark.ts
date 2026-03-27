import mongoose from "mongoose";

const landmarkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const countryLandmarkSchema = new mongoose.Schema({
  isoA2: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    maxlength: 2,
  },
  countryName: { type: String, required: true },
  landmarks: { type: [landmarkSchema], default: [] },
});

export type CountryLandmark = mongoose.InferSchemaType<
  typeof countryLandmarkSchema
>;

export const CountryLandmarkModel =
  (mongoose.models.CountryLandmark as mongoose.Model<CountryLandmark>) ??
  mongoose.model<CountryLandmark>("CountryLandmark", countryLandmarkSchema);
