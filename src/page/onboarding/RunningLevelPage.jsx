import React, { useEffect, useMemo, useState } from "react";

// (LEVELS, normalizeIndex 등 상단 로직은 변경 없음)
const LEVELS = [
  {
    id: "level1",
    label: "가볍게 쉬엄쉬엄\n조깅하듯이 달리는 편이에요",
    img: "/level1.png",
  },
  {
    id: "level2",
    label: "꾸준히 쉬지 않고\n페이스를 유지하며 달리는 편이에요",
    img: "/level2.png",
  },
  {
    id: "level3",
    label: "높은 경사도 문제없어요!\n러닝에 자신있는 편이에요",
    img: "/level3.png",
  },
];
function normalizeIndex(defaultLevel) {
  if (!defaultLevel) return 0;
  const byId = LEVELS.findIndex((l) => l.id === defaultLevel);
  if (byId >= 0) return byId;
  const byLabel = LEVELS.findIndex((l) => l.label === defaultLevel);
  return byLabel >= 0 ? byLabel : 0;
}

export default function RunningLevelPage({
  defaultLevel = null,
  onBack,
  onNext,
}) {
  const [idx, setIdx] = useState(() => normalizeIndex(defaultLevel));

  // [추가] 1. 애니메이션 효과를 위한 상태
  const [isFading, setIsFading] = useState(false);

  const level = LEVELS[idx];
  const canProceed = useMemo(() => !!level, [level]);

  // [수정] 2. prev/next 함수를 애니메이션을 고려하여 변경
  const changeLevel = (newIndex) => {
    if (newIndex === idx || isFading) return; // 이미 바뀌고 있으면 중복 실행 방지

    setIsFading(true); // 애니메이션 시작 (사라지기)
    setTimeout(() => {
      setIdx(newIndex); // 내용 변경
      setIsFading(false); // 애니메이션 종료 (나타나기)
    }, 200); // 0.2초 뒤에 실행
  };

  const prev = () => changeLevel(Math.max(0, idx - 1));
  const next = () => changeLevel(Math.min(LEVELS.length - 1, idx + 1));

  const submit = () => {
    if (canProceed && onNext) onNext(level.label);
  };

  // ... (useEffect, handleBack 등 나머지 로직은 거의 동일) ...
  useEffect(() => {
    const h = (e) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Enter") submit();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, isFading]); // isFading을 의존성 배열에 추가

  const handleBack = () => {
    if (typeof onBack === "function") onBack();
    else if (window.history?.length > 0) window.history.back();
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
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
      <main
        style={{
          flex: 1,
          padding: "0 18px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
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
          평소 러닝 강도는?
        </h1>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ position: "relative", width: "100%" }}>
            {/* [수정] 3. 애니메이션 스타일 적용 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                // --- 애니메이션 스타일 ---
                transition:
                  "opacity 200ms ease-in-out, transform 200ms ease-in-out",
                opacity: isFading ? 0 : 1,
                transform: isFading ? "scale(0.98)" : "scale(1)",
              }}
            >
              <div
                style={{
                  padding: "0 10px",
                  textAlign: "center",
                  color: "#1E1E22",
                  fontSize: 18,
                  fontFamily: "Pretendard",
                  fontWeight: 500,
                  lineHeight: "26px",
                  whiteSpace: "pre-line",
                  wordBreak: "keep-all",
                  minHeight: 52,
                }}
              >
                {`“${level.label}”`}
              </div>

              <img
                src={level.img}
                alt={level.id}
                style={{ width: 180, height: 150, objectFit: "contain" }}
              />
            </div>
            {/* (좌/우 화살표 버튼 코드는 변경 없음) */}
            <button
              onClick={prev}
              disabled={idx === 0}
              aria-label="이전 레벨"
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: "rgba(0,0,0,0.50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: idx === 0 ? "not-allowed" : "pointer",
                opacity: idx === 0 ? 0.4 : 1,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderLeft: "2px solid #FFFFFF",
                  borderBottom: "2px solid #FFFFFF",
                  transform: "rotate(45deg)",
                }}
              />
            </button>
            <button
              onClick={next}
              disabled={idx === LEVELS.length - 1}
              aria-label="다음 레벨"
              style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: 32,
                height: 32,
                borderRadius: "50%",
                border: "none",
                background: "rgba(0,0,0,0.50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: idx === LEVELS.length - 1 ? "not-allowed" : "pointer",
                opacity: idx === LEVELS.length - 1 ? 0.4 : 1,
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderLeft: "2px solid #FFFFFF",
                  borderBottom: "2px solid #FFFFFF",
                  transform: "rotate(-135deg)",
                }}
              />
            </button>
          </div>
        </div>
      </main>
      {/* (하단 CTA 버튼 코드는 변경 없음) */}
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
