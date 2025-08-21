import React from "react";
import { useNavigate } from "react-router-dom";
import CameraCaptureMobile from "./Camera/CameraCaptureMobile";

export default function CameraPage() {
  const navigate = useNavigate();

  return (
    <CameraCaptureMobile
      nickname="러너닉네임"
      locationName="함덕해수욕장"
      onNext={(payload) => {
        // ✅ 목적지를 /feed로 변경하고, state key를 capturedPhoto로 명확하게 지정
        navigate("/story-feed", { state: { capturedPhoto: payload } });
      }}
    />
  );
}
