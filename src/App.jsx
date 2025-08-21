import ActivityPage from "./page/ActivityPage.jsx";
// src/App.jsx
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import CameraCapture from "./page/CameraPage";
import MapPage from "./page/MapPage";
import GpsPage from "./page/GpsPage";
import NotificationsPage from "./page/NotificationsPage";
import RecommendedCourse from "./page/RecommendedCourse";
import FinishRunningPage from "./page/FinishRunningPage";
import MissionCertificate from "./page/MissionCertificatePage";
import OnboardingFlow from "./page/onboarding/OnboardingFlow";
import StoryRepliesRoute from "./page/Camera/StoryRepliesRoute";
import RunningPage from "./page/RunningPage.jsx";
import StoryFeedPage from "./page/Camera/StoryFeedPage.jsx";

// 홈: 1열 리스트 버튼
function Home() {
  const navigate = useNavigate();

  // 간단한 인라인 스타일 (프로젝트 CSS와 충돌 없이 동작)
  const wrap = {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#0b0b0b",
    padding: 16,
    boxSizing: "border-box",
  };
  const card = {
    width: 360,
    maxWidth: "100%",
    background: "#111",
    borderRadius: 16,
    padding: 20,
    boxSizing: "border-box",
    boxShadow: "0 6px 24px rgba(0,0,0,.35)",
  };
  const title = {
    color: "#fff",
    fontSize: 22,
    fontWeight: 800,
    margin: "4px 0 16px",
  };
  const list = {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  };
  const btn = {
    width: "100%",
    height: 56,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.08)",
    background: "#1a1a1a",
    color: "#eaeaea",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "0 14px",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 0.1,
  };
  const primary = {
    background: "#FF8C42",
    color: "#111",
    border: "1px solid #FF8C42",
  };
  const emoji = { fontSize: 18, width: 22, textAlign: "center" };

  return (
    <div style={wrap}>
      <div style={card}>
        <h1 style={title}>무엇을 열까요?</h1>
        <div style={list}>
          <button
            style={{ ...btn, ...primary }}
            onClick={() => navigate("/camera")}
          >
            <span style={emoji} aria-hidden>
              📸
            </span>
            카메라
          </button>

          <button style={btn} onClick={() => navigate("/map")}>
            <span style={emoji} aria-hidden>
              🗺️
            </span>
            지도
          </button>

          <button style={btn} onClick={() => navigate("/recommend")}>
            <span style={emoji} aria-hidden>
              🧭
            </span>
            경로추천
          </button>

          <button style={btn} onClick={() => navigate("/finish_run")}>
            <span style={emoji} aria-hidden>
              🏁
            </span>
            달리기 종료
          </button>

          <button style={btn} onClick={() => navigate("/story-feed")}>
            <span style={emoji} aria-hidden>
              🔔
            </span>
            스토리피드
          </button>

          <button style={btn} onClick={() => navigate("/gps")}>
            <span style={emoji} aria-hidden>
              📡
            </span>
            GPS
          </button>

          <button style={btn} onClick={() => navigate("/mission")}>
            <span style={emoji} aria-hidden>
              🏆
            </span>
            미션성공
          </button>

          <button style={btn} onClick={() => navigate("/onboard")}>
            <span style={emoji} aria-hidden>
              🚀
            </span>
            온보딩페이지
          </button>

          <button style={btn} onClick={() => navigate("/run")}>
            <span style={emoji} aria-hidden>
              🚀
            </span>
            러닝
          </button>

          <button style={btn} onClick={() => navigate("/activity")}>
            <span style={emoji} aria-hidden>
              🚀
            </span>
            활동
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/camera" element={<CameraCapture />} />
      <Route path="/stories" element={<StoryRepliesRoute />} />
      <Route path="/map" element={<MapPage />} />
      <Route path="/recommend" element={<RecommendedCourse />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/gps" element={<GpsPage />} />
      <Route path="/finish_run" element={<FinishRunningPage />} />
      <Route path="/story-feed" element={<StoryFeedPage />} />
      <Route path="/onboard" element={<OnboardingFlow />} />
      <Route path="/mission" element={<MissionCertificate />} />
      <Route path="/run" element={<RunningPage />} />
      <Route path="/activity" element={<ActivityPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
