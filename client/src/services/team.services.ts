import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "@/lib/base-query";
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
  baseQuery: baseQueryWithAuth,
  // Team data changes rarely — keep it around across page switches
  keepUnusedDataFor: 300,
  endpoints: (builder) => ({
    createTeam: builder.mutation<CreateTeamResponse, CreateTeamPayload>({
      query: (body) => ({ url: "/teams", method: "POST", body }),
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
    // The endpoint doesn't return the full member, so refetch the list once.
    addMember: builder.mutation<void, AddMemberPayload>({
      query: (body) => ({ url: "/teams/my/members", method: "POST", body }),
      invalidatesTags: ["Member"],
    }),
    // Removal is applied to the cached list directly — no refetch needed.
    removeMember: builder.mutation<void, string>({
      query: (memberId) => ({ url: `/teams/my/members/${memberId}`, method: "DELETE" }),
      async onQueryStarted(memberId, { dispatch, queryFulfilled }): Promise<void> {
        const patch = dispatch(
          teamApi.util.updateQueryData("getTeamMembers", undefined, (draft) => {
            draft.data = draft.data.filter((m) => m._id !== memberId);
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
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
