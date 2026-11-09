import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Note } from "../../api";
import { signedOut } from "../auth/authSlice";

interface NotesState {
  items: Note[];
  query: string;
  loading: boolean;
  creating: boolean;
  deletingIds: number[];
  error: string | null;
}

const initialState: NotesState = {
  items: [],
  query: "",
  loading: false,
  creating: false,
  deletingIds: [],
  error: null,
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    fetchRequested(state, action: PayloadAction<string>) {
      state.query = action.payload;
      state.loading = true;
      state.error = null;
    },
    fetchSucceeded(state, action: PayloadAction<Note[]>) {
      state.items = action.payload;
      state.loading = false;
    },
    createRequested(state, _action: PayloadAction<{ title: string; content: string }>) {
      state.creating = true;
      state.error = null;
    },
    createSucceeded(state, action: PayloadAction<Note>) {
      state.items.unshift(action.payload);
      state.creating = false;
    },
    deleteRequested(state, action: PayloadAction<number>) {
      state.deletingIds.push(action.payload);
      state.error = null;
    },
    deleteSucceeded(state, action: PayloadAction<number>) {
      state.items = state.items.filter((n) => n.id !== action.payload);
      state.deletingIds = state.deletingIds.filter((id) => id !== action.payload);
    },
    requestFailed(state, action: PayloadAction<{ message: string; id?: number }>) {
      state.loading = false;
      state.creating = false;
      state.deletingIds = state.deletingIds.filter((id) => id !== action.payload.id);
      state.error = action.payload.message;
    },
    errorDismissed(state) {
      state.error = null;
    },
  },
  // Signing out clears everything.
  extraReducers: (builder) => builder.addCase(signedOut, () => initialState),
});

export const {
  fetchRequested,
  fetchSucceeded,
  createRequested,
  createSucceeded,
  deleteRequested,
  deleteSucceeded,
  requestFailed,
  errorDismissed,
} = notesSlice.actions;
export default notesSlice.reducer;
