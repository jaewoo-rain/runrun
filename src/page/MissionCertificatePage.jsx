// src/MissionCertificate.jsx
import React from "react";

const CarouselDots = ({ activeSlide, scrollToSlide }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      gap: 10,
      padding: "10px",
      position: "absolute", // Position absolutely
      bottom: "40px", // Match vertical position with FinishRunningPage
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 10, // Ensure it's on top
    }}
  >
    <div
      onClick={() => scrollToSlide(0)}
      style={{
        width: 10,
        height: 10,
        background: activeSlide === 0 ? "#FF8C42" : "#C4C4C6", // Orange for active, gray for inactive
        borderRadius: "50%",
        cursor: "pointer",
      }}
    />
    <div
      onClick={() => scrollToSlide(1)}
      style={{
        width: 10,
        height: 10,
        background: activeSlide === 1 ? "#FF8C42" : "#C4C4C6",
        borderRadius: "50%",
        cursor: "pointer",
      }}
    />
  </div>
);

export default function MissionCertificate({
  data,
  activeSlide,
  scrollToSlide,
}) {
  const { distance, courseTitle } = data || {
    distance: 0,
    courseTitle: "코스",
  };

  return (
    <div
      style={{
        width: 360,
        height: "100%",
        maxHeight: 800,
        position: "relative",
        background: "#1E1E22",
        overflow: "hidden",
        backgroundImage: "url('/mission.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* 텍스트 영역 */}
      <div
        style={{
          left: 101.76,
          top: 376.32,
          position: "absolute",
          color: "#E1E1E6",
          fontSize: 23.04,
          fontFamily: "Roboto",
          fontWeight: "700",
          lineHeight: "28.8px",
        }}
      >
        해돋이러너, 000
      </div>
      <div
        style={{
          left: 52.8,
          top: 424.32,
          position: "absolute",
          textAlign: "center",
          color: "#E1E1E6",
          fontSize: 13.44,
          fontFamily: "Roboto",
          fontWeight: "400",
          lineHeight: "23.04px",
        }}
      >
        {courseTitle}부터, <br />
        {distance.toFixed(2)}km 를 완주한 당신
        <br />
        제주도가 임명하는 ‘해돋이러너’로 임명합니다!
      </div>
      <div
        style={{
          left: 92.16,
          top: 99.84,
          position: "absolute",
          textAlign: "center",
          color: "white",
          fontSize: 23.04,
          fontFamily: "Roboto",
          fontWeight: "700",
          lineHeight: "28.8px",
        }}
      >
        제주특별자치도가 <br />
        인증하는
      </div>

      {/* 중앙 배지 (이미지) */}
      <img
        src="/badge.png" // public/badge.png
        alt="Badge"
        style={{
          width: 132,
          height: 149,
          left: 114,
          top: 186,
          position: "absolute",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
