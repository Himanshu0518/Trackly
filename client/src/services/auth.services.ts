import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  SignupPayload,
  LoginPayload,
  AuthResponse,
  MeResponse,
  AllUserResponse,
  UpdateMePayload,
} from "@/types/user.types";

export const userApi = createApi({
  reducerPath: "userApi",
  tagTypes: ["User"],
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    signUp: builder.mutation<AuthResponse, SignupPayload>({
      query: (body) => ({ url: "/auth/signup", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    login: builder.mutation<AuthResponse, LoginPayload>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["User"],
    }),
    currentUser: builder.query<MeResponse, void>({
      query: () => "/users/me",
      providesTags: ["User"],
    }),
    logOut: builder.mutation<MeResponse, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(userApi.util.resetApiState());
        } catch (err) {
          console.error("Logout error:", err);
        }
      },
      invalidatesTags: ["User"],
    }),
    updateMe: builder.mutation<MeResponse, UpdateMePayload>({
      query: (body) => ({ url: "/users/me", method: "PATCH", body }),
      invalidatesTags: ["User"],
    }),
    getAllUsers: builder.query<AllUserResponse, void>({
      query: () => "/users",
      providesTags: ["User"],
    }),
  }),
});

export const {
  useSignUpMutation,
  useLoginMutation,
  useCurrentUserQuery,
  useLogOutMutation,
  useUpdateMeMutation,
  useGetAllUsersQuery,
} = userApi;
