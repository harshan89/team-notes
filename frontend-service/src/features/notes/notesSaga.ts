import { call, delay, put, select, takeEvery, takeLatest } from "redux-saga/effects";
import { api, ApiError, Note } from "../../api";
import type { RootState } from "../../store";
import { signedOut } from "../auth/authSlice";
import {
  createRequested,
  createSucceeded,
  deleteRequested,
  deleteSucceeded,
  fetchRequested,
  fetchSucceeded,
  requestFailed,
} from "./notesSlice";

const selectToken = (state: RootState) => state.auth.token!;

// Expired/invalid token -> back to the picker. Anything else -> show the message.
function* handleError(err: unknown, id?: number) {
  if (err instanceof ApiError && err.status === 401) {
    yield put(signedOut("Your session has expired. Pick your team and role again."));
  } else {
    yield put(requestFailed({ message: (err as Error).message || "Something went wrong", id }));
  }
}

function* fetchNotes(action: ReturnType<typeof fetchRequested>) {
  if (action.payload) yield delay(300); // debounce typing in the search box
  try {
    const token: string = yield select(selectToken);
    const notes: Note[] = yield call(api.listNotes, token, action.payload);
    yield put(fetchSucceeded(notes));
  } catch (err) {
    yield* handleError(err);
  }
}

function* createNote(action: ReturnType<typeof createRequested>) {
  try {
    const token: string = yield select(selectToken);
    const note: Note = yield call(api.createNote, token, action.payload.title, action.payload.content);
    yield put(createSucceeded(note));
  } catch (err) {
    yield* handleError(err);
  }
}

function* deleteNote(action: ReturnType<typeof deleteRequested>) {
  try {
    const token: string = yield select(selectToken);
    yield call(api.deleteNote, token, action.payload);
    yield put(deleteSucceeded(action.payload));
  } catch (err) {
    yield* handleError(err, action.payload);
  }
}

export function* notesSaga() {
  yield takeLatest(fetchRequested.type, fetchNotes); // newer search cancels the older one
  yield takeEvery(createRequested.type, createNote);
  yield takeEvery(deleteRequested.type, deleteNote);
}
