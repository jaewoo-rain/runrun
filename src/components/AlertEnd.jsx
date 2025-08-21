import React from "react";

const AlertEnd = ({ onClose, onEnd, userName = "러너" }) => {
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Enter") onEnd?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onEnd]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 320,
          maxWidth: "88vw",
          background: "white",
          borderRadius: 16,
          padding: "20px 18px 16px",
          textAlign: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}
      >
        <div
          style={{
            color: "#000",
            fontSize: 20,
            fontFamily: "Pretendard",
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: 6,
            wordBreak: "keep-all",
          }}
        >
          축하드립니다 {userName}님!
        </div>

        <div
          style={{
            color: "#000",
            fontSize: 18,
            fontFamily: "Pretendard",
            fontWeight: 700,
            lineHeight: 1.35,
            marginBottom: 10,
            wordBreak: "keep-all",
          }}
        >
          코스 완주를 완료하셨습니다.
        </div>

        <div
          style={{
            color: "#626264",
            fontSize: 13,
            fontFamily: "Pretendard",
            fontWeight: 500,
            lineHeight: 1.5,
            marginBottom: 14,
            wordBreak: "keep-all",
          }}
        >
          해돋이 러너 배지를 획득하셨습니다.
          <br />
          러너들과 기록을 공유해보세요.
        </div>

        <button
          onClick={onEnd}
          style={{
            appearance: "none",
            background: "transparent",
            border: "none",
            color: "var(--main, #FF8C42)",
            fontSize: 16,
            fontFamily: "Pretendard",
            fontWeight: 700,
            cursor: "pointer",
            padding: "6px 10px",
          }}
          aria-label="기록보기"
        >
          기록보기
        </button>
      </div>
    </div>
  );
};

export default AlertEnd;
