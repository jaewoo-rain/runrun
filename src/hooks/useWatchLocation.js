// useWatchLocation.js

// React의 useState, useEffect, useRef 훅을 가져옵니다.
import { useState, useEffect, useRef } from "react";

// `useWatchLocation`은 사용자의 위치를 지속적으로 감시하는 React 커스텀 훅입니다.
// options 객체를 인자로 받아서 Geolocation API의 watchPosition 메소드에 전달합니다.
const useWatchLocation = (options = {}) => {

    // `useState`는 컴포넌트의 상태 값을 관리하기 위한 훅입니다.
    // `location` 상태는 사용자의 현재 위치 정보(위도, 경도)를 저장합니다. 초기값은 undefined입니다.
    const [location, setLocation] = useState();

    // `error` 상태는 위치 정보를 가져오는 과정에서 발생한 에러 메시지를 저장합니다.
    const [error, setError] = useState();

    // `useRef`는 렌더링과 상관없이 값을 유지하고 싶을 때 사용하는 훅입니다.
    // 여기서는 `watchPosition`이 반환하는 ID 값을 저장하여 나중에 감시를 중단할 때 사용합니다.
    // ref 객체의 .current 프로퍼티를 통해 값에 접근하거나 변경할 수 있습니다.
    const locationWatchId = useRef(null);

    // `watchPosition`이 성공적으로 위치 정보를 가져왔을 때 호출될 콜백 함수입니다.
    const handleSuccess = (pos) => {
        // `pos.coords` 객체에서 위도(latitude)와 경도(longitude)를 추출합니다.
        const { latitude, longitude } = pos.coords;

        // `setLocation` 함수를 호출하여 `location` 상태를 새로운 위치 정보로 업데이트합니다.
        // 이 함수가 호출되면 이 훅을 사용하는 컴포넌트가 리렌더링됩니다.
        setLocation({
            latitude,
            longitude,
        });
    };

    // `watchPosition`이 위치 정보를 가져오는 데 실패했을 때 호출될 콜백 함수입니다.
    const handleError = (error) => {
        // `setError` 함수를 호출하여 `error` 상태를 에러 메시지로 업데이트합니다.
        setError(error.message);
    };

    // 위치 정보 감시를 중단하는 함수입니다.
    const cancelLocationWatch = () => {
        // `navigator.geolocation` 객체에 접근합니다.
        const { geolocation } = navigator;

        // `locationWatchId.current`에 저장된 ID가 있고, `geolocation` 객체가 존재하면 감시를 중단합니다.
        if (locationWatchId.current && geolocation) {
            // `clearWatch` 메소드는 `watchPosition`으로 시작된 감시를 중단시킵니다.
            geolocation.clearWatch(locationWatchId.current);
        }
    };

    // `useEffect` 훅은 컴포넌트가 렌더링될 때, 그리고 `options`가 변경될 때마다 특정 코드를 실행합니다.
    useEffect(() => {
        // `navigator.geolocation` 객체에 접근합니다.
        const { geolocation } = navigator;

        // 만약 브라우저가 Geolocation API를 지원하지 않으면, 에러를 설정하고 함수를 종료합니다.
        if (!geolocation) {
            setError("Geolocation is not supported.");
            return;
        }

        // `watchPosition` 메소드를 호출하여 위치 감시를 시작합니다.
        // 이 메소드는 세 개의 인자를 받습니다: 성공 콜백, 실패 콜백, 옵션 객체.
        // 그리고 감시를 중단할 때 사용할 ID를 반환합니다.
        // 이 ID를 `locationWatchId.current`에 저장합니다.
        locationWatchId.current = geolocation.watchPosition(handleSuccess, handleError, options);

        // `useEffect`에서 반환하는 함수는 "cleanup" 함수입니다.
        // 이 함수는 컴포넌트가 언마운트(사라질 때)되거나, `useEffect`가 다시 실행되기 전에 호출됩니다.
        // 여기서는 `cancelLocationWatch` 함수를 반환하여 컴포넌트가 사라질 때 위치 감시가 중단되도록 합니다.
        // 이렇게 하지 않으면 컴포넌트가 사라져도 계속 위치를 감시하게 되어 리소스 낭비가 발생할 수 있습니다.
        return cancelLocationWatch;
        // `useEffect`의 두 번째 인자인 배열(dependency array)에 `options`를 전달합니다.
        // 이렇게 하면 `options`가 변경될 때마다 `useEffect`가 다시 실행되어 새로운 옵션으로 위치 감시를 다시 시작합니다.
    }, [options]);

    // 이 커스텀 훅은 최종적으로 위치 정보, 감시 중단 함수, 에러를 객체 형태로 반환합니다.
    // 이 훅을 사용하는 컴포넌트에서는 이 값들을 받아서 사용할 수 있습니다.
    return { location, cancelLocationWatch, error };
};

export default useWatchLocation;