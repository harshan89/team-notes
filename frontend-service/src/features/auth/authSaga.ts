import { call, put, takeLatest } from "redux-saga/effects";
import { api, tokenExpiry } from "../../api";
import { fetchRequested } from "../notes/notesSlice";
import { tokenFailed, tokenReceived, tokenRequested } from "./authSlice";

function* requestToken(action: ReturnType<typeof tokenRequested>) {
  const { teamId, role } = action.payload;
  try {
    const { token }: { token: string } = yield call(api.getToken, teamId, role);
    yield put(tokenReceived({ token, teamId, role, expiresAt: tokenExpiry(token) }));
    yield put(fetchRequested("")); // load notes as soon as we have a token
  } catch (err) {
    yield put(tokenFailed((err as Error).message || "Could not reach the auth service"));
  }
}

export function* authSaga() {
  yield takeLatest(tokenRequested.type, requestToken);
}
