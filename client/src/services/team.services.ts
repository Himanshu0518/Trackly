import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  TeamResponse,
  CreateTeamResponse,
  MembersResponse,
  CreateTeamPayload,
  UpdateTeamPayload,
  AddMemberPayload,
} from "@/types/user.types";

export const teamApi = createApi({
  reducerPath: "teamApi",
  tagTypes: ["Team", "Member"],
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    createTeam: builder.mutation<CreateTeamResponse, CreateTeamPayload>({
      query: (body) => ({ url: "/teams", method: "POST", body }),
      invalidatesTags: ["Team"],
    }),
    getMyTeam: builder.query<TeamResponse, void>({
      query: () => "/teams/my",
      providesTags: ["Team"],
    }),
    getTeamMembers: builder.query<MembersResponse, void>({
      query: () => "/teams/my/members",
      providesTags: ["Member"],
    }),
    updateTeam: builder.mutation<TeamResponse, UpdateTeamPayload>({
      query: (body) => ({ url: "/teams/my", method: "PATCH", body }),
      invalidatesTags: ["Team"],
    }),
    deleteTeam: builder.mutation<void, void>({
      query: () => ({ url: "/teams/my", method: "DELETE" }),
      invalidatesTags: ["Team", "Member"],
    }),
    addMember: builder.mutation<void, AddMemberPayload>({
      query: (body) => ({ url: "/teams/my/members", method: "POST", body }),
      invalidatesTags: ["Member"],
    }),
    removeMember: builder.mutation<void, string>({
      query: (memberId) => ({ url: `/teams/my/members/${memberId}`, method: "DELETE" }),
      invalidatesTags: ["Member"],
    }),
  }),
});

export const {
  useCreateTeamMutation,
  useGetMyTeamQuery,
  useGetTeamMembersQuery,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useAddMemberMutation,
  useRemoveMemberMutation,
} = teamApi;
