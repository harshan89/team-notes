import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import createSagaMiddleware from "redux-saga";
import { all } from "redux-saga/effects";
import authReducer from "../features/auth/authSlice";
import { authSaga } from "../features/auth/authSaga";
import notesReducer from "../features/notes/notesSlice";
import { notesSaga } from "../features/notes/notesSaga";

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: { auth: authReducer, notes: notesReducer },
  middleware: (getDefault) => getDefault({ thunk: false }).concat(sagaMiddleware),
});

sagaMiddleware.run(function* rootSaga() {
  yield all([authSaga(), notesSaga()]);
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
