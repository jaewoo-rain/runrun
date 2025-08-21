import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import MissionCertificatePage from "./MissionCertificatePage";
import FinishRunningPage from "./FinishRunningPage";
import BottomBar from "../components/BottomBar";

export default function RunResultCarousel() {
  const { state } = useLocation();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);

  const handleScroll = () => {
    if (scrollRef.current) {
      const slideWidth = scrollRef.current.offsetWidth;
      const currentSlide = Math.round(
        scrollRef.current.scrollLeft / slideWidth,
      );
      if (currentSlide !== activeSlide) {
        setActiveSlide(currentSlide);
      }
    }
  };

  const scrollToSlide = (index) => {
    if (scrollRef.current) {
      const slideWidth = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: slideWidth * index,
        behavior: "smooth",
      });
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        position: "relative", // 자식의 absolute 포지셔닝을 위한 기준
        display: "flex",
        flexDirection: "column",
        background: "#f0f0f0",
      }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            flexShrink: 0,
            scrollSnapAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* MissionCertificatePage를 props와 함께 렌더링합니다. */}
          <MissionCertificatePage data={state} />
        </div>
        <div
          style={{
            width: "100%",
            height: "100%",
            flexShrink: 0,
            scrollSnapAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* FinishRunningPage를 props와 함께 렌더링합니다. */}
          <FinishRunningPage data={state} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: activeSlide === 1 ? "100px" : "40px", // 하단바 있을 때와 없을 때 위치 조정
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 10,
          zIndex: 10,
          padding: "10px",
          background: "rgba(0, 0, 0, 0.3)",
          borderRadius: "20px",
        }}
      >
        <div
          onClick={() => scrollToSlide(0)}
          style={{
            width: 10,
            height: 10,
            background: activeSlide === 0 ? "#FF8C42" : "#C4C4C6",
            borderRadius: 9999,
            cursor: "pointer",
          }}
        />
        <div
          onClick={() => scrollToSlide(1)}
          style={{
            width: 10,
            height: 10,
            background: activeSlide === 1 ? "#FF8C42" : "#C4C4C6",
            borderRadius: 9999,
            cursor: "pointer",
          }}
        />
      </div>
      {activeSlide === 1 && <BottomBar activeTab="running" />}
    </div>
  );
}
