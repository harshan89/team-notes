import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Role, Team } from "../../api";

interface AuthState {
  token: string | null;
  teamId: Team | null;
  role: Role | null;
  expiresAt: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  teamId: null,
  role: null,
  expiresAt: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    tokenRequested(state, _action: PayloadAction<{ teamId: Team; role: Role }>) {
      state.loading = true;
      state.error = null;
    },
    tokenReceived(state, action: PayloadAction<{ token: string; teamId: Team; role: Role; expiresAt: number }>) {
      return { ...action.payload, loading: false, error: null };
    },
    tokenFailed(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    // Back to the team/role picker. Optional message (e.g. "session expired").
    signedOut(_state, action: PayloadAction<string | undefined>) {
      return { ...initialState, error: action.payload ?? null };
    },
  },
});

export const { tokenRequested, tokenReceived, tokenFailed, signedOut } = authSlice.actions;
export default authSlice.reducer;
