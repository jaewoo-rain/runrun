/**
 * Google Maps 스크립트를 동적으로 로드하는 함수
 * @param {string} apiKey - Google Maps API 키
 * @returns {Promise<google>} - Google Maps 객체
 */
export function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.google?.maps) {
      resolve(window.google);
      return;
    }
    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      const onLoad = () => resolve(window.google);
      existingScript.addEventListener("load", onLoad);
      existingScript.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * 현재 위치에서 경로 배열의 가장 가까운 지점의 인덱스를 찾는 함수
 * @param {google.maps.LatLng} point - 현재 위치
 * @param {google.maps.LatLng[]} path - 전체 경로 배열
 * @param {google} google - Google Maps 객체
 * @returns {number} - 가장 가까운 인덱스
 */
export function nearestIndexOnPath(point, path, google) {
  if (!path || path.length === 0) return 0;
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < path.length; i++) {
    const d = google.maps.geometry.spherical.computeDistanceBetween(
      point,
      path[i]
    );
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}
