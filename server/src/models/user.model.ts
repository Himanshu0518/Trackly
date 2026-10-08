import mongoose, { Document, Schema } from "mongoose";
import { IUser, UserRole } from "../types/index.js";

const UserSchema = new Schema<IUser & Document>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    role: { type: String, enum: ["ADMIN", "MEMBER"] satisfies UserRole[], required: true },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser & Document>("User", UserSchema);

export default User;
