import React, { useEffect, useRef, useState } from "react";

export default function CameraCaptureMobile({
  nickname = "러너닉네임",
  locationName = "함덕해수욕장",
  initialFacing = "environment",
  onComplete,
  onNext,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState(initialFacing);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [error, setError] = useState("");

  // camera → preview → typing → typed → sent
  const [step, setStep] = useState("camera");
  const [message, setMessage] = useState("");
  const CHAR_LIMIT = 48;

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

  const attachStream = async (s) => {
    setStream(s);
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = s;
    v.setAttribute("playsinline", "true");
    v.muted = true;
    await v.play();
  };

  const startCamera = async (mode = facingMode) => {
    setError("");
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
      setError("카메라를 시작할 수 없어요. 권한/브라우저 지원을 확인하세요.");
    }
  };

  const switchCamera = async () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    await startCamera(next);
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
    if (!photoBlob) return;
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
    setStep("sent");
    onComplete?.(payload);
  };

  const handleNext = () => {
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

  // ===== Styles (반응형) =====
  const root = {
    position: "fixed",
    inset: 0,
    width: "100vw",
    height: "100dvh", // 모바일 주소창 수축/확장 대응
    background: "black",
    overflow: "hidden",
  };
  const statusBar = {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: 44,
    background: "black",
    color: "white",
    display: "flex",
    alignItems: "center",
    padding: "12px 18px",
    boxSizing: "border-box",
    fontWeight: 600,
    zIndex: 5,
  };
  const homeIndicator = {
    position: "absolute",
    bottom: 8,
    left: "50%",
    transform: "translateX(-50%)",
    width: 129,
    height: 4.5,
    background: "white",
    borderRadius: 90,
  };

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

  const viewportWrap = {
    position: "absolute",
    left: 0,
    right: 0,
    top: 57,
    bottom: 120, // 하단 버튼 영역 확보
    overflow: "hidden",
    borderRadius: 40,
    background: "#000",
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
  const shutterRing = {
    position: "absolute",
    bottom: 28,
    left: "50%",
    transform: "translateX(-50%)",
    width: 82,
    height: 82,
    borderRadius: 999,
    border: "5px solid #FF8C42",
    background: "white",
    cursor: "pointer",
  };
  const orangeFab = {
    position: "absolute",
    bottom: 28,
    left: "50%",
    transform: "translateX(-50%)",
    width: 82,
    height: 82,
    background: "#FF8C42",
    borderRadius: 999,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
  };
  const bubble = {
    padding: "10px 12px",
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    bottom: 120,
    background: "rgba(255,255,255,0.85)",
    boxShadow: "0px 1px 4px rgba(12,12,13,0.05)",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.06)",
    color: "black",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
  };

  return (
    <div style={root}>
      <div style={statusBar}>
        {pinIcon}
        <div style={{ color: "white", fontSize: 24, fontWeight: 700 }}>
          {locationName}
        </div>
      </div>

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

        <div style={topControls}>
          <div style={roundIcon} title="플래시">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"
                stroke="white"
                strokeWidth="1.6"
                fill="none"
              />
            </svg>
          </div>
          {step === "camera" ? (
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
          ) : (
            <div
              style={{
                ...roundIcon,
                background: "rgba(255,255,255,0.85)",
                color: "#111",
              }}
              onClick={resetAll}
              title="닫기"
            >
              ✕
            </div>
          )}
        </div>

        {step === "preview" && (
          <button
            onClick={() => setStep("typing")}
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)", // ✅ 오타 수정
              bottom: 120,
              background: "rgba(255,255,255,0.85)",
              color: "#111",
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.06)",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            메시지 추가
          </button>
        )}

        {step === "typing" && (
          <div
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              bottom: 120,
              background: "rgba(255,255,255,0.9)",
              borderRadius: 16,
              padding: 10,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <input
              autoFocus
              type="text"
              placeholder="이 순간을 한 줄로 (최대 48자)"
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, CHAR_LIMIT))}
              onKeyDown={(e) => e.key === "Enter" && setStep("typed")}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 16,
                fontWeight: 700,
                color: "#111",
              }}
            />
            <button
              onClick={() => setStep("typed")}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                color: "#FF8C42",
                cursor: "pointer",
              }}
            >
              완료
            </button>
          </div>
        )}

        {step === "typed" && !!message && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              bottom: 120,
              padding: "10px 14px",
              background: "rgba(255,255,255,0.30)",
              borderRadius: 20,
              backdropFilter: "blur(2px)",
              color: "black",
              fontSize: 15,
              fontWeight: 700,
              whiteSpace: "nowrap",
              maxWidth: 320,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={message}
          >
            {message}
          </div>
        )}

        {step === "sent" && (
          <div style={bubble}>
            업로드 완료! <br />
            오른쪽으로 넘겨 다른 러너의 스토리를 확인해 보세요.
          </div>
        )}
      </div>

      {/* 하단 중앙 버튼 */}
      {step === "camera" ? (
        <div style={shutterRing} onClick={capturePhoto} title="사진 찍기" />
      ) : step === "sent" ? (
        <div style={orangeFab} onClick={handleNext} title="다음">
          <span
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: 1,
            }}
          >
            다음
          </span>
        </div>
      ) : (
        <div style={orangeFab} onClick={handleSend} title="사진 보내기">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 11l18-8-8 18-2-7-8-3z"
              stroke="white"
              strokeWidth="1.8"
              fill="none"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      <div style={homeIndicator} />

      {error && (
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 8,
            color: "#fca5a5",
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
