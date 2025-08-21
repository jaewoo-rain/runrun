// src/RunningCoursePage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import BottomBar from "../components/BottomBar.jsx";

/** 네이버 지도 스크립트 동적 로더 */
function loadNaverMaps(clientId) {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.naver?.maps) {
      resolve(window.naver);
      return;
    }
    const id = "naver-maps-script";
    const existing = document.getElementById(id);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.naver), {
        once: true,
      });
      existing.addEventListener("error", (e) => reject(e), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(window.naver);
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

const ResultMap = ({ userPath }) => {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    const loadAndDrawMap = async () => {
      try {
        const naver = await loadNaverMaps(import.meta.env.VITE_NAVER_CLIENT_ID);
        if (!mapContainerRef.current) return;

        const map = new naver.maps.Map(mapContainerRef.current, {
          draggable: false,
          scrollWheel: false,
          keyboardShortcuts: false,
          disableDoubleClickZoom: true,
          disableDoubleTapZoom: true,
          pinchZoom: false,
        });

        if (!userPath || userPath.length < 2) {
          map.setCenter(new naver.maps.LatLng(33.38, 126.55));
          map.setZoom(11);
          return;
        }

        const pathCoords = userPath.map(
          (p) => new naver.maps.LatLng(p.lat, p.lng)
        );

        new naver.maps.Polyline({
          path: pathCoords,
          strokeColor: "#FF8C42",
          strokeWeight: 6,
          map: map,
        });

        new naver.maps.Marker({ position: pathCoords[0], map: map });
        new naver.maps.Marker({
          position: pathCoords[pathCoords.length - 1],
          map: map,
        });

        const bounds = new naver.maps.LatLngBounds(
          pathCoords[0],
          pathCoords[0]
        );
        pathCoords.forEach((coord) => bounds.extend(coord));
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      } catch (e) {
        console.error("Failed to load or draw map", e);
      }
    };

    loadAndDrawMap();
  }, [userPath]);

  return (
    <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
  );
};

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

const ImageCarousel = ({ userPath }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftStart, setScrollLeftStart] = useState(0);

  const slides = [
    <ResultMap key="map" userPath={userPath} />,
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

const CarouselDots = ({ activeSlide, scrollToSlide }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      gap: 10,
      padding: "10px",
    }}
  >
    <div
      onClick={() => scrollToSlide(0)}
      style={{
        width: 10,
        height: 10,
        background: activeSlide === 0 ? "#FF8C42" : "#C4C4C6",
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

export default function FinishRunningPage({
  data,
  activeSlide,
  scrollToSlide,
}) {
  const { elapsedTime, distance, calories, pace, userPath, courseTitle } =
    data || {
      elapsedTime: 0,
      distance: 0,
      calories: 0,
      pace: 0,
      userPath: [],
      courseTitle: "코스 정보 없음",
    };

  useEffect(() => {
    console.log("테스트용 사용자 경로 데이터:", userPath);
  }, [userPath]);

  return (
    <div
      style={{
        width: 360,
        height: "100%",
        maxHeight: 800, // Added to match MissionCertificatePage
        background: "white",
        overflowY: "auto",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* 본문 */}
      <div
        style={{
          padding: "20px 16px 40px 16px", // 하단 여백 조정
          display: "flex",
          flexDirection: "column",
          alignItems: "center", // 전체 중앙 정렬
          gap: 26,
        }}
      >
        {/* 코스 정보 */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start", // 내용은 좌측 정렬
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ color: "black", fontSize: 22, fontWeight: 600 }}>
              {courseTitle || "알 수 없는 코스"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                width: 132,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <div style={{ color: "black", fontSize: 64, fontWeight: 900 }}>
                4.97
              </div>
              <div style={{ color: "#C4C4C6", fontSize: 12 }}>킬로미터</div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 35 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div
                  style={{ color: "#1E1E22", fontSize: 22, fontWeight: 600 }}
                >
                  {/* {formatPace(pace)} */}
                  6'32''
                </div>
                <div style={{ color: "#C4C4C6", fontSize: 12 }}>페이스</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div
                  style={{ color: "#1E1E22", fontSize: 22, fontWeight: 600 }}
                >
                  {/* {formatTime(elapsedTime)} */}
                  33:09
                </div>
                <div style={{ color: "#C4C4C6", fontSize: 12 }}>시간</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div
                  style={{ color: "#1E1E22", fontSize: 22, fontWeight: 600 }}
                >
                  {/* {Math.round(calories)} */}
                  277
                </div>
                <div style={{ color: "#C4C4C6", fontSize: 12 }}>칼로리</div>
              </div>
            </div>
          </div>
        </div>

        {/* 지도 */}
        <div style={{ width: 328, height: 328 }}>
          <img
            src="/image/final.png"
            alt="러닝 결과 경로 이미지"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />{" "}
        </div>

        <CarouselDots activeSlide={activeSlide} scrollToSlide={scrollToSlide} />

        {/* 버튼 영역 */}
        <div
          style={{
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
            cursor: "pointer",
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
    </div>
  );
}
