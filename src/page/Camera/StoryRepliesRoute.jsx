// src/pages/StoryRepliesRoute.jsx

import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import StoryRepliesPage from "./StoryRepliesPage";

export default function StoryRepliesRoute() {
  const { state } = useLocation();

  // StoryFeedPage에서 보낸 state를 받습니다.
  const myStoryPayload = state?.payload;
  const othersPayload = state?.others;

  // 데이터가 없으면 비정상적인 접근으로 보고 카메라 페이지로 돌려보냅니다.
  if (!myStoryPayload) {
    return <Navigate to="/camera" replace />;
  }

  // StoryRepliesPage가 필요로 하는 props 형태로 데이터를 최종 가공합니다.
  const myStory = {
    author: myStoryPayload.author,
    avatar: myStoryPayload.avatar,
    timeAgo: myStoryPayload.timeAgo,
    photo: myStoryPayload.photo || myStoryPayload.imageSrc,
    caption: myStoryPayload.caption,
  };

  const others = (othersPayload || []).map((story) => ({
    ...story,
    photo: story.photo || story.imageSrc,
  }));

  return (
    <StoryRepliesPage
      locationName={myStoryPayload.locationName || "함덕해수욕장"}
      myStory={myStory}
      others={others}
    />
  );
}
