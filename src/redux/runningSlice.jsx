import { createSlice } from "@reduxjs/toolkit";
import { getDistanceFromLatLonInKm } from "../utils/location.js"; // 경로 유틸 함수 import

const initialState = {
  status: "idle", // 'idle' | 'running' | 'paused'
  course: null,
  elapsedTime: 0,
  distance: 0, // km 단위
  calories: 0,
  pace: 0, // min/km
  userPath: [], // [{lat, lng}]
  visitedSpots: [],
  prevLocation: null, // 마지막 위치 기록
};

const runningSlice = createSlice({
  name: "running",
  initialState,
  reducers: {
    // 달리기 시작: 코스 정보를 받아와 상태를 초기화하고 'running'으로 변경
    startRun: (state, action) => {
      state.status = "running";
      state.course = action.payload; // action.payload에 course 객체가 담겨 옴
      // 모든 측정 지표 초기화
      state.elapsedTime = 0;
      state.distance = 0;
      state.calories = 0;
      state.pace = 0;
      state.userPath = [];
      state.visitedSpots = [];
      state.prevLocation = null;
    },
    // 달리기 완전 종료 및 초기화
    endRun: (state) => {
      return initialState; // 모든 상태를 초기 상태로 리셋
    },
    // 일시정지 토글
    togglePause: (state) => {
      state.status = state.status === "running" ? "paused" : "running";
    },
    // 1초마다 시간 증가
    tick: (state) => {
      if (state.status === "running") {
        state.elapsedTime += 1;
      }
    },
    // 위치 업데이트 및 거리/칼로리/페이스 계산
    updateLocation: (state, action) => {
      const currentLocation = action.payload; // { latitude, longitude }
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

        // 최소 2m 이상 움직였을 때만 거리 계산 (오차 보정)
        if (newDistance > 0.002) {
          state.distance += newDistance;
          state.calories = state.distance * 65; // 칼로리 계산 (체중 65kg 기준)
          if (state.distance > 0) {
            state.pace = state.elapsedTime / 60 / state.distance;
          }
        }
      }
      state.prevLocation = currentLocation;
    },
    // 방문한 스팟 추가
    addVisitedSpot: (state, action) => {
      state.visitedSpots.push(action.payload);
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
} = runningSlice.actions;

export default runningSlice.reducer;
