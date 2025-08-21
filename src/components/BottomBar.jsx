import React from "react";
import { useNavigate } from "react-router-dom";

const Icon = ({ name, active }) => {
  const color = active ? "black" : "#626264";
  const iconUrl = `/tab-${name}.png`; // public 폴더 경로 기준

  return (
    <div
      style={{
        width: 24,
        height: 24,
        backgroundColor: color,
        maskImage: `url(${iconUrl})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskImage: `url(${iconUrl})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
      }}
    />
  );
};

const TabItem = ({ name, label, active, onClick }) => {
  const color = active ? "black" : "#626264";
  return (
    <div
      onClick={() => onClick(name)}
      style={{
        flex: "1 1 0",
        height: 56,
        paddingTop: 8,
        paddingBottom: 8,
        overflow: "hidden",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        display: "inline-flex",
        cursor: "pointer",
      }}
    >
      <Icon name={name} active={active} />
      <div
        style={{
          alignSelf: "stretch",
          textAlign: "center",
          color: color,
          fontSize: 11,
          fontFamily: "Pretendard",
          fontWeight: "400",
          lineHeight: "15.40px",
          wordWrap: "break-word",
        }}
      >
        {label}
      </div>
    </div>
  );
};

const BottomBar = ({ activeTab = "running", positioning = "fixed" }) => {
  const navigate = useNavigate();
  const tabs = [
    { id: "feed", label: "피드", path: "/feed" },
    { id: "running", label: "러닝", path: "/recommend" },
    { id: "activity", label: "활동", path: "/activity" },
  ];

  const handleTabClick = (tabId) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && tab.path) {
      navigate(tab.path);
    }
  };

  const containerStyle = {
    background: "white",
    overflow: "hidden",
    borderTop: "0.50px #C4C4C6 solid",
    position: positioning,
    bottom: 0,
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  };

  if (positioning === "fixed") {
    containerStyle.width = 328;
    containerStyle.left = '50%';
    containerStyle.transform = 'translateX(-50%)';
  }

  return (
    <div style={containerStyle}>
      <div
        style={{
          alignSelf: "stretch",
          justifyContent: "center",
          alignItems: "center",
          display: "inline-flex",
        }}
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab.id}
            name={tab.id}
            label={tab.label}
            active={activeTab === tab.id}
            onClick={handleTabClick}
          />
        ))}
      </div>
      <div style={{ alignSelf: "stretch", height: 14, position: "relative" }}>
        <div
          style={{
            width: "100%",
            height: 24,
            left: 0,
            top: -5,
            position: "absolute",
          }}
        >
          <div
            style={{
              width: 128.96,
              height: 4.48,
              left: "50%",
              transform: "translateX(-50%)",
              top: 16.84,
              position: "absolute",
              background: "var(--Labels-Primary, black)",
              borderRadius: 89.55,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BottomBar;
