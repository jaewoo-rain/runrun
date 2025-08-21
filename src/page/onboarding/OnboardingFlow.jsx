// src/OnboardingFlow.jsx
import React, { useMemo, useState } from "react";

import InputInfoPage from "./InputInfoPage";
import GenderSelectPage from "./GenderSelectPage";
import AgeSelectPage from "./AgeSelectPage";
import TravelReasonPage from "./TravelReasonPage";
import RegionSelectPage from "./RegionSelectPage";
import RunningLevelPage from "./RunningLevelPage";
import TravelDistancePage from "./TravelDistancePage";
import FinalizingPage from "./FinalizingPage";

/**
 * 온보딩 스텝
 * 0 닉네임
 * 1 성별
 * 2 나이
 * 3 여행 이유
 * 4 지역 선택
 * 5 러닝 강도
 * 6 달릴 거리(km)
 * 7 로딩 → /recommend
 */
export default function OnboardingFlow() {
  const [step, setStep] = useState(0);

  const [profile, setProfile] = useState({
    nickname: "",
    gender: null, // 'male' | 'female'
    ageGroup: null, // '10대' | '20대' | '30대' | '40대' | '50대 이상'
    travelReason: null, // string
    region: null, // '동부' | '서부' | '남부' | '북부'
    runningLevel: null, // string
    distance: null, // number (km)
  });

  const totalSteps = 8;
  const progress = useMemo(
    () => Math.round(((step + 1) / totalSteps) * 100),
    [step]
  );

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  // next handlers
  const handleFromNickname = (nickname) => {
    setProfile((p) => ({ ...p, nickname }));
    setStep(1);
  };
  const handleFromGender = (gender) => {
    setProfile((p) => ({ ...p, gender }));
    setStep(2);
  };
  const handleFromAge = (ageGroup) => {
    setProfile((p) => ({ ...p, ageGroup }));
    setStep(3);
  };
  const handleFromTravelReason = (travelReason) => {
    setProfile((p) => ({ ...p, travelReason }));
    setStep(4);
  };
  const handleFromRegion = (region) => {
    setProfile((p) => ({ ...p, region }));
    setStep(5);
  };
  const handleFromRunningLevel = (runningLevel) => {
    setProfile((p) => ({ ...p, runningLevel }));
    setStep(6);
  };
  const handleFromDistance = (distanceKm) => {
    setProfile((p) => ({ ...p, distance: distanceKm }));
    setStep(7);
  };

  return (
    <div
      style={{
        position: "relative",
        width: 375,
        height: 812,
        margin: "0 auto",
      }}
    >
      {/* 디버그용 진행률 */}
      <div
        style={{
          position: "fixed",
          left: 8,
          bottom: 8,
          fontSize: 12,
          color: "#888",
          userSelect: "none",
          zIndex: 99,
        }}
      >
        progress: {progress}% (step {step + 1}/{totalSteps})
      </div>

      {step === 0 && (
        <InputInfoPage
          defaultNickname={profile.nickname}
          onNext={handleFromNickname}
        />
      )}

      {step === 1 && (
        <GenderSelectPage
          defaultGender={profile.gender}
          onBack={goBack}
          onNext={handleFromGender}
        />
      )}

      {step === 2 && (
        <AgeSelectPage
          defaultAgeGroup={profile.ageGroup}
          onBack={goBack}
          onNext={handleFromAge}
        />
      )}

      {step === 3 && (
        <TravelReasonPage onBack={goBack} onNext={handleFromTravelReason} />
      )}

      {step === 4 && (
        <RegionSelectPage onBack={goBack} onNext={handleFromRegion} />
      )}

      {step === 5 && (
        <RunningLevelPage
          defaultLevel={profile.runningLevel}
          onBack={goBack}
          onNext={handleFromRunningLevel}
        />
      )}

      {step === 6 && (
        <TravelDistancePage
          defaultDistance={profile.distance ?? 10}
          onBack={goBack}
          onNext={handleFromDistance}
        />
      )}

      {step === 7 && (
        <FinalizingPage
          durationMs={2000}
          recommendPath="/recommend"
          // saveUrl="/api/onboarding/complete"
          // profile={profile}
          // onComplete={(data) => setProfile((p) => ({ ...p, serverData: data }))}
        />
      )}
    </div>
  );
}
