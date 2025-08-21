import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { mockStories } from "../../data/mockData"; // 데이터는 외부에서 가져온다고 가정합니다.

// StoryItem 컴포넌트 (변경 없음)
const StoryItem = ({ story, onClick }) => {
  const itemStyle = {
    width: "118px",
    height: "157px",
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundImage: `url(${story.imageSrc})`,
    cursor: "pointer",
  };

  const overlayStyle = {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: 8,
    color: "white",
  };

  return (
    <div style={itemStyle} onClick={onClick}>
      <div style={overlayStyle}>
        <div
          style={{ fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
        ></div>
        <div
          style={{
            fontSize: 12,
            opacity: 0.9,
            textShadow: "0 1px 2px rgba(0,0,0,0.7)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        ></div>
      </div>
    </div>
  );
};

// 메인 페이지 컴포넌트 (수정됨)
export default function StoryFeedPage() {
  const location = useLocation();
  const navigate = useNavigate();

  let capturedPhoto = location.state?.capturedPhoto;

  if (!capturedPhoto) {
    try {
      const storedPhotoJSON = localStorage.getItem("userCapturedStory");
      if (storedPhotoJSON) {
        capturedPhoto = JSON.parse(storedPhotoJSON);
      }
    } catch (e) {
      console.error("localStorage에서 스토리를 파싱하는데 실패했습니다.", e);
      localStorage.removeItem("userCapturedStory");
    }
  }

  let stories = mockStories;
  if (capturedPhoto) {
    const userStory = {
      id: "user-photo-0",
      type: "user_photo",
      imageSrc: capturedPhoto.photoUrl,
      avatar: "https://placehold.co/30x30/FF8C42/white?text=ME",
      timeAgo: "방금",
      photo: capturedPhoto.photoUrl,
    };
    stories = [userStory, ...mockStories];
  }

  const handleStoryClick = (clickedIndex) => {
    const myStoryPayload = stories?.[clickedIndex];
    const othersPayload = stories?.filter((_, index) => index !== clickedIndex);
    navigate("/stories", {
      state: { payload: myStoryPayload, others: othersPayload },
    });
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100dvh",
        background: "black",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ✅ [수정됨] 헤더에 버튼을 포함하고 flexbox로 정렬 */}
      <header
        style={{
          padding: "12px 14px",
          paddingTop: 56, // 상단 상태바 영역 확보
          boxSizing: "border-box",
          zIndex: 10,
          flexShrink: 0,
          display: "flex", // flexbox 사용
          justifyContent: "space-between", // 양쪽 끝으로 정렬
          alignItems: "center", // 세로 중앙 정렬
        }}
      >
        <div
          style={{
            color: "white",
            fontSize: 24,
            fontFamily: "Pretendard",
            fontWeight: "700",
          }}
        >
          도두봉
        </div>

        {/* ✅ [이동됨] Run! 버튼 */}
        <button
          onClick={() => navigate("/run")}
          style={{
            backgroundColor: "#FF8C42",
            color: "white",
            fontSize: 16, // 헤더에 맞게 폰트 크기 조정
            fontWeight: 700,
            padding: "10px 20px", // 헤더에 맞게 패딩 조정
            borderRadius: 999,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          🏃‍♂️ Run!
        </button>
      </header>

      <main
        style={{
          flex: 1,
          padding: "12px 14px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 118px)",
          gridAutoRows: "157px",
          gap: "2px",
          justifyContent: "center",
          overflowY: "auto",
          paddingBottom: "40px",
        }}
      >
        {stories.map((story, index) => (
          <StoryItem
            key={story.id}
            story={story}
            onClick={() => handleStoryClick(index)}
          />
        ))}
      </main>

      {/* ✅ [삭제됨] 기존 footer는 제거 */}
    </div>
  );
}
