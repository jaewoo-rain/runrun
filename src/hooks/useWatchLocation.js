// useWatchLocation.js
import { useState, useEffect, useRef } from "react";

const useWatchLocation = (options = {}) => {
  const [location, setLocation] = useState();
  const [error, setError] = useState();
  const locationWatchId = useRef(null);

  const handleSuccess = (pos) => {
    const { latitude, longitude } = pos.coords;
    setLocation({
      latitude,
      longitude,
    });
  };

  const handleError = (error) => {
    setError(error.message);
  };

  const cancelLocationWatch = () => {
    const { geolocation } = navigator;
    if (locationWatchId.current && geolocation) {
      geolocation.clearWatch(locationWatchId.current);
    }
  };

  useEffect(() => {
    const { geolocation } = navigator;
    if (!geolocation) {
      setError("Geolocation is not supported.");
      return;
    }

    // PWA에서 초기 위치 로딩 지연 문제 해결을 위한 옵션 최적화
    const finalOptions = {
      enableHighAccuracy: true, // 정확도 높은 GPS 우선 사용
      timeout: 10000, // 10초 이상 응답 없으면 실패 처리
      maximumAge: 60000, // 1분 내 캐시된 위치 정보 사용 허용
      ...options,
    };

    locationWatchId.current = geolocation.watchPosition(
      handleSuccess,
      handleError,
      finalOptions,
    );

    return cancelLocationWatch;
  }, [JSON.stringify(options)]); // options 객체가 변경될 때만 effect 재실행

  return { location, cancelLocationWatch, error };
};

export default useWatchLocation;
