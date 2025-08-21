import React, { useEffect, useState } from "react";

export default function InputInfoPage({
  defaultNickname = "",
  onNext,
  onBack,
}) {
  const [nickname, setNickname] = useState(defaultNickname);
  const [kbOffset, setKbOffset] = useState(0);
  const canProceed = nickname.trim().length > 0;

  // --- 기존 로직 (변경 없음) ---
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter" && canProceed) submit();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [canProceed, nickname]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKbOffset(offset);
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  const submit = () => {
    if (!canProceed || !onNext) return;
    onNext(nickname.trim());
  };

  const handleBack = () => {
    if (typeof onBack === "function") onBack();
    else if (window.history && window.history.length > 0) window.history.back();
  };
  // --- 기존 로직 끝 ---

  return (
    // [변경] 전체 컨테이너: 화면 전체를 차지하도록 Flexbox 레이아웃 적용
    <div
      style={{
        width: "100%",
        minHeight: "100vh", // 화면 높이만큼 최소 높이 확보
        position: "relative",
        background: "white",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column", // 자식 요소들을 세로로 정렬
      }}
    >
      {/* 상단 네비게이션 영역 */}
      <header style={{ position: "relative", height: 96 }}>
        {/* 상태바는 디자인 요소이므로 실제 앱에서는 보통 제거합니다. */}
        {/* 뒤로가기 버튼 */}
        <button
          onClick={handleBack}
          aria-label="뒤로가기"
          style={{
            position: "absolute",
            left: 12,
            top: 54,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
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
          flex: 1, // 남는 공간을 모두 차지
          padding: "12px 18px 0", // 상단 여백 및 좌우 여백
          display: "flex",
          flexDirection: "column",
          gap: 68, // 헤드라인과 인풋 사이 간격
        }}
      >
        {/* 헤드라인 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              color: "#1E1E22",
              fontSize: 30,
              fontFamily: "Pretendard",
              fontWeight: 500,
              lineHeight: "34.5px",
            }}
          >
            반가워요 러너님,
          </div>
          <div
            style={{
              color: "#1E1E22",
              fontSize: 20,
              fontFamily: "Pretendard",
              fontWeight: 500,
            }}
          >
            앱에서 활동하실 닉네임을 정해주세요.
          </div>
        </div>

        {/* 인풋 */}
        <div
          style={{
            width: "100%", // 너비를 100%로 설정
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              height: 56,
              borderRadius: 4,
              outline: "3px #1E1E22 solid",
              outlineOffset: -3,
              display: "flex",
              alignItems: "center",
              paddingLeft: 16,
              paddingRight: 4,
              gap: 4,
            }}
          >
            <input
              type="text"
              placeholder="닉네임 입력"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={20}
              style={{
                flex: 1,
                height: 48,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 16,
                fontFamily: "Pretendard",
                color: "#1E1E22",
              }}
            />
            {nickname && (
              <button
                onClick={() => setNickname("")}
                aria-label="입력 지우기"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#F4F4F5",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>×</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* [변경] 다음 버튼: 너비를 화면에 맞게 동적으로 조정 */}
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16, // left, right를 모두 주어 너비를 유연하게
          bottom: `calc(env(safe-area-inset-bottom, 0px) + 16px)`,
          transform: `translateY(-${kbOffset}px)`,
          transition: "transform 180ms ease",
          zIndex: 10,
        }}
      >
        <button
          onClick={submit}
          disabled={!canProceed}
          style={{
            width: "100%", // 부모 너비에 꽉 차게
            height: 54,
            background: canProceed ? "var(--main, #FF8C42)" : "#E4E4E7",
            borderRadius: 6,
            border: "none",
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: canProceed ? "pointer" : "not-allowed",
          }}
        >
          <div
            style={{
              color: canProceed ? "#FCFCFC" : "#9CA3AF",
              fontSize: 16,
              fontFamily: "Pretendard",
              fontWeight: 700,
            }}
          >
            다음
          </div>
        </button>
      </div>
    </div>
  );
}
