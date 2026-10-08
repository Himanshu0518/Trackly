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
} from "@/types/user.types";

export const issueApi = createApi({
  reducerPath: "issueApi",
  tagTypes: ["Issue"],
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getIssues: builder.query<IssuesResponse, IssueFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          if (filters.status) params.set("status", filters.status);
          if (filters.type) params.set("type", filters.type);
          if (filters.priority) params.set("priority", filters.priority);
          if (filters.assignedTo) params.set("assignedTo", filters.assignedTo);
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
      invalidatesTags: ["Issue"],
    }),
    updateIssue: builder.mutation<IssueResponse, UpdateIssuePayload>({
      query: ({ id, ...body }) => ({ url: `/issues/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, arg) => [{ type: "Issue", id: arg.id }, "Issue"],
    }),
    deleteIssue: builder.mutation<void, string>({
      query: (id) => ({ url: `/issues/${id}`, method: "DELETE" }),
      invalidatesTags: ["Issue"],
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
  useGetIssuesQuery,
  useGetIssueByIdQuery,
  useCreateIssueMutation,
  useUpdateIssueMutation,
  useDeleteIssueMutation,
  useAddCommentMutation,
  useDeleteCommentMutation,
} = issueApi;
