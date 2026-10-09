import type { AppDispatch } from "@/store/index";
import { issueApi } from "@/services/issue.services";
import { teamApi } from "@/services/team.services";

/**
 * Drop cached issues / team data. Called right after a successful login or
 * signup (when no issue/team query is mounted), so a different user signing in
 * on the same tab can never see the previous user's cached data.
 */
export function resetSessionCaches(dispatch: AppDispatch) {
  dispatch(issueApi.util.resetApiState());
  dispatch(teamApi.util.resetApiState());
}
