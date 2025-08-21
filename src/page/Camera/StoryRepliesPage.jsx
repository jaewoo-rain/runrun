// src/pages/StoryRepliesPage.jsx

import React, { useEffect, useMemo, useRef, useState } from "react";

// 개별 스토리 카드 UI를 위한 서브 컴포넌트
function StoryCard({ data, width, height, active, showToast }) {
  return (
    <div
      style={{
        flex: "0 0 auto",
        width,
        height,
        position: "relative",
        borderRadius: 24,
        overflow: "hidden",
        backgroundImage: `url(${data.photo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        scrollSnapAlign: "center",
        transition: "opacity 0.25s, transform 0.25s",
        opacity: active ? 1 : 0.4,
        transform: active ? "scale(1)" : "scale(0.95)",
        boxShadow: active ? "0px 0px 15px rgba(255, 255, 255, 0.2)" : "none",
      }}
    >
      {/* 상단 프로필/시간 */}
      <div
        style={{
          position: "absolute",
          left: 20,
          top: 22,
          display: "flex",
          alignItems: "center",
          gap: 10,
          userSelect: "none",
        }}
      >
        <img
          src={data.avatar}
          alt={data.author}
          style={{
            width: 30,
            height: 30,
            borderRadius: 9999,
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        />
        <div
          style={{
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            textShadow: "0 1px 2px rgba(0,0,0,.4)",
          }}
        >
          {data.author}
        </div>
        <div
          style={{
            color: "white",
            fontSize: 12,
            fontWeight: 500,
            opacity: 0.9,
            textShadow: "0 1px 2px rgba(0,0,0,.4)",
          }}
        >
          {data.timeAgo}
        </div>
      </div>

      {/* 하단 캡션 */}
      {data.caption && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 44,
            padding: "10px 14px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: 20,
            backdropFilter: "blur(5px)",
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            whiteSpace: "nowrap",
            maxWidth: width - 40,
            textOverflow: "ellipsis",
            overflow: "hidden",
          }}
          title={data.caption}
        >
          {data.caption}
        </div>
      )}

      {/* 답장 전송 완료 토스트 */}
      {showToast && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            padding: "10px 14px",
            background: "rgba(255,255,255,0.9)",
            borderRadius: 12,
            color: "#111",
            fontSize: 14,
            fontWeight: 700,
            border: "1px solid rgba(0,0,0,0.06)",
            zIndex: 10,
          }}
        >
          답장이 전송됨
        </div>
      )}
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function StoryRepliesPage({
  locationName = "함덕해수욕장",
  myStory,
  others = [],
}) {
  const containerRef = useRef(null);
  const [active, setActive] = useState(0);
  const [reply, setReply] = useState("");
  const [sentToastFor, setSentToastFor] = useState(null);

  // 동적 카드/레이아웃 크기 계산을 위한 상태
  const [cardW, setCardW] = useState(297);
  const [cardH, setCardH] = useState(528);
  const [gap, setGap] = useState(16);
  const [sidePad, setSidePad] = useState(32);

  // 화면 크기에 맞춰 카드 크기 동적 계산
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const calc = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || 528;
      const targetH = h * 0.95; // 높이를 꽉 채우지 않고 약간의 여유를 줌
      const targetW = Math.min(Math.round((targetH * 9) / 16), w - 32);
      const pad = Math.max((w - targetW) / 2, 16);

      setCardH(targetH);
      setCardW(targetW);
      setGap(16);
      setSidePad(pad);
    };
    calc(); // 최초 실행
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // props로 받은 스토리를 하나의 배열로 합침
  const stories = useMemo(
    () => [myStory, ...others].filter(Boolean),
    [myStory, others]
  );

  // 스크롤 시 중앙에 위치한 카드를 active 상태로 설정
  useEffect(() => {
    const el = containerRef.current;
    if (!el || stories.length === 0) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const center = el.scrollLeft + el.clientWidth / 2;
        const closestIndex = stories.reduce((closest, _, i) => {
          const cardCenter = sidePad + i * (cardW + gap) + cardW / 2;
          const dist = Math.abs(center - cardCenter);
          const closestDist = Math.abs(
            center - (sidePad + closest * (cardW + gap) + cardW / 2)
          );
          return dist < closestDist ? i : closest;
        }, 0);
        setActive(closestIndex);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [stories, sidePad, cardW, gap]);

  // 답장 보내기 핸들러
  const handleSend = () => {
    if (!reply.trim() || !stories.length) return;
    const current = stories[active];
    // TODO: 실제 답장 API 호출 로직
    console.log(`Sending reply "${reply}" to story ID: ${current.id}`);
    setSentToastFor(current.id || active);
    setReply("");
    setTimeout(() => setSentToastFor(null), 1500);
  };

  // 위치 아이콘 JSX
  const pinIcon = (
    <div style={{ width: 20, height: 24, position: "relative" }}>
      <div
        style={{
          width: 20,
          height: 24,
          position: "absolute",
          background: "#FF8C42",
          borderRadius: 4,
        }}
      />
      <div
        style={{
          width: 6.5,
          height: 6.5,
          position: "absolute",
          left: 7,
          top: 6.5,
          background: "white",
          borderRadius: 999,
        }}
      />
    </div>
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100dvh",
        background: "black",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          flexShrink: 0,
          zIndex: 5,
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div
          style={{
            height: 44,
            color: "white",
            display: "flex",
            alignItems: "center",
            padding: "12px 18px",
            boxSizing: "border-box",
            fontWeight: 600,
          }}
        >
          9:41
        </div>
        <div
          style={{
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {pinIcon}
          <div style={{ color: "white", fontSize: 24, fontWeight: 700 }}>
            {locationName}
          </div>
        </div>
      </header>

      <main
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          gap,
          padding: `0 ${sidePad}px`,
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          scrollPadding: `0 ${sidePad}px`,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {stories.map((s, i) => (
          <StoryCard
            key={s.id || i}
            data={s}
            width={cardW}
            height={cardH}
            active={i === active}
            showToast={sentToastFor === (s.id || i)}
          />
        ))}
      </main>

      <footer
        style={{
          flexShrink: 0,
          zIndex: 5,
          padding: "0 16px",
          paddingBottom: `calc(env(safe-area-inset-bottom, 8px))`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "16px 0",
          }}
        >
          <img
            src={myStory?.avatar}
            alt="my-avatar"
            style={{ width: 42, height: 42, borderRadius: 9999 }}
          />
          <div
            style={{
              flex: 1,
              height: 42,
              background: "#1C1C1E",
              borderRadius: 43,
              border: "1px solid #545458",
              display: "flex",
              alignItems: "center",
              padding: "0 8px 0 16px",
              gap: 8,
            }}
          >
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                stories.length
                  ? "이 스토리에 답글을 다세요..."
                  : "볼 스토리가 없어요"
              }
              disabled={!stories.length}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "white",
                fontSize: 14,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!reply.trim() || !stories.length}
              style={{
                border: "none",
                background: "transparent",
                color: reply.trim() && stories.length ? "#FF8C42" : "#8A8A8E",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                padding: "8px",
              }}
            >
              보내기
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
