import mongoose, { Document, Schema } from "mongoose";
import { ITeam } from "../types/index.js";

const TeamSchema = new Schema<ITeam & Document>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Team = mongoose.model<ITeam & Document>("Team", TeamSchema);

export default Team;
