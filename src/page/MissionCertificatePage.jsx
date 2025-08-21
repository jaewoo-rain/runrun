// src/MissionCertificate.jsx
import React from "react";

export default function MissionCertificate() {
  return (
    <div
      style={{
        width: 360,
        height: 800,
        position: "relative",
        background: "#1E1E22",
        overflow: "hidden",
        backgroundImage: "url('/mission.png')", // public/mission.png
        backgroundSize: "cover",
        backgroundPosition: "center",
        margin: "20px auto",
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
        함덕해수욕장부터, <br />
        20km 를 완주한 당신
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

      {/* 공유 버튼 */}
      <div
        style={{
          padding: 9.6,
          left: 105.38,
          top: 552.96,
          position: "absolute",
          background: "rgba(255,255,255,0.6)",
          borderRadius: 35.52,
          backdropFilter: "blur(1.92px)",
          display: "inline-flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "black",
            fontSize: 13.44,
            fontFamily: "Roboto",
            fontWeight: "400",
            lineHeight: "23.04px",
          }}
        >
          런제주 피드에 공유하기
        </div>
      </div>

      {/* 하단 아이콘들 (대체용) */}
      <div
        style={{
          width: 46.08,
          height: 47.29,
          left: 238.08,
          top: 642.36,
          position: "absolute",
          background: "#323238",
        }}
      />
      <div
        style={{
          width: 23.7,
          height: 18.92,
          left: 249.6,
          top: 656.72,
          position: "absolute",
          background: "white",
        }}
      />
      <div
        style={{
          width: 46.08,
          height: 47.29,
          left: 184.32,
          top: 642.36,
          position: "absolute",
          background: "#323238",
        }}
      />
      <div
        style={{
          width: 23.18,
          height: 23.65,
          left: 195.84,
          top: 654.19,
          position: "absolute",
          background: "white",
        }}
      />

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
