import React from "react";

const RunningState = ({
  elapsedTime,
  distance,
  calories,
  pace,
  isPaused,
  onStopClick,
  togglePause,
}) => {
  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (timeInSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatPace = (paceInMinutes) => {
    if (paceInMinutes === 0 || !isFinite(paceInMinutes)) {
      return "0'00''";
    }
    const minutes = Math.floor(paceInMinutes);
    const seconds = Math.round((paceInMinutes - minutes) * 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}'${seconds}''`;
  };

  return (
    <div style={{ width: "100%", position: "relative", paddingTop: 30 }}>
      {/* 버튼들은 오른쪽 상단에 절대 위치로 고정됩니다. */}
      <div
        onClick={togglePause}
        style={{
          width: 60,
          height: 60,
          right: 80,
          top: 0,
          position: "absolute",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            left: 0,
            top: 0,
            position: "absolute",
            background: "var(--main, #FF8C42)",
            borderRadius: 18,
          }}
        />
        <div
          style={{
            width: 3.75,
            height: 24,
            left: 35.25,
            top: 18,
            position: "absolute",
            background: "#FCFCFC",
            borderRadius: 4.5,
            display: isPaused ? "none" : "block",
          }}
        />
        <div
          style={{
            width: 3.75,
            height: 24,
            left: 21,
            top: 18,
            position: "absolute",
            background: "#FCFCFC",
            borderRadius: 4.5,
            display: isPaused ? "none" : "block",
          }}
        />
        {isPaused && (
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "12px solid transparent",
              borderBottom: "12px solid transparent",
              borderLeft: "20px solid #FCFCFC",
              position: "absolute",
              left: 22,
              top: 18,
            }}
          />
        )}
      </div>
      <div
        onClick={onStopClick}
        style={{
          width: 60,
          height: 60,
          right: 10,
          top: 0,
          position: "absolute",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            left: 0,
            top: 0,
            position: "absolute",
            background: "#1E1E22",
            borderRadius: 18,
          }}
        />
        <div
          style={{
            width: 24,
            height: 24,
            left: 18,
            top: 18,
            position: "absolute",
            background: "#FCFCFC",
            borderRadius: 4.5,
          }}
        />
      </div>

      {/* 카드는 일반적인 흐름에 따라 배치됩니다. */}
      <div
        style={{
          padding: "21px 14px",
          background: "white",
          boxShadow: "0px 4px 28px rgba(46, 49, 118, 0.10)",
          borderRadius: 16,
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: 8,
          display: "flex",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            gap: 2,
            display: "flex",
          }}
        >
          <div
            style={{
              alignSelf: "stretch",
              opacity: 0.7,
              color: "#3A3A3C",
              fontSize: 16,
              fontFamily: "Pretendard",
              fontWeight: "500",
              wordWrap: "break-word",
            }}
          >
            달린 시간
          </div>
          <div
            style={{
              alignSelf: "stretch",
              color: "#3A3A3C",
              fontSize: 36,
              fontFamily: "Inter",
              fontWeight: "600",
              letterSpacing: 0.36,
              wordWrap: "break-word",
            }}
          >
            {formatTime(elapsedTime)}
          </div>
        </div>
        <div
          style={{
            padding: "8px 12px",
            background: "#FFF4EC",
            borderRadius: 8,
            justifyContent: "space-around",
            alignItems: "center",
            gap: 8,
            display: "flex",
            width: "100%",
          }}
        >
          <div
            style={{
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
              display: "flex",
            }}
          >
            <div
              style={{
                fontSize: "clamp(18px, 4vw, 20px)",
                fontFamily: "Pretendard",
                fontWeight: "600",
              }}
            >
              🏃
            </div>
            <div
              style={{
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-end",
                display: "inline-flex",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(16px, 4vw, 22px)",
                  fontWeight: "600",
                  color: "#3A3A3C",
                  fontFamily: "Pretendard",
                }}
              >
                {distance.toFixed(1)}
              </div>
              <div
                style={{
                  opacity: 0.7,
                  fontSize: 11,
                  color: "#3A3A3C",
                  fontFamily: "Pretendard",
                }}
              >
                km
              </div>
            </div>
          </div>
          <div
            style={{
              width: 1,
              height: 44,
              opacity: 0.1,
              background: "#333333",
            }}
          />
          <div
            style={{
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: "clamp(18px, 4vw, 22px)",
                fontWeight: "600",
                fontFamily: "Pretendard",
              }}
            >
              🔥
            </div>
            <div
              style={{
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-end",
                display: "inline-flex",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(16px, 4vw, 22px)",
                  fontWeight: "600",
                  color: "#3A3A3C",
                  fontFamily: "Pretendard",
                }}
              >
                {Math.round(calories)}
              </div>
              <div
                style={{
                  opacity: 0.7,
                  fontSize: 11,
                  color: "#3A3A3C",
                  fontFamily: "Pretendard",
                }}
              >
                kcal
              </div>
            </div>
          </div>
          <div
            style={{
              width: 1,
              height: 44,
              opacity: 0.1,
              background: "#333333",
            }}
          />
          <div
            style={{
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              display: "flex",
            }}
          >
            <div
              style={{
                fontSize: "clamp(18px, 4vw, 22px)",
                fontWeight: "600",
                fontFamily: "Pretendard",
              }}
            >
              ⚡️
            </div>
            <div
              style={{
                flexDirection: "column",
                justifyContent: "flex-start",
                alignItems: "flex-end",
                display: "inline-flex",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(16px, 4vw, 22px)",
                  fontWeight: "600",
                  color: "#3A3A3C",
                  fontFamily: "Pretendard",
                }}
              >
                {formatPace(pace)}
              </div>
              <div
                style={{
                  opacity: 0.7,
                  fontSize: 11,
                  color: "#3A3A3C",
                  fontFamily: "Pretendard",
                }}
              >
                pace
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunningState;
