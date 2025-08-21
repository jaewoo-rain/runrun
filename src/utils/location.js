/**
 * 두 지점의 위도, 경도 좌표를 기반으로 거리를 킬로미터(km) 단위로 계산합니다.
 * @param {number} lat1 - 첫 번째 지점의 위도
 * @param {number} lon1 - 첫 번째 지점의 경도
 * @param {number} lat2 - 두 번째 지점의 위도
 * @param {number} lon2 - 두 번째 지점의 경도
 * @returns {number} 두 지점 사이의 거리 (km)
 */
export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // 거리 (km)
    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}
