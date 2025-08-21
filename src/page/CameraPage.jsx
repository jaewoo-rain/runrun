import React from "react";
import { useNavigate } from "react-router-dom";
import CameraCaptureMobile from "./Camera/CameraCaptureMobile";
import { mockStories } from "../data/mockData"; // 데이터를 외부에서 import

export default function CameraPage() {
  const navigate = useNavigate();

  const handleNext = (payload) => {
    navigate("/story-feed", { state: { capturedPhoto: payload } });

    if (payload.photoBlob) {
      const reader = new FileReader();
      reader.readAsDataURL(payload.photoBlob);
      reader.onloadend = () => {
        const base64data = reader.result;
        const storablePayload = {
          ...payload,
          photoUrl: base64data,
          photoBlob: null,
        };
        try {
          localStorage.setItem(
            "userCapturedStory",
            JSON.stringify(storablePayload)
          );
        } catch (e) {
          console.error("스토리를 localStorage에 저장하는데 실패했습니다.", e);
        }
      };
    }
  };

  return (
    <CameraCaptureMobile
      nickname="러너닉네임"
      locationName="함덕해수욕장"
      onNext={handleNext}
      stories={mockStories} // stories 데이터를 prop으로 전달
    />
  );
}
