import { Request, Response } from "express";
import { Types } from "mongoose";
import { Notification } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/api-error.js";
import ApiResponse from "../utils/api-response.js";

// ─── GET /api/notifications ──────────────────────────────────────────────────
export const getNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, teamId } = req.user!;
    if (!teamId) throw new ApiError("You are not part of any team", 403);

    const {
      page = "1",
      limit = "25",
      unreadOnly = "false",
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {
      recipient: new Types.ObjectId(userId),
      teamId: new Types.ObjectId(teamId),
    };

    if (unreadOnly === "true") {
      filter.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate("sender", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Notification.countDocuments(filter),
      Notification.countDocuments({
        recipient: new Types.ObjectId(userId),
        teamId: new Types.ObjectId(teamId),
        read: false,
      }),
    ]);

    res.json(
      new ApiResponse(
        {
          notifications,
          total,
          unreadCount,
          page: pageNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
        "Notifications retrieved successfully"
      )
    );
  }
);

// ─── GET /api/notifications/unread-count ─────────────────────────────────────
export const getUnreadCount = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, teamId } = req.user!;
    if (!teamId) throw new ApiError("You are not part of any team", 403);

    const count = await Notification.countDocuments({
      recipient: new Types.ObjectId(userId),
      teamId: new Types.ObjectId(teamId),
      read: false,
    });

    res.json(new ApiResponse({ count }, "Unread notification count retrieved"));
  }
);

// ─── PATCH /api/notifications/:id/read ───────────────────────────────────────
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.user!;
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!id || !Types.ObjectId.isValid(id)) {
    throw new ApiError("Invalid notification ID", 400);
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: new Types.ObjectId(userId) },
    { $set: { read: true } },
    { new: true }
  ).populate("sender", "name email");

  if (!notification) {
    throw new ApiError("Notification not found", 404);
  }

  res.json(new ApiResponse(notification, "Notification marked as read"));
});

// ─── PATCH /api/notifications/read-all ───────────────────────────────────────
export const markAllAsRead = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, teamId } = req.user!;
    if (!teamId) throw new ApiError("You are not part of any team", 403);

    await Notification.updateMany(
      {
        recipient: new Types.ObjectId(userId),
        teamId: new Types.ObjectId(teamId),
        read: false,
      },
      { $set: { read: true } }
    );

    res.json(new ApiResponse(null, "All notifications marked as read"));
  }
);

// ─── DELETE /api/notifications/:id ───────────────────────────────────────────
export const deleteNotification = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.user!;
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!id || !Types.ObjectId.isValid(id)) {
      throw new ApiError("Invalid notification ID", 400);
    }

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: new Types.ObjectId(userId),
    });

    if (!notification) {
      throw new ApiError("Notification not found", 404);
    }

    res.json(new ApiResponse(null, "Notification deleted successfully"));
  }
);

// ─── DELETE /api/notifications ───────────────────────────────────────────────
export const clearAllNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, teamId } = req.user!;
    if (!teamId) throw new ApiError("You are not part of any team", 403);

    await Notification.deleteMany({
      recipient: new Types.ObjectId(userId),
      teamId: new Types.ObjectId(teamId),
    });

    res.json(new ApiResponse(null, "All notifications cleared"));
  }
);
