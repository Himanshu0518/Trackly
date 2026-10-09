import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "@/lib/base-query";
import type {
  SignupPayload,
  LoginPayload,
  AuthResponse,
  AuthUserData,
  MeUserData,
  MeResponse,
  AllUserResponse,
  UpdateMePayload,
  UserSearchResponse,
  MyStatsResponse,
} from "@/types/user.types";

export function userFromAuth(u: AuthUserData["user"]): MeUserData {
  return { _id: u.id, name: u.name, email: u.email, role: u.role, teamId: u.teamId };
}

export const userApi = createApi({
  reducerPath: "userApi",
  tagTypes: ["User"],
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    signUp: builder.mutation<AuthResponse, SignupPayload>({
      query: (body) => ({ url: "/auth/signup", method: "POST", body }),
    }),
    login: builder.mutation<AuthResponse, LoginPayload>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    currentUser: builder.query<MeResponse, void>({
      query: () => "/users/me",
      providesTags: ["User"],
    }),
    logOut: builder.mutation<MeResponse, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
    updateMe: builder.mutation<MeResponse, UpdateMePayload>({
      query: (body) => ({ url: "/users/me", method: "PATCH", body }),
      invalidatesTags: ["User"],
    }),
    getAllUsers: builder.query<AllUserResponse, void>({
      query: () => "/users",
      providesTags: ["User"],
    }),
    searchUsers: builder.query<UserSearchResponse, string>({
      query: (q) => `/users/search?q=${encodeURIComponent(q)}`,
    }),
    getMyStats: builder.query<MyStatsResponse, void>({
      query: () => "/users/me/stats",
      providesTags: ["User"],
    }),
  }),
});

export const {
  useSignUpMutation,
  useLoginMutation,
  useLogOutMutation,
  useUpdateMeMutation,
  useGetAllUsersQuery,
  useSearchUsersQuery,
  useGetMyStatsQuery,
} = userApi;
