import { createSlice } from "@reduxjs/toolkit";
import { getDistanceFromLatLonInKm } from "../utils/location.js";

const initialState = {
  status: "idle", // 'idle' | 'running' | 'paused'
  course: null,
  elapsedTime: 0,
  distance: 0,
  calories: 0,
  pace: 0,
  userPath: [],
  visitedSpots: [],
  prevLocation: null,
  arrivedSpotInfo: null, // 추가: 현재 도착한 스팟 정보
};

const runningSlice = createSlice({
  name: "running",
  initialState,
  reducers: {
    startRun: (state, action) => {
      state.status = "running";
      state.course = action.payload;
      // 모든 상태 초기화
      state.elapsedTime = 0;
      state.distance = 0;
      state.calories = 0;
      state.pace = 0;
      state.userPath = [];
      state.visitedSpots = [];
      state.prevLocation = null;
      state.arrivedSpotInfo = null; // 달리기 시작 시 초기화
    },
    endRun: (state) => {
      // initialState를 반환하여 모든 상태를 깨끗하게 리셋
      return initialState;
    },
    togglePause: (state) => {
      state.status = state.status === "running" ? "paused" : "running";
    },
    tick: (state) => {
      if (state.status === "running") {
        state.elapsedTime += 1;
      }
    },
    updateLocation: (state, action) => {
      const currentLocation = action.payload;
      state.userPath.push({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      });

      if (state.prevLocation) {
        const newDistance = getDistanceFromLatLonInKm(
          state.prevLocation.latitude,
          state.prevLocation.longitude,
          currentLocation.latitude,
          currentLocation.longitude
        );

        if (newDistance > 0.002) {
          state.distance += newDistance;
          state.calories = state.distance * 65;
          if (state.distance > 0) {
            state.pace = state.elapsedTime / 60 / state.distance;
          }
        }
      }
      state.prevLocation = currentLocation;
    },
    addVisitedSpot: (state, action) => {
      state.visitedSpots.push(action.payload);
    },
    // 추가: 도착한 스팟 정보를 Redux에 저장하는 리듀서
    setArrivedSpot: (state, action) => {
      state.arrivedSpotInfo = action.payload;
    },
    // 추가: 도착한 스팟 정보를 Redux에서 제거하는 리듀서
    clearArrivedSpot: (state) => {
      state.arrivedSpotInfo = null;
    },
  },
});

export const {
  startRun,
  endRun,
  togglePause,
  tick,
  updateLocation,
  addVisitedSpot,
  setArrivedSpot, // export 추가
  clearArrivedSpot, // export 추가
} = runningSlice.actions;

export default runningSlice.reducer;
