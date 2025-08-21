import { useState } from 'react';

/**
 * 브라우저 알림을 관리하는 커스텀 훅
 * @returns {{permission: NotificationPermission, requestPermission: (function(): Promise<NotificationPermission>), showNotification: (function(string, object): void)}} - 알림 권한 상태, 권한 요청 함수, 알림 표시 함수
 */
const useNotification = () => {
    // 알림 권한 상태를 저장합니다. ('default', 'granted', 'denied')
    const [permission, setPermission] = useState(Notification.permission);

    /**
     * 사용자에게 알림 권한을 요청하는 함수
     * @returns {Promise<NotificationPermission>} 권한 요청 결과
     */
    const requestPermission = async () => {
        // 브라우저가 Notification API를 지원하는지 확인
        if (!('Notification' in window)) {
            alert('이 브라우저는 데스크톱 알림을 지원하지 않습니다.');
            return 'denied';
        }

        // Notification.requestPermission()은 프로미스를 반환합니다.
        const permissionResult = await Notification.requestPermission();
        setPermission(permissionResult);
        return permissionResult;
    };

    /**
     * 알림을 표시하는 함수
     * @param {string} title - 알림 제목
     * @param {object} options - 알림에 대한 추가 옵션 (body, icon 등)
     */
    const showNotification = (title, options) => {
        // 권한이 'granted'가 아니면 알림을 표시하지 않습니다.
        if (Notification.permission !== 'granted') {
            console.warn('알림 권한이 허용되지 않았습니다.');
            // 사용자에게 권한을 요청할 수도 있습니다.
            // requestPermission();
            return;
        }
        new Notification(title, options);
    };

    return { permission, requestPermission, showNotification };
};

export default useNotification;
