import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function CameraCaptureMobile({
  nickname = "러너닉네임",
  locationName = "도두봉",
  initialFacing = "environment",
  onComplete,
  onNext,
  stories = [],
}) {
  const elapsedTime = useSelector((state) => state.running.elapsedTime);

  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState(initialFacing);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [error, setError] = useState("");

  const [step, setStep] = useState("camera"); // camera, preview, typing, typed, sending
  const [message, setMessage] = useState("");
  const CHAR_LIMIT = 48;

  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isFlashSupported, setIsFlashSupported] = useState(false);

  const handleClose = () => {
    navigate("/run");
  };

  const stopStream = () => {
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
      const v = videoRef.current;
      if (v) {
        v.pause?.();
        v.srcObject = null;
        v.removeAttribute("src");
      }
    } catch {}
  };

  const listVideoInputs = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === "videoinput");
    } catch {
      return [];
    }
  };

  const pickDeviceIdForFacing = async (mode) => {
    const videos = await listVideoInputs();
    if (!videos.length) return null;
    const wantFront = mode === "user";
    const match = (label = "") => {
      const l = label.toLowerCase();
      return wantFront
        ? l.includes("front") || l.includes("user")
        : l.includes("back") || l.includes("rear") || l.includes("environment");
    };
    const byLabel = videos.find((d) => match(d.label));
    if (byLabel) return byLabel.deviceId;
    return wantFront ? videos[videos.length - 1].deviceId : videos[0].deviceId;
  };

  const checkFlashSupport = (stream) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack && "getCapabilities" in videoTrack) {
      const capabilities = videoTrack.getCapabilities();
      if (capabilities.torch) {
        setIsFlashSupported(true);
        return;
      }
    }
    setIsFlashSupported(false);
    setIsFlashOn(false);
  };

  const attachStream = async (s) => {
    setStream(s);
    checkFlashSupport(s);
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = s;
    v.setAttribute("playsinline", "true");
    v.muted = true;
    await v.play();
  };

  const startCamera = async (mode = facingMode) => {
    setError("");
    setIsFlashSupported(false);
    try {
      stopStream();
      // 1) exact
      try {
        const s1 = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { exact: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        await attachStream(s1);
        return;
      } catch {}
      // 2) loose
      try {
        const s2 = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: mode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        await attachStream(s2);
        return;
      } catch {}
      // 3) deviceId fallback
      const deviceId = await pickDeviceIdForFacing(mode);
      if (deviceId) {
        const s3 = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            deviceId: { exact: deviceId },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        await attachStream(s3);
        return;
      }
      throw new Error("적합한 카메라를 찾을 수 없습니다.");
    } catch (e) {
      console.error(e);
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setError("카메라 권한이 필요해요. 브라우저 설정에서 허용해주세요.");
      } else {
        setError("카메라를 시작할 수 없어요. 권한/브라우저 지원을 확인하세요.");
      }
    }
  };

  const switchCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    await startCamera(next);
  };

  const toggleFlash = async () => {
    if (!stream || !isFlashSupported) return;
    const videoTrack = stream.getVideoTracks()[0];
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: !isFlashOn }],
      });
      setIsFlashOn(!isFlashOn);
    } catch (e) {
      console.error("플래시를 제어할 수 없습니다.", e);
    }
  };

  const capturePhoto = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    const w = v.videoWidth || 1280;
    const h = v.videoHeight || 720;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0, w, h);
    c.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        if (photoUrl) URL.revokeObjectURL(photoUrl);
        setPhotoBlob(blob);
        setPhotoUrl(url);
        setStep("preview");
      },
      "image/jpeg",
      0.92
    );
  };

  const handleSend = async () => {
    if (!photoBlob || step === "sending") return;
    setStep("sending");
    const payload = {
      author: nickname,
      timeAgo: "방금",
      photoBlob,
      photoUrl,
      caption: message,
      facingMode,
      createdAt: new Date().toISOString(),
      locationName,
    };
    await onComplete?.(payload);
    onNext?.(payload);
  };

  const resetAll = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPhotoBlob(null);
    setMessage("");
    setStep("camera");
    startCamera();
  };

  useEffect(() => {
    if (!("mediaDevices" in navigator)) {
      setError("브라우저가 카메라 API를 지원하지 않아요.");
      return;
    }
    startCamera();
    return () => {
      stopStream();
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPreviewing = step !== "camera";

  // ===== Styles =====
  const root = {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100dvh",
    background: "black",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const header = {
    display: "flex",
    justifyContent: isPreviewing ? "center" : "space-between",
    alignItems: "center",
    padding: "12px 15px",
    paddingTop: 56,
    flexShrink: 0,
    color: "white",
    zIndex: 15,
    position: "relative",
  };

  const previewHeaderPill = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(30,30,30,0.85)",
    padding: "8px 16px",
    borderRadius: 999,
    fontSize: 14,
    fontWeight: 600,
  };

  const locationInfo = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 20,
    fontWeight: 700,
  };

  const cameraHeaderRight = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  };

  const viewportWrap = {
    flex: 1,
    margin: "0 10px",
    position: "relative",
    overflow: "hidden",
    borderRadius: 40,
    background: "#333",
  };

  const topControls = {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 3,
  };

  const previewCloseButton = {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 999,
    background: "rgba(0,0,0,0.5)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    userSelect: "none",
    zIndex: 10,
    color: "white",
    fontSize: 20,
    lineHeight: "40px",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.1)",
  };

  const roundIcon = {
    width: 40,
    height: 40,
    borderRadius: 999,
    background: "rgba(0,0,0,0.6)",
    border: "1px solid rgba(255,255,255,0.25)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    userSelect: "none",
  };

  const shutterContainer = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: 100,
    flexShrink: 0,
    zIndex: 10,
    marginTop: -50,
  };

  const shutterRing = {
    width: 82,
    height: 82,
    borderRadius: 999,
    border: "5px solid #FF8C42",
    background: "white",
    cursor: "pointer",
    boxSizing: "content-box",
  };

  const orangeFab = {
    width: 82,
    height: 82,
    background: "#FF8C42",
    borderRadius: 999,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    boxSizing: "content-box",
  };

  const feedFooter = {
    flexShrink: 0,
    padding: "10px 16px 20px",
    color: "white",
    textAlign: "center",
    cursor: "pointer",
    zIndex: 5,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  };

  const feedThumbnail = {
    width: 40,
    height: 40,
    borderRadius: 999,
    objectFit: "cover",
    border: "1px solid rgba(255, 255, 255, 0.5)",
  };

  const messageUiContainerBase = {
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 10,
    bottom: 150, // 위치 조정
  };

  const addMessageButton = {
    ...messageUiContainerBase,
    background: "rgba(255,255,255,0.95)",
    color: "#111",
    padding: "10px 18px",
    borderRadius: 12,
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  // ✅ [수정됨] 메시지 말풍선 스타일
  const messageDisplayBubble = {
    ...messageUiContainerBase,
    background: "rgba(255,255,255,0.5)",
    padding: "10px 16px",
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    maxWidth: "80%",
    textAlign: "center",
    wordBreak: "break-word",
    backdropFilter: "blur(5px)", // 블러 효과
  };

  const typingUiContainer = {
    ...messageUiContainerBase,
    width: "calc(100% - 32px)", // 좌우 여백 16px
    background: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 10,
    display: "flex",
    alignItems: "center",
    gap: 10,
    boxSizing: "border-box",
  };

  const typingInput = {
    flex: 1,
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: 16,
    fontWeight: 700,
    color: "#111",
  };

  const typingCompleteButton = {
    background: "transparent",
    border: "none",
    fontSize: 13,
    fontWeight: 700,
    color: "#FF8C42",
    cursor: "pointer",
  };

  // ===== Icons =====
  const pinIcon = (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
      <path
        d="M10 0C4.48 0 0 4.48 0 10C0 15.52 10 24 10 24C10 24 20 15.52 20 10C20 4.48 15.52 0 10 0ZM10 13.5C8.07 13.5 6.5 11.93 6.5 10C6.5 8.07 8.07 6.5 10 6.5C11.93 6.5 13.5 8.07 13.5 10C13.5 11.93 11.93 13.5 10 13.5Z"
        fill="#FF8C42"
      />
    </svg>
  );

  const personIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
        fill="white"
      />
    </svg>
  );

  const firstStoryImage = stories[0]?.imageSrc;

  return (
    <div style={root}>
      {/* ===== HEADER ===== */}
      <header style={header}>
        {isPreviewing ? (
          <div style={previewHeaderPill}>
            {personIcon}
            <span>& {locationName} 러너 32명</span>
          </div>
        ) : (
          <>
            <div style={locationInfo}>
              {pinIcon}
              <span>{locationName}</span>
            </div>
            <div style={cameraHeaderRight} onClick={handleClose}>
              <span>{elapsedTime}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z"
                  fill="white"
                />
              </svg>
            </div>
          </>
        )}
      </header>

      {/* ===== VIEWPORT ===== */}
      <div style={viewportWrap}>
        {step === "camera" ? (
          <video
            ref={videoRef}
            muted
            autoPlay
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          photoUrl && (
            <img
              src={photoUrl}
              alt="preview"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )
        )}

        {step === "camera" && (
          <div style={topControls}>
            <div
              style={{
                ...roundIcon,
                visibility:
                  isFlashSupported && facingMode === "environment"
                    ? "visible"
                    : "hidden",
              }}
              title="플래시"
              onClick={toggleFlash}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
                  stroke="white"
                  strokeWidth="1.6"
                  fill={isFlashOn ? "white" : "none"}
                />
              </svg>
            </div>
            <div style={roundIcon} onClick={switchCamera} title="카메라 전환">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M7 7h7a5 5 0 0 1 5 5v1"
                  stroke="white"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M6 10l1.5-3L11 8.5"
                  stroke="white"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M17 17H10a5 5 0 0 1-5-5v-1"
                  stroke="white"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M18 14l-1.5 3L13 15.5"
                  stroke="white"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        )}

        {isPreviewing && (
          <>
            <div style={previewCloseButton} onClick={resetAll} title="닫기">
              ✕
            </div>

            {step !== "typing" && !message && (
              <button
                onClick={() => setStep("typing")}
                style={addMessageButton}
              >
                메시지 추가
              </button>
            )}

            {step === "typed" && message && (
              <div
                onClick={() => setStep("typing")}
                style={messageDisplayBubble}
                title="메시지 수정"
              >
                {message}
              </div>
            )}
          </>
        )}

        {step === "typing" && (
          <div style={typingUiContainer}>
            <input
              autoFocus
              type="text"
              placeholder={`이 순간을 한 줄로 (최대 ${CHAR_LIMIT}자)`}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, CHAR_LIMIT))}
              onKeyDown={(e) =>
                e.key === "Enter" && setStep(message ? "typed" : "preview")
              }
              style={typingInput}
            />
            <button
              onClick={() => setStep(message ? "typed" : "preview")}
              style={typingCompleteButton}
            >
              완료
            </button>
          </div>
        )}
      </div>

      {/* ===== BOTTOM CONTROLS (Shutter/Send) ===== */}
      <div style={shutterContainer}>
        {step === "camera" ? (
          <div style={shutterRing} onClick={capturePhoto} title="사진 찍기" />
        ) : (
          isPreviewing && (
            <div
              style={{ ...orangeFab, opacity: step === "sending" ? 0.6 : 1 }}
              onClick={handleSend}
              title="사진 보내기"
            >
              {step === "sending" ? (
                <span style={{ color: "white", fontSize: 16, fontWeight: 800 }}>
                  전송 중...
                </span>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 11l18-8-8 18-2-7-8-3z"
                    stroke="white"
                    strokeWidth="1.8"
                    fill="none"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          )
        )}
      </div>

      {/* ===== FOOTER ===== */}
      <footer style={feedFooter} onClick={() => navigate("/story-feed")}>
        {firstStoryImage && (
          <img src={firstStoryImage} alt="feed preview" style={feedThumbnail} />
        )}
        <div style={{ display: "inline-block", lineHeight: 1.2 }}>
          다른 러너들의 기록
          <div style={{ fontSize: 24, marginTop: 4 }}>ˇ</div>
        </div>
      </footer>

      {error && (
        <div
          style={{
            color: "#fca5a5",
            fontSize: 12,
            textAlign: "center",
            padding: "0 12px 8px",
          }}
        >
          {error}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
