// src/pages/StoryFeedPage.jsx

import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// 더미 데이터 (5개)
const mockStories = [
  {
    id: 1,
    type: "spot_discovery",
    imageSrc:
      "https://images.pexels.com/photos/33425330/pexels-photo-33425330.jpeg",
    author: "JejuExplorer",
    avatar: "https://placehold.co/30x30/E8A978/FFFFFF?text=J",
    timeAgo: "1시간 전",
    photo:
      "https://images.pexels.com/photos/33425330/pexels-photo-33425330.jpeg",
    caption: "여기 사진 정말 잘 나와요!",
  },
  {
    id: 2,
    type: "timer_story",
    imageSrc:
      "https://images.pexels.com/photos/9638704/pexels-photo-9638704.jpeg",
    author: "열정러너",
    avatar: "https://placehold.co/30x30/A5A5A5/FFFFFF?text=R",
    timeAgo: "3시간 전",
    photo: "https://images.pexels.com/photos/9638704/pexels-photo-9638704.jpeg",
    caption: "오늘의 기록",
  },
  {
    id: 3,
    type: "plain",
    imageSrc:
      "https://cdn.pixabay.com/photo/2014/09/18/17/29/sea-451168_1280.jpg",
    author: "바다사랑",
    avatar: "https://placehold.co/30x30/3498db/FFFFFF?text=S",
    timeAgo: "5시간 전",
    photo: "https://cdn.pixabay.com/photo/2014/09/18/17/29/sea-451168_1280.jpg",
    caption: "해변 러닝은 진리",
  },
  {
    id: 4,
    type: "plain",
    imageSrc:
      "https://cdn.pixabay.com/photo/2019/05/27/10/06/silver-grass-4232359_1280.jpg",
    author: "산들바람",
    avatar: "https://placehold.co/30x30/2ecc71/FFFFFF?text=B",
    timeAgo: "어제",
    photo:
      "https://cdn.pixabay.com/photo/2019/05/27/10/06/silver-grass-4232359_1280.jpg",
    caption: "오름 정상에서",
  },
  {
    id: 5,
    type: "plain",
    imageSrc:
      "https://cdn.pixabay.com/photo/2016/02/06/08/53/lighthouse-1182680_1280.jpg",
    author: "돌하르방",
    avatar: "https://placehold.co/30x30/95a5a6/FFFFFF?text=D",
    timeAgo: "어제",
    photo:
      "https://cdn.pixabay.com/photo/2016/02/06/08/53/lighthouse-1182680_1280.jpg",
    caption: "제주 시내 야경",
  },
];

// ✅ StoryItem 컴포넌트 구조 수정
const StoryItem = ({ story, onClick }) => {
  const itemStyle = {
    width: "100%",
    aspectRatio: "118 / 210",
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
    background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)",
  };

  return (
    <div style={itemStyle} onClick={onClick}>
      <div style={overlayStyle}>
        <div
          style={{ fontWeight: 700, textShadow: "0 1px 2px rgba(0,0,0,0.7)" }}
        >
          {story.author}
        </div>
        <div
          style={{
            fontSize: 12,
            opacity: 0.9,
            textShadow: "0 1px 2px rgba(0,0,0,0.7)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {story.caption}
        </div>
      </div>
    </div>
  );
};

// 메인 페이지 컴포넌트
export default function StoryFeedPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const capturedPhoto = location.state?.capturedPhoto;

  let stories = mockStories;
  if (capturedPhoto) {
    const userStory = {
      id: "user-photo-0",
      type: "user_photo",
      imageSrc: capturedPhoto.photoUrl,
      author: capturedPhoto.author,
      caption: capturedPhoto.caption,
      avatar: "https://placehold.co/30x30/FF8C42/white?text=ME",
      timeAgo: "방금",
      photo: capturedPhoto.photoUrl,
    };
    stories = [userStory, ...mockStories];
  }

  const handleStoryClick = (clickedIndex) => {
    const myStoryPayload = stories[clickedIndex];
    const othersPayload = stories.filter((_, index) => index !== clickedIndex);
    navigate("/stories", {
      state: { payload: myStoryPayload, others: othersPayload },
    });
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100dvh",
        background: "black",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          padding: "12px 14px",
          paddingTop: 56,
          boxSizing: "border-box",
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              color: "white",
              fontSize: 24,
              fontFamily: "Pretendard",
              fontWeight: "700",
            }}
          >
            함덕해수욕장
          </div>
        </div>
      </header>

      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: "12px 14px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          overflowY: "auto",
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

      <div
        style={{
          width: "100%",
          height: 44,
          background: "black",
          color: "white",
          display: "flex",
          alignItems: "center",
          padding: "12px 18px",
          boxSizing: "border-box",
          fontWeight: 600,
          position: "absolute",
          top: 0,
          zIndex: 20,
        }}
      >
        9:41
      </div>
    </div>
  );
}
