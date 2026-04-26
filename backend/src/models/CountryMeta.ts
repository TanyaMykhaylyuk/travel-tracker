import mongoose from 'mongoose'

const countryMetaSchema = new mongoose.Schema(
  {
    isoA2: { type: String, required: true, unique: true, uppercase: true, trim: true },
    countryName: { type: String, required: true, trim: true },
    capital: { type: String, required: true, trim: true },
    currency: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

export type CountryMetaDoc = mongoose.InferSchemaType<typeof countryMetaSchema>

export const CountryMetaModel =
  (mongoose.models.CountryMeta as mongoose.Model<CountryMetaDoc>) ??
  mongoose.model<CountryMetaDoc>('CountryMeta', countryMetaSchema)
