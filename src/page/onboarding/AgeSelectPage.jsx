import React, { useEffect, useMemo, useState } from "react";

const AGE_OPTIONS = ["10대", "20대", "30대", "40대", "50대 이상"];

export default function AgeSelectPage({
  defaultAgeGroup = null,
  onBack,
  onNext,
}) {
  const [age, setAge] = useState(defaultAgeGroup);
  const canProceed = useMemo(() => !!age, [age]);

  // --- 기존 로직 (변경 없음) ---
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && canProceed) submit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canProceed, age]);

  const submit = () => {
    if (!canProceed) return;
    onNext?.(age);
  };

  const handleBack = () => {
    if (typeof onBack === "function") onBack();
    else if (window.history?.length > 0) window.history.back();
  };

  // --- 스타일 함수 (일부 수정) ---
  const optionStyle = (selected) => ({
    width: "100%",
    height: 60,
    padding: "14px 16px",
    borderRadius: 6,
    display: "flex", // inline-flex -> flex
    alignItems: "center",
    background: selected ? "#FFF4EC" : "#FFFFFF",
    outline: selected ? "1px solid var(--main, #FF8C42)" : "1px solid #C4C4C6",
    outlineOffset: -1,
    border: "none",
    cursor: "pointer",
    transition: "background 120ms ease, outline-color 120ms ease",
    textAlign: "left", // 텍스트 왼쪽 정렬
  });

  const textStyle = (selected) => ({
    // [변경] 고정 너비 제거
    color: selected ? "#2A292E" : "#9CA3AF", // 비활성 색상 명확하게 변경
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

      {/* [변경] 메인 컨텐츠 영역: 남는 공간을 모두 차지하도록 설정 */}
      <main
        style={{
          flex: 1, // 남는 공간 모두 차지
          padding: "10px 18px 0",
          display: "flex",
          flexDirection: "column",
          gap: 28, // 타이틀과 옵션 리스트 사이 간격
          // [추가] 옵션이 많아져도 스크롤 가능하도록
          overflowY: "auto",
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
            margin: 0, // h1 기본 마진 제거
          }}
        >
          러너님의 나이는?
        </h1>

        {/* 옵션 리스트 */}
        <div
          role="radiogroup"
          aria-label="나이 선택"
          style={{
            width: "100%", // 너비를 100%로 설정
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {AGE_OPTIONS.map((label) => {
            const selected = age === label;
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAge(label)}
                style={optionStyle(selected)}
              >
                {/* [변경] 내부 div 제거하고 span으로 변경 */}
                <span style={textStyle(selected)}>{label}</span>
              </button>
            );
          })}
        </div>
      </main>

      {/* [변경] 하단 CTA 버튼: 너비를 화면에 맞게 동적으로 조정 */}
      <div
        style={{
          // [추가] main 영역 스크롤 시에도 배경이 비치지 않도록
          padding: "16px",
          paddingTop: 8,
          position: "sticky", // sticky로 변경하여 스크롤 끝에 붙도록
          bottom: 0,
          background: "white",
        }}
      >
        <div
          style={{
            // iPhone safe area 대응
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
