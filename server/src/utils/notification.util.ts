import { Types } from "mongoose";
import { Notification, User } from "../models/index.js";
import { NotificationType } from "../types/index.js";

export interface CreateNotificationParams {
  recipient: Types.ObjectId | string;
  sender: Types.ObjectId | string;
  teamId: Types.ObjectId | string;
  issueId: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Creates a notification record safely without throwing if error occurs
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    // Prevent self-notifications
    if (params.recipient.toString() === params.sender.toString()) {
      return null;
    }

    const notification = await Notification.create({
      recipient: new Types.ObjectId(params.recipient),
      sender: new Types.ObjectId(params.sender),
      teamId: new Types.ObjectId(params.teamId),
      issueId: new Types.ObjectId(params.issueId),
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link ?? `/issues/${params.issueId}`,
      read: false,
    });

    return notification;
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}

/**
 * Parses @mentions in text and finds corresponding team members.
 * Supports:
 * - @Name (e.g., @Himanshu or @John)
 * - @FullName (e.g., @John Doe or @John_Doe)
 * - @email (e.g., @john@example.com or @john)
 * - @[Name](id)
 *
 * Matches are word-boundary aware: "@johnson" no longer triggers a mention
 * for a member named "John".
 */
export async function findMentionedUsers(text: string, teamId: Types.ObjectId | string) {
  if (!text || !text.includes("@")) return [];

  try {
    const teamMembers = await User.find({ teamId }).select("_id name email");
    const mentionedUsers: typeof teamMembers = [];

    // Extract all @ tokens from the text
    // Matches @[User Name](userId) or @username / @word
    const explicitIdRegex = /@\[([^\]]+)\]\(([a-fA-F0-9]{24})\)/g;
    let match;
    const explicitIds = new Set<string>();

    while ((match = explicitIdRegex.exec(text)) !== null) {
      explicitIds.add(match[2]);
    }

    const normalizedText = text.toLowerCase();

    for (const member of teamMembers) {
      const memberIdStr = member._id.toString();
      if (explicitIds.has(memberIdStr)) {
        mentionedUsers.push(member);
        continue;
      }

      // Check name variants: @John Doe, @John, @john_doe
      const nameParts = member.name.toLowerCase().split(/\s+/);
      const fullNameClean = member.name.toLowerCase().replace(/\s+/g, "");
      const fullNameUnderscore = member.name.toLowerCase().replace(/\s+/g, "_");
      const emailPrefix = member.email.toLowerCase().split("@")[0];

      const patterns = [
        `@${member.name.toLowerCase()}`,
        `@${fullNameClean}`,
        `@${fullNameUnderscore}`,
        `@${emailPrefix}`,
      ];

      // If user has first name >= 3 chars, also allow @FirstName
      if (nameParts[0] && nameParts[0].length >= 3) {
        patterns.push(`@${nameParts[0]}`);
      }

      // Each pattern must be followed by a non-word character (or end of
      // string) so "@john" doesn't match inside "@johnson". Patterns can
      // contain spaces/underscores, so escape them for the regex.
      const isMentioned = patterns.some((pat) => {
        const escaped = pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`${escaped}(?![\w-])`).test(normalizedText);
      });
      if (isMentioned) {
        mentionedUsers.push(member);
      }
    }

    // Deduplicate by _id
    const seen = new Set<string>();
    return mentionedUsers.filter((u) => {
      const id = u._id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  } catch (err) {
    console.error("Error parsing mentions:", err);
    return [];
  }
}
