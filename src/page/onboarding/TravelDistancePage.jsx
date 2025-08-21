import React, { useEffect, useMemo, useState } from "react";

export default function TravelDistancePage({
  defaultDistance = 10,
  onBack,
  onNext,
}) {
  const [km, setKm] = useState(
    typeof defaultDistance === "number" ? defaultDistance : 10
  );

  // (useMemo, valueText 등 기존 로직은 변경 없음)
  const pctRaw = useMemo(() => (km / 20) * 100, [km]);
  const pct = Math.max(6, Math.min(94, pctRaw));
  const valueText = Number.isInteger(km) ? `${km}km` : `${km.toFixed(1)}km`;
  const handleSubmit = () => onNext?.(Number(km));
  const handleBack = () => {
    if (typeof onBack === "function") onBack();
    else if (window.history?.length > 0) window.history.back();
  };

  return (
    // [변경] 전체 컨테이너를 Flexbox로 설정
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 슬라이더 썸 스타일 (변경 없음) */}
      <style>{`
        .distance-range { -webkit-appearance: none; appearance: none; width: 100%; height: 8px; border-radius: 9999px; outline: none; background: transparent; }
        .distance-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #FF8C42; border: none; cursor: pointer; margin-top: -6px; }
        .distance-range::-moz-range-thumb { width: 20px; height: 20px; border-radius: 50%; background: #FF8C42; border: none; cursor: pointer; }
      `}</style>

      {/* 상단 네비게이션 영역 */}
      <header style={{ position: "relative", height: 108, flexShrink: 0 }}>
        <button
          onClick={handleBack}
          aria-label="뒤로가기"
          style={{
            position: "absolute",
            left: 12,
            top: 56,
            width: 32,
            height: 32,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderLeft: "2px solid #1E1E22",
              borderBottom: "2px solid #1E1E22",
              transform: "rotate(45deg)",
            }}
          />
        </button>
      </header>

      {/* [변경] 메인 컨텐츠 영역: 남는 공간을 모두 차지하고, 내용을 세로 중앙 정렬 */}
      <main
        style={{
          flex: 1, // 남는 공간 모두 차지
          padding: "12px 18px 0",
          display: "flex",
          flexDirection: "column",
          // justifyContent: "center", // 내용을 세로 중앙에 배치
          gap: 60, // 타이틀과 슬라이더 사이 간격
        }}
      >
        {/* 타이틀/설명 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              color: "#1E1E22",
              fontSize: 30,
              fontFamily: "Pretendard",
              fontWeight: 500,
              lineHeight: "34.5px",
            }}
          >
            마지막 질문이에요!
          </div>
          <div
            style={{
              color: "#1E1E22",
              fontSize: 22,
              fontFamily: "Pretendard",
              fontWeight: 500,
            }}
          >
            제주에서 달리고 싶은 거리를 선택해주세요.
          </div>
        </div>

        {/* [변경] 슬라이더 영역: 너비를 100%로 설정 */}
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* 0km / 20km 라벨 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              color: "#1E1E22",
              fontSize: 16,
              fontFamily: "Inter",
              lineHeight: "22.4px",
            }}
          >
            <span>0km</span>
            <span>20km</span>
          </div>

          {/* 트랙 + 슬라이더 + 값 라벨 */}
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              width: "100%",
              height: 8,
              background: "#E6E6E6",
              borderRadius: 9999,
            }}
          >
            {/* 진행 채움 */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${pctRaw}%`,
                background: "#FF8C42",
                borderRadius: 9999,
              }}
            />
            {/* 선택 값 라벨 */}
            <div
              style={{
                position: "absolute",
                left: `${pct}%`,
                top: -34,
                transform: "translateX(-50%)",
                background: "#FFFFFF",
                border: "1px solid #FF8C42",
                color: "#FF8C42",
                fontSize: 12,
                fontFamily: "Pretendard",
                fontWeight: 700,
                lineHeight: "16px",
                padding: "2px 8px",
                borderRadius: 12,
                whiteSpace: "nowrap",
              }}
            >
              {valueText}
              {/* 꼬리(삼각형) */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: -6,
                  transform: "translateX(-50%)",
                  width: 0,
                  height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: "6px solid #FF8C42",
                }}
              />
            </div>
            {/* 실제 슬라이더 */}
            <input
              className="distance-range"
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={km}
              onChange={(e) => setKm(Number(e.target.value))}
              aria-label="거리 선택 슬라이더"
              style={{ position: "relative", zIndex: 1, width: "100%" }}
            />
          </div>
        </div>
      </main>

      {/* [변경] 하단 CTA 버튼: sticky로 변경 */}
      <div
        style={{
          padding: "16px",
          paddingTop: 8,
          background: "white",
          position: "sticky",
          bottom: 0,
          flexShrink: 0,
        }}
      >
        <div style={{ paddingBottom: `env(safe-area-inset-bottom, 0px)` }}>
          <button
            onClick={handleSubmit}
            style={{
              width: "100%",
              height: 54,
              borderRadius: 6,
              border: "none",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#FF8C42",
              color: "#FCFCFC",
              fontSize: 16,
              fontFamily: "Pretendard",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}
