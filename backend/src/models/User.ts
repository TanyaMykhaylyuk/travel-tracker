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
  },
  { timestamps: true }
);

export type UserDoc = mongoose.InferSchemaType<typeof userSchema>;

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserDoc>) ??
  mongoose.model<UserDoc>("User", userSchema);
