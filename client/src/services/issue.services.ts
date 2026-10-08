import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@/lib/api-config";
import type {
  IssueResponse,
  IssuesResponse,
  CreateIssuePayload,
  UpdateIssuePayload,
  IssueFilters,
  AddCommentPayload,
  DeleteCommentPayload,
  CommentsResponse,
  DashboardResponse,
} from "@/types/user.types";

export const issueApi = createApi({
  reducerPath: "issueApi",
  tagTypes: ["Issue", "Dashboard"],
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardResponse, void>({
      query: () => "/dashboard/stats",
      providesTags: ["Dashboard"],
    }),
    getIssues: builder.query<IssuesResponse, IssueFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          if (filters.status) params.set("status", filters.status);
          if (filters.type) params.set("type", filters.type);
          if (filters.priority) params.set("priority", filters.priority);
          if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
          if (filters.search) params.set("search", filters.search);
          if (filters.sortBy) params.set("sortBy", filters.sortBy);
          if (filters.order) params.set("order", filters.order);
        }
        const qs = params.toString();
        return `/issues${qs ? `?${qs}` : ""}`;
      },
      providesTags: ["Issue"],
    }),
    getIssueById: builder.query<IssueResponse, string>({
      query: (id) => `/issues/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Issue", id }],
    }),
    createIssue: builder.mutation<IssueResponse, CreateIssuePayload>({
      query: (body) => ({ url: "/issues", method: "POST", body }),
      invalidatesTags: ["Issue", "Dashboard"],
    }),
    updateIssue: builder.mutation<IssueResponse, UpdateIssuePayload>({
      query: ({ id, ...body }) => ({ url: `/issues/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, arg) => [{ type: "Issue", id: arg.id }, "Issue", "Dashboard"],
      async onQueryStarted({ id, ...patch }, { dispatch, queryFulfilled }) {
        // Optimistically update the issues list cache
        const patchResultList = dispatch(
          issueApi.util.updateQueryData("getIssues", undefined, (draft) => {
            if (draft?.data) {
              const item = draft.data.find((i) => i._id === id);
              if (item) {
                Object.assign(item, patch);
              }
            }
          })
        );

        // Optimistically update the single issue cache
        const patchResultDetail = dispatch(
          issueApi.util.updateQueryData("getIssueById", id, (draft) => {
            if (draft?.data) {
              Object.assign(draft.data, patch);
            }
          })
        );

        try {
          await queryFulfilled;
        } catch {
          patchResultList.undo();
          patchResultDetail.undo();
        }
      },
    }),
    deleteIssue: builder.mutation<void, string>({
      query: (id) => ({ url: `/issues/${id}`, method: "DELETE" }),
      invalidatesTags: ["Issue", "Dashboard"],
    }),
    addComment: builder.mutation<CommentsResponse, AddCommentPayload>({
      query: ({ id, ...body }) => ({ url: `/issues/${id}/comments`, method: "POST", body }),
      invalidatesTags: (_result, _error, arg) => [{ type: "Issue", id: arg.id }, "Issue"],
    }),
    deleteComment: builder.mutation<void, DeleteCommentPayload>({
      query: ({ id, commentIndex }) => ({
        url: `/issues/${id}/comments/${commentIndex}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: "Issue", id: arg.id }, "Issue"],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetIssuesQuery,
  useGetIssueByIdQuery,
  useCreateIssueMutation,
  useUpdateIssueMutation,
  useDeleteIssueMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
} = issueApi;
