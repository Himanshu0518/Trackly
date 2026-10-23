import mongoose, { Document, Schema } from "mongoose";
import { INotification, NotificationType } from "../types/index.js";

const NotificationSchema = new Schema<INotification & Document>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    teamId: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    issueId: { type: Schema.Types.ObjectId, ref: "Issue", required: true },
    type: {
      type: String,
      enum: [
        "TASK_ASSIGNED",
        "MENTIONED_IN_COMMENT",
        "STATUS_CHANGED",
        "PRIORITY_CHANGED",
        "COMMENT_ADDED",
      ] satisfies NotificationType[],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
    link: { type: String, default: "" },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, read: 1 });

const Notification = mongoose.model<INotification & Document>(
  "Notification",
  NotificationSchema
);

export default Notification;
