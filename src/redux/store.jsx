import { configureStore } from "@reduxjs/toolkit";
import runningReducer from "./runningSlice";

export const store = configureStore({
  reducer: {
    running: runningReducer,
  },
});
