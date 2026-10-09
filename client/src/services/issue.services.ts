import { createApi } from "@reduxjs/toolkit/query/react";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { baseQueryWithAuth } from "@/lib/base-query";
import type {
  IssueData,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDispatch = ThunkDispatch<any, any, UnknownAction>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGetState = () => any;

/**
 * Canonical form of the list filters. "No filters" and "default sort" all
 * collapse to {}, so the Board, Dashboard and an unfiltered Issues page share
 * ONE cached list instead of each fetching their own copy.
 */
function normalizeFilters(f?: IssueFilters | void): Record<string, string> {
  const out: Record<string, string> = {};
  if (!f) return out;
  if (f.status) out.status = f.status;
  if (f.type) out.type = f.type;
  if (f.priority) out.priority = f.priority;
  if (f.assignedTo) out.assignedTo = f.assignedTo;
  if (f.search) out.search = f.search;
  const sortBy = f.sortBy ?? "createdAt";
  const order = f.order ?? "desc";
  if (sortBy !== "createdAt" || order !== "desc") {
    out.sortBy = sortBy;
    out.order = order;
  }
  return out;
}

const isFilteredList = (f?: IssueFilters | void) => Object.keys(normalizeFilters(f)).length > 0;

/** Patch every cached copy of the issue list (unfiltered + filtered variants). Returns an undo fn. */
function patchIssueLists(
  dispatch: AnyDispatch,
  getState: AnyGetState,
  recipe: (draft: IssuesResponse) => void
): () => void {
  const args = issueApi.util.selectCachedArgsForQuery(getState(), "getIssues");
  const patches = args.map((arg) =>
    dispatch(issueApi.util.updateQueryData("getIssues", arg, recipe))
  );
  return () => patches.forEach((p) => p.undo());
}

/**
 * Apply `recipe` to one issue everywhere it is cached (all list variants + the
 * detail entry). Mutations patch the cache from their own response / intent
 * instead of blanket-invalidating, so changing a status or adding a comment
 * costs ONE request instead of mutation + list refetch + detail refetch.
 */
function patchIssueCaches(
  dispatch: AnyDispatch,
  getState: AnyGetState,
  id: string,
  recipe: (draft: IssueData) => void
): () => void {
  const undoLists = patchIssueLists(dispatch, getState, (draft) => {
    const issue = draft.data.find((i) => i._id === id);
    if (issue) recipe(issue);
  });
  const detail = dispatch(
    issueApi.util.updateQueryData("getIssueById", id, (draft) => {
      recipe(draft.data);
    })
  );
  return () => {
    undoLists();
    detail.undo();
  };
}

// Filtered / sorted lists can't be patched reliably in place (an issue may now
// match or stop matching), so they are marked stale. Stale + unmounted = dropped
// from cache, stale + mounted = refetched once. Unfiltered lists are patched.
const STALE_FILTERED = { type: "Issue", id: "FILTERED" } as const;

export const issueApi = createApi({
  reducerPath: "issueApi",
  tagTypes: ["Issue", "Dashboard"],
  baseQuery: baseQueryWithAuth,
  // Keep data when hopping between Dashboard / Board / Issues so each page
  // mount reuses the cache instead of hitting the API again.
  keepUnusedDataFor: 300,
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardResponse, void>({
      query: () => "/dashboard/stats",
      providesTags: ["Dashboard"],
    }),

    getIssues: builder.query<IssuesResponse, IssueFilters | void>({
      query: (filters) => {
        const qs = new URLSearchParams(normalizeFilters(filters)).toString();
        return `/issues${qs ? `?${qs}` : ""}`;
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}(${JSON.stringify(normalizeFilters(queryArgs))})`,
      providesTags: (_result, _error, arg) =>
        isFilteredList(arg)
          ? [STALE_FILTERED]
          : [{ type: "Issue", id: "LIST" }],
    }),

    getIssueById: builder.query<IssueResponse, string>({
      query: (id) => `/issues/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Issue", id }],
    }),

    createIssue: builder.mutation<IssueResponse, CreateIssuePayload>({
      query: (body) => ({ url: "/issues", method: "POST", body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }): Promise<void> {
        try {
          const { data } = await queryFulfilled;
          const issue = data.data;
          // The server returns the issue with createdBy / assignedTo populated.
          // An older server returning bare ids falls back to a single refetch.
          if (typeof issue.createdBy !== "object") {
            dispatch(issueApi.util.invalidateTags(["Issue", "Dashboard"]));
            return;
          }
          dispatch(
            issueApi.util.updateQueryData("getIssues", undefined, (draft) => {
              draft.data.unshift(issue);
            })
          );
          dispatch(issueApi.util.invalidateTags([STALE_FILTERED, "Dashboard"]));
        } catch {
          /* the calling component shows the error toast */
        }
      },
    }),

    updateIssue: builder.mutation<IssueResponse, UpdateIssuePayload>({
      query: ({ id, ...body }) => ({ url: `/issues/${id}`, method: "PATCH", body }),
      async onQueryStarted({ id, ...patch }, { dispatch, getState, queryFulfilled }): Promise<void> {
        // Optimistic: applied instantly (this is what makes drag & drop feel immediate).
        // assignedTo is deliberately NOT patched here — the cache needs the
        // populated user object ({_id, name}), and writing the raw id string
        // would show a MongoDB id instead of the name until the refetch.
        const undo = patchIssueCaches(dispatch, getState, id, (draft) => {
          if (patch.title !== undefined) draft.title = patch.title;
          if (patch.description !== undefined) draft.description = patch.description;
          if (patch.type !== undefined) draft.type = patch.type;
          if (patch.status !== undefined) draft.status = patch.status;
          if (patch.priority !== undefined) draft.priority = patch.priority;
          if (patch.dueDate !== undefined) draft.dueDate = patch.dueDate;
        });

        try {
          const { data } = await queryFulfilled;
          const saved = data.data;

          if (saved.assignedTo !== null && typeof saved.assignedTo !== "object") {
            // Older server returning a bare id → one refetch to get the name.
            dispatch(issueApi.util.invalidateTags(["Issue", "Dashboard"]));
            return;
          }

          // Take only what the optimistic patch could not know (assignee name,
          // timestamps). Re-applying the other fields could flicker if two quick
          // edits are in flight.
          patchIssueCaches(dispatch, getState, id, (draft) => {
            draft.assignedTo = saved.assignedTo;
            draft.updatedAt = saved.updatedAt;
          });
          dispatch(issueApi.util.invalidateTags([STALE_FILTERED, "Dashboard"]));
        } catch {
          undo();
        }
      },
    }),

    deleteIssue: builder.mutation<void, string>({
      query: (id) => ({ url: `/issues/${id}`, method: "DELETE" }),
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }): Promise<void> {
        try {
          await queryFulfilled;
          patchIssueLists(dispatch, getState, (draft) => {
            draft.data = draft.data.filter((i) => i._id !== id);
          });
          dispatch(issueApi.util.invalidateTags(["Dashboard"]));
        } catch {
          /* the calling component shows the error toast */
        }
      },
    }),

    addComment: builder.mutation<CommentsResponse, AddCommentPayload>({
      query: ({ id, ...body }) => ({ url: `/issues/${id}/comments`, method: "POST", body }),
      async onQueryStarted({ id }, { dispatch, getState, queryFulfilled }): Promise<void> {
        try {
          const { data } = await queryFulfilled;
          // The server returns the full, populated comment list for the issue.
          patchIssueCaches(dispatch, getState, id, (draft) => {
            draft.comments = data.data;
          });
        } catch {
          /* the calling component shows the error toast */
        }
      },
    }),

    deleteComment: builder.mutation<void, DeleteCommentPayload>({
      query: ({ id, commentIndex }) => ({
        url: `/issues/${id}/comments/${commentIndex}`,
        method: "DELETE",
      }),
      async onQueryStarted(
        { id, commentIndex },
        { dispatch, getState, queryFulfilled }
      ): Promise<void> {
        const undo = patchIssueCaches(dispatch, getState, id, (draft) => {
          draft.comments.splice(commentIndex, 1);
        });
        try {
          await queryFulfilled;
        } catch {
          undo();
        }
      },
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
