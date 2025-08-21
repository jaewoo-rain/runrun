// src/RunningCoursePage.jsx
import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import BottomBar from "../components/BottomBar.jsx";

const formatTime = (timeInSeconds) => {
  if (timeInSeconds === undefined || timeInSeconds === null) return "00:00:00";
  const hours = Math.floor(timeInSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (timeInSeconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
};

const formatPace = (paceInMinutes) => {
  if (
    paceInMinutes === undefined ||
    paceInMinutes === null ||
    paceInMinutes === 0 ||
    !isFinite(paceInMinutes)
  ) {
    return "0'00''";
  }
  const minutes = Math.floor(paceInMinutes);
  const seconds = Math.round((paceInMinutes - minutes) * 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}'${seconds}''`;
};

const ImageCarousel = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);

  const slides = [
    <img
      key="map"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        userSelect: "none",
      }}
      src="https://placehold.co/328x328"
      alt="map"
    />,
    <img
      key="photo"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        userSelect: "none",
      }}
      src="https://placehold.co/328x328/eee/ccc?text=Photo"
      alt="photo"
    />,
  ];

  const handleScroll = () => {
    if (scrollRef.current) {
      const slideWidth = scrollRef.current.offsetWidth;
      const currentSlide = Math.round(
        scrollRef.current.scrollLeft / slideWidth
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

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftStart(scrollRef.current.scrollLeft);
    scrollRef.current.style.cursor = "grabbing";
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag speed multiplier
    scrollRef.current.scrollLeft = scrollLeftStart - walk;
  };

  return (
    <div
      style={{ width: 328, height: 328, position: "relative", cursor: "grab" }}
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollBehavior: "smooth",
          touchAction: "pan-x",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            style={{
              width: "100%",
              flexShrink: 0,
              scrollSnapAlign: "center",
              scrollSnapStop: "always",
            }}
          >
            {slide}
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 17,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
          zIndex: 1, // Ensure indicator is above the slides
        }}
      >
        <div
          onClick={() => scrollToSlide(0)}
          style={{
            width: 8,
            height: 8,
            background: activeSlide === 0 ? "#FF8C42" : "#C4C4C6",
            borderRadius: 9999,
            cursor: "pointer",
          }}
        />
        <div
          onClick={() => scrollToSlide(1)}
          style={{
            width: 8,
            height: 8,
            background: activeSlide === 1 ? "#FF8C42" : "#C4C4C6",
            borderRadius: 9999,
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
};

export default function FinishRunningPage() {
  const location = useLocation();
  const { elapsedTime, distance, calories, pace } = location.state || {
    elapsedTime: 0,
    distance: 0,
    calories: 0,
    pace: 0,
  };

  return (
    <div
      style={{
        width: 360,
        height: 800,
        position: "relative",
        background: "white",
        overflow: "hidden",
        margin: "20px auto",
      }}
    >
      {/* 본문 */}
      <div
        style={{
          width: 328,
          left: 16,
          top: 62,
          position: "absolute",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 26,
        }}
      >
        {/* 코스 정보 */}
        <div
          style={{
            width: 328, // Use full width to align left
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ color: "#C4C4C6", fontSize: 12, fontWeight: 500 }}>
              오늘 - 오전 7 : 40
            </div>
            <div style={{ color: "black", fontSize: 22, fontWeight: 600 }}>
              제주 아름다운 해안 코스
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 19 }}>
            <div
              style={{
                width: 132,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <div style={{ color: "black", fontSize: 64, fontWeight: 900 }}>
                {distance.toFixed(2)}
              </div>
              <div style={{ color: "#C4C4C6", fontSize: 12 }}>킬로미터</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 54 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div
                  style={{ color: "#1E1E22", fontSize: 22, fontWeight: 600 }}
                >
                  {formatPace(pace)}
                </div>
                <div style={{ color: "#C4C4C6", fontSize: 12 }}>페이스</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div
                  style={{ color: "#1E1E22", fontSize: 22, fontWeight: 600 }}
                >
                  {formatTime(elapsedTime)}
                </div>
                <div style={{ color: "#C4C4C6", fontSize: 12 }}>시간</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div
                  style={{ color: "#1E1E22", fontSize: 22, fontWeight: 600 }}
                >
                  {Math.round(calories)}
                </div>
                <div style={{ color: "#C4C4C6", fontSize: 12 }}>칼로리</div>
              </div>
            </div>
          </div>
        </div>

        {/* 지도 & 이미지 */}
        <ImageCarousel />

        {/* 버튼 영역 */}
        <div
          style={{
            alignSelf: "center",
            width: 206,
            paddingLeft: 12,
            paddingRight: 12,
            paddingTop: 10,
            paddingBottom: 10,
            background: "var(--main, #FF8C42)",
            borderRadius: 30,
            justifyContent: "center",
            alignItems: "center",
            gap: 9.6,
            display: "inline-flex",
          }}
        >
          <div
            style={{
              textAlign: "center",
              color: "#FCFCFC",
              fontSize: 15,
              fontFamily: "Pretendard",
              fontWeight: "700",
              wordWrap: "break-word",
            }}
          >
            공유하기
          </div>
        </div>
      </div>

      <BottomBar activeTab="running" positioning="absolute" />
    </div>
  );
}
