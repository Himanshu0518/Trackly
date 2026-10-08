/**
 * Seed script — creates two test accounts, a team, and realistic issues.
 *
 * Test credentials (printed at the end):
 *   Admin  → admin@trackly.dev  / Admin123!
 *   Member → member@trackly.dev / Member123!
 *
 * Run:
 *   pnpm tsx src/seed.ts
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env relative to this file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const DATABASE_URI = process.env.DATABASE_URI ?? "";
if (!DATABASE_URI) {
  console.error("❌  DATABASE_URI is not set in .env");
  process.exit(1);
}

// ─── Inline model definitions (avoids ESM alias issues in the script) ─────────

const CommentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
    },
    role: { type: String, enum: ["ADMIN", "MEMBER"], required: true },
  },
  { timestamps: true }
);

const TeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const IssueSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { type: String, enum: ["BUG", "FEATURE"], required: true },
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "DONE"],
      default: "TODO",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "MEDIUM",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },
    comments: { type: [CommentSchema], default: [] },
  },
  { timestamps: true }
);

// Use existing models if already registered (safe for re-runs)
const User = mongoose.models["User"] ?? mongoose.model("User", UserSchema);
const Team = mongoose.models["Team"] ?? mongoose.model("Team", TeamSchema);
const Issue = mongoose.models["Issue"] ?? mongoose.model("Issue", IssueSchema);

// ─── Seed data ────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = "admin@trackly.dev";
const MEMBER_EMAIL = "member@trackly.dev";
const PASSWORD_ADMIN = "Admin123!";
const PASSWORD_MEMBER = "Member123!";

async function main() {
  await mongoose.connect(DATABASE_URI);
  console.log("✅  Connected to MongoDB");

  // ── Clean up previous seed (idempotent) ──────────────────────────────────
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing?.teamId) {
    const teamId = existing.teamId;
    await Issue.deleteMany({ teamId });
    await User.deleteMany({ email: { $in: [ADMIN_EMAIL, MEMBER_EMAIL] } });
    await Team.findByIdAndDelete(teamId);
    console.log("🗑   Cleared previous seed data");
  } else if (existing) {
    await User.deleteMany({ email: { $in: [ADMIN_EMAIL, MEMBER_EMAIL] } });
  }

  // ── Create users (no teamId yet) ─────────────────────────────────────────
  const [adminHash, memberHash] = await Promise.all([
    bcrypt.hash(PASSWORD_ADMIN, 10),
    bcrypt.hash(PASSWORD_MEMBER, 10),
  ]);

  const admin = await User.create({
    name: "Alex Admin",
    email: ADMIN_EMAIL,
    passwordHash: adminHash,
    role: "ADMIN",
    teamId: null,
  });

  const member = await User.create({
    name: "Morgan Member",
    email: MEMBER_EMAIL,
    passwordHash: memberHash,
    role: "MEMBER",
    teamId: null,
  });

  // ── Create team ───────────────────────────────────────────────────────────
  const team = await Team.create({
    name: "Trackly Core",
    description: "Main engineering team working on the Trackly platform.",
    createdBy: admin._id,
  });

  // ── Link both users to the team ───────────────────────────────────────────
  await User.updateMany(
    { _id: { $in: [admin._id, member._id] } },
    { $set: { teamId: team._id } }
  );

  // ── Seed issues ───────────────────────────────────────────────────────────
  const issues = [
    // ── Bugs ────────────────────────────────────────────────────────────────
    {
      title: "Login page doesn't redirect after successful auth",
      description:
        "After entering correct credentials and clicking Sign in, the button shows a spinner but the page never redirects. Tested on Chrome 124 and Firefox 126. The /users/me call returns 200 but navigation is not triggered.",
      type: "BUG",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      createdBy: admin._id,
      assignedTo: admin._id,
      comments: [
        {
          userId: member._id,
          text: "I can reproduce this. Looks like the navigate() call inside the onSubmit handler is not being reached.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
        },
        {
          userId: admin._id,
          text: "Confirmed — it's a race condition between the refetch() promise and the dispatch. Working on a fix now.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1),
        },
      ],
    },
    {
      title: "Password field shows plaintext on autofill",
      description:
        "When the browser autofills the password field, the text is briefly visible before the masking takes effect. This happens on Safari 17 with saved passwords.",
      type: "BUG",
      status: "TODO",
      priority: "HIGH",
      createdBy: member._id,
      assignedTo: admin._id,
      comments: [
        {
          userId: admin._id,
          text: "This is a browser quirk with the PasswordInput component. We should delay showing the eye icon until mount is complete.",
          createdAt: new Date(Date.now() - 1000 * 60 * 30),
        },
      ],
    },
    {
      title: "Dashboard kanban columns don't scroll independently",
      description:
        "When there are more than ~8 issues in a single column, the column expands the entire page height rather than scrolling within its own container. Expected: each column should be independently scrollable with overflow-y-auto.",
      type: "BUG",
      status: "TODO",
      priority: "MEDIUM",
      createdBy: member._id,
      assignedTo: member._id,
      comments: [],
    },
    {
      title: "Issue detail page crashes when assignedTo is null",
      description:
        "Navigating to /issues/:id for an issue with no assignee throws a TypeError: Cannot read properties of null (reading '_id'). The IssueDetailPage component does not guard against a null assignedTo value in the sidebar select.",
      type: "BUG",
      status: "DONE",
      priority: "HIGH",
      createdBy: admin._id,
      assignedTo: member._id,
      comments: [
        {
          userId: member._id,
          text: "Fixed by adding a null check before accessing assignedTo._id in the Select value prop.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        },
      ],
    },
    {
      title: "CORS error when calling /api/auth/logout in production",
      description:
        "The logout endpoint works fine in development but returns a CORS error in the staging environment. The issue is that the production CLIENT_URL env variable is missing the trailing slash, causing the origin check to fail.",
      type: "BUG",
      status: "DONE",
      priority: "CRITICAL",
      createdBy: admin._id,
      assignedTo: admin._id,
      comments: [
        {
          userId: admin._id,
          text: "Resolved by trimming trailing slashes from CLIENT_URL before passing to cors() options.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        },
      ],
    },
    {
      title: "Team page shows stale member list after removing a member",
      description:
        "After clicking Remove on a team member, the UI shows success toast but the member still appears in the list until the page is refreshed. The RTK Query tag invalidation for 'Member' is not triggering a refetch.",
      type: "BUG",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      createdBy: member._id,
      assignedTo: admin._id,
      comments: [],
    },
    {
      title: "Filter state resets when navigating back to Issues page",
      description:
        "If you apply status and priority filters on the Issues page, then navigate to an issue detail and press Back, all filters are reset to their default values. Expected: filters should persist for the session.",
      type: "BUG",
      status: "TODO",
      priority: "LOW",
      createdBy: member._id,
      assignedTo: null,
      comments: [],
    },

    // ── Features ─────────────────────────────────────────────────────────────
    {
      title: "Add issue search / full-text filter",
      description:
        "Users need to be able to search issues by title keyword. Add a search input to the Issues page that filters the list client-side (or sends a query param to the API). Should debounce the input to avoid excessive re-renders.",
      type: "FEATURE",
      status: "TODO",
      priority: "HIGH",
      createdBy: admin._id,
      assignedTo: member._id,
      comments: [
        {
          userId: member._id,
          text: "I'll implement this client-side first with a simple .filter() on the issues array. We can add server-side search later.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
        },
      ],
    },
    {
      title: "Drag-and-drop between kanban columns",
      description:
        "Allow users to drag issue cards between TODO, IN_PROGRESS, and DONE columns on the Dashboard. Should call PATCH /issues/:id with the new status on drop. Consider using @dnd-kit/core for accessibility.",
      type: "FEATURE",
      status: "TODO",
      priority: "HIGH",
      createdBy: admin._id,
      assignedTo: null,
      comments: [],
    },
    {
      title: "Email notifications for issue assignments",
      description:
        "When a user is assigned to an issue (either on creation or via update), send them an email notification. Use Resend or Nodemailer with a clean transactional template. Respect a per-user notification preference flag.",
      type: "FEATURE",
      status: "TODO",
      priority: "MEDIUM",
      createdBy: admin._id,
      assignedTo: null,
      comments: [
        {
          userId: admin._id,
          text: "We'll need to add a notificationsEnabled boolean to the User model first.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
        },
      ],
    },
    {
      title: "Activity log on issue detail",
      description:
        "Show a chronological timeline of changes on each issue: status changes, reassignments, and new comments. Store history entries in a sub-array on the Issue document. Display in a Timeline component on IssueDetailPage.",
      type: "FEATURE",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      createdBy: member._id,
      assignedTo: member._id,
      comments: [
        {
          userId: admin._id,
          text: "The schema change looks good. Let's make sure we're not bloating the Issue document for high-activity issues — maybe cap history at 50 entries.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8),
        },
        {
          userId: member._id,
          text: "Agreed. I'll add a $slice on the push operation.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        },
      ],
    },
    {
      title: "Dark mode persistence across sessions",
      description:
        "The theme toggle currently resets to light mode on page refresh. Persist the theme preference in localStorage and apply it before the first render to avoid flash of unstyled content (FOUC).",
      type: "FEATURE",
      status: "DONE",
      priority: "LOW",
      createdBy: member._id,
      assignedTo: member._id,
      comments: [
        {
          userId: member._id,
          text: "Implemented via a useTheme hook that reads from localStorage and applies the dark class to <html> before mount.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
      ],
    },
    {
      title: "Add pagination to the Issues list",
      description:
        "The GET /issues endpoint returns all issues for a team. Add limit/offset (or page/pageSize) query params to the server, and implement pagination controls (Previous / Next or a page number bar) on the Issues page.",
      type: "FEATURE",
      status: "TODO",
      priority: "MEDIUM",
      createdBy: admin._id,
      assignedTo: null,
      comments: [],
    },
    {
      title: "Export issues to CSV",
      description:
        "Add an Export button to the Issues page that downloads the current filtered list as a CSV file. Fields to include: ID, title, type, status, priority, assignedTo, createdBy, createdAt.",
      type: "FEATURE",
      status: "TODO",
      priority: "LOW",
      createdBy: admin._id,
      assignedTo: null,
      comments: [],
    },
    {
      title: "Member invite via email link",
      description:
        "Replace the current Add Member (by user ID) flow with an email-based invite. Admin enters an email address, server generates a signed invite token, and sends a link. The invitee clicks the link, registers (or logs in), and is automatically added to the team.",
      type: "FEATURE",
      status: "TODO",
      priority: "HIGH",
      createdBy: admin._id,
      assignedTo: null,
      comments: [
        {
          userId: admin._id,
          text: "This will significantly improve onboarding. We'll need an InviteToken model and a new /invites router.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        },
      ],
    },
  ];

  await Issue.insertMany(issues.map((i) => ({ ...i, teamId: team._id })));

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅  Seed complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("  Team      : Trackly Core");
  console.log(`  Issues    : ${issues.length} seeded`);
  console.log("");
  console.log("  👤 Admin account");
  console.log(`     Email    : ${ADMIN_EMAIL}`);
  console.log(`     Password : ${PASSWORD_ADMIN}`);
  console.log(`     Role     : ADMIN`);
  console.log("");
  console.log("  👤 Member account");
  console.log(`     Email    : ${MEMBER_EMAIL}`);
  console.log(`     Password : ${PASSWORD_MEMBER}`);
  console.log(`     Role     : MEMBER`);
  console.log("");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌  Seed failed:", err);
  process.exit(1);
});
