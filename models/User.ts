import { Schema, model, models, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    avatarUrl: { type: String, default: null },
    googleId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof UserSchema>;

export default models.User ?? model("User", UserSchema);
