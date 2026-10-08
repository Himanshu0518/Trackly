import { Request, Response } from "express";
import { User } from "@/models/index.js";
import { hashPassword, comparePassword, createAuthToken } from "@/utils/user-utils.js";
import { asyncHandler } from "@/utils/asyncHandler.js";
import { accessTokenCookieOptions } from "@/utils/cookie-options.js";
import { SignupBody, LoginBody } from "@/validators/auth.validator.js";
import ApiError from "@/utils/api-error.js";
import ApiResponse from "@/utils/api-response.js";

// POST /api/auth/signup
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as SignupBody;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError("Email already in use", 409);
  }

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "MEMBER",
    teamId: null,
  });

  const token = createAuthToken(
    user._id.toString(),
    user.role,
    user.teamId ? user.teamId.toString() : null
  );

  res
    .status(201)
    .cookie("accessToken", token, accessTokenCookieOptions)
    .json(
      new ApiResponse(
        {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            teamId: user.teamId,
          },
        },
        "Account created successfully"
      )
    );
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginBody;

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError("Invalid credentials", 401);
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError("Invalid credentials", 401);
  }

  const token = createAuthToken(
    user._id.toString(),
    user.role,
    user.teamId ? user.teamId.toString() : null
  );

  res
    .cookie("accessToken", token, accessTokenCookieOptions)
    .json(
      new ApiResponse(
        {
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            teamId: user.teamId,
          },
        },
        "Login successful"
      )
    );
});

// POST /api/auth/logout
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res
    .clearCookie("accessToken", accessTokenCookieOptions)
    .json(new ApiResponse(null, "Logged out successfully"));
});
