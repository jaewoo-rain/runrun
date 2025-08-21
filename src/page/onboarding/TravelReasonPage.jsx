// src/TravelReasonPage.jsx
import React, { useMemo, useState, useEffect } from "react";

const REASON_CHIPS = [
  "😌 힐링",
  "💪 운동과 건강",
  "🫶🏻 자아성찰",
  "📷 SNS 업로드",
  "📖 교육적 목적",
  "👀 새로운 경험",
  "😎 신혼여행 및 특별한 목적",
];

export default function TravelReasonPage({
  defaultReason = null,
  onBack,
  onNext,
}) {
  const [reason, setReason] = useState(defaultReason);
  const canProceed = useMemo(() => !!reason, [reason]);

  // --- 기존 로직 (변경 없음) ---
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && canProceed) submit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canProceed, reason]);

  const submit = () => {
    if (!canProceed) return;
    onNext?.(reason);
  };

  const handleBack = () => {
    if (typeof onBack === "function") onBack();
    else if (window.history?.length > 0) window.history.back();
  };

  // --- 스타일 함수 (변경 없음) ---
  const chipStyle = (selected) => ({
    height: 40,
    padding: "8px 16px",
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    background: selected ? "#FFF4EC" : "#F4F4F5", // 비선택 배경색 변경
    outline: selected ? "1px solid var(--main, #FF8C42)" : "none",
    outlineOffset: -1,
    border: "none",
    cursor: "pointer",
    transition: "background 120ms ease, outline-color 120ms ease",
  });

  const chipTextStyle = (selected) => ({
    color: selected ? "#1E1E22" : "#71717A", // 비선택 텍스트색 변경
    fontSize: 14,
    fontFamily: "Pretendard",
    fontWeight: 400,
    lineHeight: "19.6px",
    whiteSpace: "nowrap",
  });

  return (
    // [변경] 전체 컨테이너를 화면에 꽉 차는 Flexbox로 설정
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        position: "relative",
        background: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 상단 네비게이션 영역 */}
      <header style={{ position: "relative", height: 108 }}>
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

      {/* [변경] 메인 컨텐츠 영역: 남는 공간을 모두 차지하고, 필요시 스크롤 */}
      <main
        style={{
          flex: 1, // 남는 공간 모두 차지
          padding: "12px 18px 0",
          display: "flex",
          flexDirection: "column",
          gap: 28, // 타이틀과 칩 리스트 사이 간격
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
            lineHeight: "34.5px", // line-height 수정
            margin: 0,
          }}
        >
          제주에 여행 오신 이유는?
        </h1>

        {/* 칩 리스트 */}
        <div
          role="radiogroup"
          aria-label="여행 이유 선택"
          style={{
            // [변경] position 제거, width 100%로 변경
            width: "100%",
            display: "flex",
            flexWrap: "wrap", // 이 속성 덕분에 칩이 자동으로 줄바꿈됩니다.
            alignItems: "flex-start",
            gap: "14px", // column-gap과 row-gap을 동시에 설정
          }}
        >
          {REASON_CHIPS.map((label) => {
            const selected = reason === label;
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setReason(label)}
                style={chipStyle(selected)}
              >
                <span style={chipTextStyle(selected)}>{label}</span>
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
          position: "sticky",
          bottom: 0,
          background: "white",
        }}
      >
        <div
          style={{
            paddingBottom: `env(safe-area-inset-bottom, 0px)`,
          }}
        >
          <button
            onClick={submit}
            disabled={!canProceed}
            style={{
              width: "100%",
              height: 54,
              borderRadius: 6,
              border: "none",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
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
