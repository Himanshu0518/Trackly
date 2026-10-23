import mongoose, { Document, Schema } from "mongoose";
import {
  IComment,
  IIssue,
  IssuePriority,
  IssueStatus,
  IssueType,
} from "../types/index.js";

const CommentSchema = new Schema<IComment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ActivitySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["CREATED", "STATUS_CHANGE", "PRIORITY_CHANGE", "ASSIGNMENT_CHANGE"],
      required: true,
    },
    field: { type: String },
    oldValue: { type: String },
    newValue: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const IssueSchema = new Schema<IIssue & Document>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["BUG", "FEATURE"] satisfies IssueType[],
      required: true,
    },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "DONE"] satisfies IssueStatus[],
      default: "TODO",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] satisfies IssuePriority[],
      default: "MEDIUM",
    },
    dueDate: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true },
    comments: { type: [CommentSchema], default: [] },
    activities: { type: [ActivitySchema], default: [] },
  },
  { timestamps: true }
);

const Issue = mongoose.model<IIssue & Document>("Issue", IssueSchema);

export default Issue;
