import React, { useEffect } from "react";

export default function FinalizingPage({
  recommendPath = "/recommend",
  durationMs = 2000,
  // 필요 시 전달할 데이터가 있다면 props로 넘겨서 fetch body에 사용하세요.
  // profile,
  // saveUrl = "/api/onboarding/complete",
  // onComplete,
}) {
  // [변경 없음] useEffect 로직과 API 관련 주석은 그대로 유지합니다.
  useEffect(() => {
    let cancelled = false;

    // ⬇️ API 호출 자리 (예시) — 주석 해제 후 사용
    // const api = (async () => {
    //   try {
    //     const res = await fetch(saveUrl, {
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({ profile }),
    //     });
    //     const data = await res.json().catch(() => null);
    //     if (!cancelled && onComplete) onComplete(data);
    //   } catch (e) {
    //     console.warn("finalizing error:", e);
    //   }
    // })();

    const delay = new Promise((r) => setTimeout(r, durationMs));

    Promise.allSettled([delay /*, api*/]).then(() => {
      if (!cancelled) window.location.href = recommendPath;
    });

    return () => {
      cancelled = true;
    };
  }, [durationMs, recommendPath /*, saveUrl, profile, onComplete*/]);

  return (
    // [변경] 전체 컨테이너를 화면 중앙 정렬 Flexbox로 설정
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center", // 수평 중앙 정렬
        justifyContent: "center", // 수직 중앙 정렬
        padding: "18px",
        gap: 60, // 타이틀과 스피너 사이의 간격
      }}
    >
      {/* 스피너 애니메이션 (변경 없음) */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* 타이틀/서브타이틀 */}
      <div
        style={{
          display: "flex", // inline-flex -> flex
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "#1E1E22",
            fontSize: 30,
            fontFamily: "Pretendard",
            fontWeight: 500,
            lineHeight: "34.5px",
          }}
        >
          추천코스를 생성중입니다!
        </div>
        <div
          style={{
            textAlign: "center",
            color: "#1E1E22",
            fontSize: 22,
            fontFamily: "Pretendard",
            fontWeight: 500,
          }}
        >
          잠시만 기다려주세요.
        </div>
      </div>

      {/* 회전 스피너 */}
      <div
        style={{
          width: 150,
          height: 150,
          position: "relative", // 내부 요소들의 기준점 역할은 유지
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* 바탕 도넛 */}
        <div
          style={{
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: "50%",
            border: "12px solid #E4E4E7", // 비활성 색상 변경
          }}
        />
        {/* 주황 아크 + 회전 */}
        <div
          style={{
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: "50%",
            border: "12px solid transparent",
            borderTopColor: "#FF8C42",
            animation: "spin 1.1s linear infinite",
          }}
        />
      </div>
    </div>
  );
}
