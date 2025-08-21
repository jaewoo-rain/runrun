import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import StoryViewerPage from "./StoryViewerPage";

export default function StoryRepliesRoute() {
  const { state } = useLocation();

  const myStoryPayload = state?.payload;
  const othersPayload = state?.others;

  if (!myStoryPayload) {
    return <Navigate to="/camera" replace />;
  }

  // ✅ [수정됨] 모든 스토리에 더미 댓글 추가
  const addDummyCommentIfNeeded = (story) => {
    if (!story.comments || story.comments.length === 0) {
      return {
        ...story,
        comments: [
          {
            id: `dummy-${story.id}`,
            author: "열정러너",
            avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
            text: "멋진 사진이네요!",
          },
        ],
      };
    }
    return story;
  };

  const myStory = addDummyCommentIfNeeded({
    ...myStoryPayload,
    photo: myStoryPayload.photo || myStoryPayload.imageSrc,
  });

  const others = (othersPayload || []).map((story) =>
    addDummyCommentIfNeeded({
      ...story,
      photo: story.photo || story.imageSrc,
    })
  );

  return (
    <StoryViewerPage
      locationName={myStoryPayload.locationName || "함덕해수d욕장"}
      myStory={myStory}
      others={others}
    />
  );
}
