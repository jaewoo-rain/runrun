import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// 댓글 UI 컴포넌트
const CommentItem = ({ comment }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <img
      src={comment.avatar}
      alt={comment.author}
      style={{ width: 24, height: 24, borderRadius: 999 }}
    />
    <div
      style={{
        color: "white",
        fontSize: 14,
        textShadow: "0 1px 3px rgba(0,0,0,0.5)",
      }}
    >
      <span style={{ fontWeight: 700, marginRight: 6 }}>{comment.author}</span>
      <span>{comment.text}</span>
    </div>
  </div>
);

// 스토리 카드 컴포넌트
function StoryCard({ data, active, comments }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        borderRadius: 24, // ✅ 둥근 모서리 다시 적용
        overflow: "hidden",
        backgroundImage: `url(${data.photo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        scrollSnapAlign: "center",
      }}
    >
      {/* 프로그레스 바 */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 10,
          right: 10,
          zIndex: 10,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 2,
            background: "rgba(255,255,255,0.3)",
            borderRadius: 2,
          }}
        >
          {active && (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "white",
                transformOrigin: "left",
                animation: "progressAnimation 10s linear forwards",
              }}
              key={data.id}
            ></div>
          )}
        </div>
      </div>
      <style>
        {`
          @keyframes progressAnimation {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
        `}
      </style>

      {/* 상단 프로필/시간 */}
      <div
        style={{
          padding: 20,
          paddingTop: 22,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={data.avatar}
            alt={data.author}
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.5)",
            }}
          />
          <span
            style={{ fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,.4)" }}
          >
            {data.author}
          </span>
          <span
            style={{
              fontSize: 12,
              opacity: 0.9,
              textShadow: "0 1px 2px rgba(0,0,0,.4)",
            }}
          >
            {data.timeAgo}
          </span>
        </div>
      </div>

      {/* 하단 댓글 목록 */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: 20,
          right: 20,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {(comments || []).map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function StoryViewerPage({
  locationName,
  myStory,
  others = [],
}) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const [active, setActive] = useState(0);
  const [reply, setReply] = useState("");

  const initialStories = useMemo(
    () => [myStory, ...others].filter(Boolean),
    [myStory, others]
  );

  const [stories, setStories] = useState(initialStories);

  // 10초마다 자동으로 다음 스토리로 넘기는 로직
  useEffect(() => {
    if (stories.length <= 1) return;
    const timer = setTimeout(() => {
      if (active === stories.length - 1) {
        navigate(-1);
      } else {
        const el = containerRef.current;
        if (el) {
          el.scrollTo({
            left: el.clientWidth * (active + 1),
            behavior: "smooth",
          });
        }
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [active, stories, navigate]);

  // 스크롤 시 active 카드 계산
  useEffect(() => {
    const el = containerRef.current;
    if (!el || stories.length === 0) return;
    let rafId;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const newIndex = Math.round(el.scrollLeft / el.clientWidth);
        if (active !== newIndex) {
          setActive(newIndex);
        }
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [stories.length, active]);

  // 댓글 보내기 기능
  const handleSendReply = () => {
    if (!reply.trim()) return;

    const newComment = {
      id: Date.now(),
      author: "나",
      avatar:
        myStory?.avatar || "https://placehold.co/40x40/FF8C42/white?text=ME",
      text: reply,
    };

    const updatedStories = stories.map((story, index) => {
      if (index === active) {
        return {
          ...story,
          comments: [...(story.comments || []), newComment],
        };
      }
      return story;
    });

    setStories(updatedStories);
    setReply("");
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        background: "black",
        display: "flex",
        flexDirection: "column",
        color: "white",
      }}
    >
      {/* 헤더 */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 14px",
          paddingTop: 56,
          flexShrink: 0,
          position: "relative",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ color: "#FF8C42" }}>📍</div>
          <span style={{ fontWeight: 700, fontSize: 16 }}>{locationName}</span>
        </div>
        <button
          onClick={() => navigate("/run")}
          style={{
            background: "#FF8C42",
            color: "white",
            border: "none",
            borderRadius: 999,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z"
              fill="white"
            />
          </svg>
          RUN
        </button>
      </header>

      {/* ✅ [수정됨] 메인 스토리 뷰 (상하 여백 추가) */}
      <main
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          padding: "8px 0",
        }}
      >
        {/* 가로 스크롤을 위해 각 카드에 좌우 마진을 줌 */}
        {stories.map((s, i) => (
          <div
            key={s.id || i}
            style={{
              flex: "0 0 100%",
              padding: "0 10px",
              boxSizing: "border-box",
            }}
          >
            <StoryCard data={s} active={i === active} comments={s.comments} />
          </div>
        ))}
      </main>

      {/* ✅ [수정됨] 새로운 푸터 UI (댓글 입력창 + 아이콘 버튼) */}
      <footer
        style={{
          padding: "8px 10px",
          paddingBottom: "calc(env(safe-area-inset-bottom, 8px))",
          flexShrink: 0,
        }}
      >
        {/* 댓글 입력창 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <img
            src={
              myStory?.avatar ||
              "https://placehold.co/40x40/FF8C42/white?text=ME"
            }
            alt="my-avatar"
            style={{ width: 32, height: 32, borderRadius: 999 }}
          />
          <div
            style={{
              flex: 1,
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendReply()}
              placeholder="이 스토리에 답글을 다세요..."
              style={{
                width: "100%",
                height: 42,
                borderRadius: 999,
                border: "1px solid #545458",
                background: "#1C1C1E",
                padding: "0 48px 0 16px",
                color: "white",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={handleSendReply}
              disabled={!reply.trim()}
              style={{
                position: "absolute",
                right: 8,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                opacity: reply.trim() ? 1 : 0.5,
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF8C42">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
        {/* 아이콘 버튼들 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8 14h8v-8h-8v8zm2-6h4v4h-4v-4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v4h-4v2h4v4h2v-4h4v-2h-4z" />
            </svg>
          </button>
          <button
            onClick={() => navigate("/camera")}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                border: "4px solid #FF8C42",
                background: "white",
              }}
            ></div>
          </button>
          <button
            onClick={() => alert("저장 기능 구현 필요")}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <img
              src="/download.png" // ✅ public 폴더 경로는 /로 접근
              alt="back"
              style={{ width: 28, height: 28 }}
            />
          </button>
        </div>
      </footer>
    </div>
  );
}
