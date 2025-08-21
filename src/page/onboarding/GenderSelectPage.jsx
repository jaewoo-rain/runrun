import React, { useEffect, useMemo, useState } from "react";

export default function GenderSelectPage({
  defaultGender = null,
  defaultAgeGroup = null,
  onBack,
  onNext,
}) {
  const [gender, setGender] = useState(defaultGender);
  const canProceed = useMemo(() => !!gender, [gender]);

  // --- 기존 로직 (변경 없음) ---
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && canProceed) submit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canProceed]);

  const submit = () => {
    if (!canProceed) return;
    onNext?.(gender, defaultAgeGroup ?? null);
  };

  const handleBack = () => {
    if (typeof onBack === "function") onBack();
    else if (window.history?.length > 0) window.history.back();
  };

  const optionStyle = (selected) => ({
    width: "100%",
    height: 60,
    padding: "14px 16px",
    borderRadius: 6,
    display: "flex", // inline-flex -> flex
    alignItems: "center",
    justifyContent: "flex-start",
    border: "none",
    cursor: "pointer",
    background: selected ? "#FFF4EC" : "#FFFFFF",
    outline: selected ? "1px solid var(--main, #FF8C42)" : "1px solid #C4C4C6",
    outlineOffset: -1,
    transition: "background 120ms ease, outline-color 120ms ease",
  });

  const optionTextStyle = (selected) => ({
    color: selected ? "#2A292E" : "#9CA3AF", // 비활성 색상 명확하게 변경
    fontSize: 16,
    fontFamily: "Pretendard",
    fontWeight: 500,
    lineHeight: "16px",
  });
  // --- 기존 로직 끝 ---

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
            top: 56, // y-position 조정
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
          padding: "10px 18px 0", // 상단 여백 및 좌우 여백
          display: "flex",
          flexDirection: "column",
          gap: 28, // 타이틀과 옵션 그룹 사이 간격
        }}
      >
        {/* 타이틀 */}
        <div
          style={{
            color: "#1E1E22",
            fontSize: 30,
            fontFamily: "Pretendard",
            fontWeight: 500,
            lineHeight: "34.5px",
          }}
        >
          러너님의 성별은?
        </div>

        {/* 성별 옵션 */}
        <div
          role="radiogroup"
          aria-label="성별 선택"
          style={{
            width: "100%", // 너비를 100%로 설정
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* 남자 */}
          <button
            type="button"
            role="radio"
            aria-checked={gender === "male"}
            onClick={() => setGender("male")}
            style={optionStyle(gender === "male")}
          >
            <span style={optionTextStyle(gender === "male")}>남자</span>
          </button>

          {/* 여자 */}
          <button
            type="button"
            role="radio"
            aria-checked={gender === "female"}
            onClick={() => setGender("female")}
            style={optionStyle(gender === "female")}
          >
            <span style={optionTextStyle(gender === "female")}>여자</span>
          </button>
        </div>
      </main>

      {/* [변경] 하단 CTA 버튼: 너비를 화면에 맞게 동적으로 조정 */}
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16, // left, right를 모두 주어 너비를 유연하게
          bottom: `calc(env(safe-area-inset-bottom, 0px) + 16px)`,
          zIndex: 10,
        }}
      >
        <button
          type="button"
          disabled={!canProceed}
          onClick={submit}
          style={{
            width: "100%",
            height: 54,
            background: canProceed ? "#FF8C42" : "#E4E4E7",
            borderRadius: 6,
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
  );
}
