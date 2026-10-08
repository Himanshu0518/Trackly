import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { useSelector, useDispatch, type TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./index";
import type { MeUserData } from "@/types/user.types";

interface AuthState {
  user: MeUserData | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<MeUserData>) {
      state.user = action.payload;
      state.isInitialized = true;
    },
    clearUser(state) {
      state.user = null;
      state.isInitialized = true;
    },
    setInitialized(state) {
      state.isInitialized = true;
    },
  },
});

export const { setUser, clearUser, setInitialized } = authSlice.actions;
export default authSlice.reducer;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();
