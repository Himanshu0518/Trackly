import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "@/lib/api-config";
import { clearUser } from "@/store/authSlice";
import { tokenStore } from "@/lib/token-store";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: "include",
  // Attach the stored JWT as a Bearer token on every request.
  // In normal browsers the httpOnly cookie is enough; in incognito /
  // strict-privacy mode cross-origin SameSite=None cookies are blocked, so
  // this header is the only thing keeping the session alive.
  prepareHeaders: (headers) => {
    const token = tokenStore.get();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Endpoints where a 401 just means "wrong credentials", not "session expired"
const PUBLIC_AUTH_URLS = ["/auth/login", "/auth/signup"];

/**
 * Shared base query for every API slice.
 * If the server says 401 (cookie expired / user deleted), Redux is told
 * immediately so AuthLayout redirects to /login instead of the UI continuing
 * to believe the session is alive.
 */
export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const url = typeof args === "string" ? args : args.url;
    if (!PUBLIC_AUTH_URLS.some((p) => url.startsWith(p))) {
      api.dispatch(clearUser());
    }
  }

  return result;
};
