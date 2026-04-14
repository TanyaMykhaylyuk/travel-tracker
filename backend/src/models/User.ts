import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    handle: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 64,
    },
    displayName: { type: String, default: "" },
    bio: { type: String, default: "" },
    photoDataUrl: { type: String, default: "" },
    visitedCountries: { type: [String], default: [] },
    visitedLandmarks: { type: [String], default: [] },
    countryPhotos: {
      type: [
        {
          countryCode: { type: String, required: true, uppercase: true, trim: true },
          countryName: { type: String, required: true, trim: true },
          photos: {
            type: [
              {
                id: { type: String, required: true, trim: true },
                dataUrl: { type: String, required: true },
                createdAt: { type: Date, default: Date.now },
              },
            ],
            default: [],
          },
        },
      ],
      default: [],
    },
    passwordHash: { type: String, default: "", select: false },
  },
  { timestamps: true }
);

export type UserDoc = mongoose.InferSchemaType<typeof userSchema>;

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserDoc>) ??
  mongoose.model<UserDoc>("User", userSchema);
