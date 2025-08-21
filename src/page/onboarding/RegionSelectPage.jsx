import React, { useEffect, useMemo, useState } from "react";

export default function RegionSelectPage({
  defaultRegion = null,
  onBack,
  onNext,
}) {
  const [region, setRegion] = useState(defaultRegion);
  const canProceed = useMemo(() => !!region, [region]);

  // --- 기존 로직 (변경 없음) ---
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && canProceed) handleNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canProceed, region]);

  const handleNext = () => {
    if (region && onNext) onNext(region);
  };

  const handleBack = () => {
    if (typeof onBack === "function") onBack();
    else if (window.history?.length > 0) window.history.back();
  };

  const regionList = ["동부", "서부", "남부", "북부"];

  // --- 스타일 함수 (일부 수정) ---
  const listItemStyle = (selected) => ({
    width: "100%",
    height: 60,
    padding: "14px 16px",
    borderRadius: 6,
    display: "flex", // inline-flex -> flex
    alignItems: "center",
    background: selected ? "#FFF4EC" : "#FFFFFF",
    outline: selected ? "1px solid var(--main, #FF8C42)" : "1px solid #E4E4E7",
    outlineOffset: -1,
    border: "none",
    cursor: "pointer",
    transition: "background 120ms ease, outline-color 120ms ease",
    textAlign: "left",
  });

  const listTextStyle = (selected) => ({
    // [변경] 고정 너비 제거
    color: selected ? "#2A292E" : "#71717A",
    fontSize: 16,
    fontFamily: "Pretendard",
    fontWeight: 500,
    lineHeight: "16px",
  });

  return (
    // [변경] 전체 컨테이너를 화면에 꽉 차는 Flexbox로 설정
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 상단 네비게이션 영역 */}
      <header style={{ position: "relative", height: 108, flexShrink: 0 }}>
        {/* 뒤로가기 버튼 */}
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

      {/* [변경] 메인 컨텐츠 영역: 스크롤 가능하도록 설정 */}
      <main
        style={{
          flex: 1, // 남는 공간 모두 차지
          padding: "12px 18px 0",
          display: "flex",
          flexDirection: "column",
          gap: 16, // 요소들 사이의 간격
          overflowY: "auto", // 내용이 많아지면 스크롤
        }}
      >
        {/* 타이틀 */}
        <h1
          style={{
            color: "#1E1E22",
            fontSize: 30,
            fontFamily: "Pretendard",
            fontWeight: 500,
            lineHeight: "34.5px",
            margin: 0,
          }}
        >
          제주에서 러닝하실 지역은?
        </h1>

        {/* [변경] 지도 이미지: 반응형으로 크기 조절 */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px 0",
          }}
        >
          <img
            src="/jeju.png" // 실제 이미지 경로로 수정 필요
            alt="제주 지도"
            style={{
              maxWidth: 300, // 최대 너비 제한
              width: "80%", // 컨테이너의 80% 너비 차지
              height: "auto", // 높이는 비율에 맞게 자동 조절
              objectFit: "contain",
            }}
          />
        </div>

        {/* 리스트(동/서/남/북) */}
        <div
          role="radiogroup"
          aria-label="지역 선택"
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            paddingBottom: 24, // 리스트 하단 여백
          }}
        >
          {regionList.map((r) => {
            const selected = region === r;
            return (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setRegion(r)}
                style={listItemStyle(selected)}
              >
                <span style={listTextStyle(selected)}>{r}</span>
              </button>
            );
          })}
        </div>
      </main>

      {/* [변경] 하단 CTA 버튼: 스크롤과 무관하게 항상 하단에 고정 */}
      <div
        style={{
          padding: "16px",
          paddingTop: 8,
          background: "white",
          position: "sticky",
          bottom: 0,
        }}
      >
        <div style={{ paddingBottom: `env(safe-area-inset-bottom, 0px)` }}>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed}
            style={{
              width: "100%",
              height: 54,
              borderRadius: 6,
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: canProceed ? "#FF8C42" : "#E4E4E7",
              color: canProceed ? "#FCFCFC" : "#9CA3AF",
              fontSize: 16,
              fontFamily: "Pretendard",
              fontWeight: 700,
              cursor: canProceed ? "pointer" : "not-allowed",
            }}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
