import { configureStore } from "@reduxjs/toolkit";
import { userApi } from "@/services/auth.services";
import { teamApi } from "@/services/team.services";
import { issueApi } from "@/services/issue.services";
import { notificationApi } from "@/services/notification.services";
import authReducer from "./authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [userApi.reducerPath]: userApi.reducer,
    [teamApi.reducerPath]: teamApi.reducer,
    [issueApi.reducerPath]: issueApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      userApi.middleware,
      teamApi.middleware,
      issueApi.middleware,
      notificationApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
