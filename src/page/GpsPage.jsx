import { useEffect, useState } from 'react'
import useWatchLocation from "../hooks/useWatchLocation.js";
import { getDistanceFromLatLonInKm } from "../utils/location.js";
import useNotification from "../hooks/useNotification.js";

// geolocation API를 사용할 때 적용할 옵션들입니다.
const geolocationOptions = {
    enableHighAccuracy: true,
    timeout: 1000 * 60 * 1, // 1 min
    maximumAge: 1000 * 3600 * 24, // 24 hour
}

// GpsPage 컴포넌트는 사용자의 현재 GPS 위치를 보여주는 페이지입니다.
const GpsPage = () => {
    // 커스텀 훅 사용
    const { location, cancelLocationWatch, error } = useWatchLocation(geolocationOptions);
    const { permission, requestPermission, showNotification } = useNotification();

    // 목표 위치 좌표
    const targetLocation = {
        latitude: 35.8350848,
        longitude: 127.1169024
    };
    // 알림을 발생시킬 거리 (미터 단위)
    const DISTANCE_THRESHOLD_METERS = 50;

    // 상태 관리
    const [distance, setDistance] = useState(null);
    const [alarmTriggered, setAlarmTriggered] = useState(false);

    // 위치가 변경될 때마다 실행
    useEffect(() => {
        if (!location || alarmTriggered) {
            return;
        }

        const distanceInKm = getDistanceFromLatLonInKm(
            location.latitude,
            location.longitude,
            targetLocation.latitude,
            targetLocation.longitude
        );

        const distanceInMeters = distanceInKm * 1000;
        setDistance(distanceInMeters);

        if (distanceInMeters <= DISTANCE_THRESHOLD_METERS) {
            // alert 대신 브라우저 알림 표시
            showNotification('목표 위치 도착!', {
                body: '지정한 목표 위치에 도착했습니다.',
            });
            setAlarmTriggered(true);
            cancelLocationWatch();
        }
    }, [location, alarmTriggered, cancelLocationWatch, showNotification, targetLocation.latitude, targetLocation.longitude]);

    if (error) {
        return <div>에러: {error}</div>
    }

    return (
        <div>
            <h1>목표 위치 도달 알림</h1>
            {/* 알림 권한 요청 버튼 */}
            {permission !== 'granted' && (
                <button onClick={requestPermission}>
                    알림 권한 허용하기
                </button>
            )}

            {location ? (
                <div>
                    <p>현재 위치:</p>
                    <ul>
                        <li>위도: {location.latitude}</li>
                        <li>경도: {location.longitude}</li>
                    </ul>
                    <p>목표 위치:</p>
                    <ul>
                        <li>위도: {targetLocation.latitude}</li>
                        <li>경도: {targetLocation.longitude}</li>
                    </ul>
                    {distance !== null && (
                        <p>
                            남은 거리: {distance.toFixed(2)} 미터
                        </p>
                    )}
                    {alarmTriggered && <p style={{color: 'green'}}>목표에 도달했습니다!</p>}
                </div>
            ) : (
                <p>위치 정보를 불러오는 중...</p>
            )}
        </div>
    )
}

export default GpsPage;