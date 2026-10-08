                    ┌──────────────┐
                    │    Signup    │
                    └──────┬───────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Create a Team   │
                  │ Role = ADMIN    | 
                  │ Member account  |
                  └────────┬────────┘
                           │
                           ▼
                 ┌──────────────────┐
                 │     Dashboard    │
                 └────────┬─────────┘
                          │
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
     Dashboard          Board           Settings
                                          │
                                          ▼
                                   Team Management
                                          │
                                   ┌──────┴──────┐
                                   ▼             ▼
                              Team Info      Members
                                             │
                                      Admin can add
                                         members


For existing users:
Login
  ↓
Find user's team
  ↓
Dashboard


2. Database Design
You only need three main collections.
User
{
  _id,
  name,
  email,
  passwordHash,
  teamId,
  role: "ADMIN" | "MEMBER",
  createdAt,
  updatedAt
}

Important:
A user belongs to one team.

Team
{
  _id,
  name,
  description,
  createdBy,
  createdAt,
  updatedAt
}

You don't actually need a members array because:
User.teamId → Team

lets you retrieve members.
That's cleaner and avoids keeping two sources of truth.



Issue
I'd actually call the collection Issue, rather than Bug, because you're supporting both bugs and features.

{
  _id,

  title,
  description,

  type: "BUG" | "FEATURE",

  status:
    "TODO" |
    "IN_PROGRESS" |
    "DONE",

  priority:
    "LOW" |
    "MEDIUM" |
    "HIGH" |
    "CRITICAL",

  createdBy,
  assignedTo,
  teamId,

  comments: [
    {
      userId,
      text,
      createdAt
    }
  ],

  createdAt,
  updatedAt
}