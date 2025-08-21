// src/MapPage.jsx
import React, { useEffect, useRef, useState } from "react";
import "./MapPage.css";

// 네이버 지도 JS 로더용 공개 키 (ncpKeyId 또는 ncpClientId)
const NAVER_KEY = import.meta.env.VITE_NAVER_CLIENT_ID;

// 예시: 광화문 → 청계천
const ORIGIN = { lat: 33.333918, lng: 126.256099 };
const DEST = { lat: 33.346847, lng: 126.249495 };

/** 네이버 지도 스크립트 동적 로더 */
function loadNaverMaps(clientId) {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.naver?.maps) {
      resolve(window.naver);
      return;
    }
    const id = "naver-maps-script";
    const existing = document.getElementById(id);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.naver), {
        once: true,
      });
      existing.addEventListener("error", (e) => reject(e), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(window.naver);
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

/** 종료 확인 모달 */
const StopConfirmModal = ({ onConfirm, onCancel }) => (
  <div className="modal-overlay" role="dialog" aria-modal="true">
    <div className="modal-content">
      <p className="modal-title">
        달리기를 <span className="highlight">종료</span>하시겠습니까?
      </p>
      <div className="modal-actions">
        <button className="modal-btn cancel" onClick={onCancel}>
          계속 달릴래요
        </button>
        <button className="modal-btn confirm" onClick={onConfirm}>
          그만 달릴래요
        </button>
      </div>
    </div>
  </div>
);

export default function MapPage() {
  const [workoutData] = useState({
    time: "00:01:08",
    distance: "0.07",
    pace: "00:00:08",
    calories: 4,
  });
  const [mapErr, setMapErr] = useState("");
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routeLineRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        if (!NAVER_KEY) {
          setMapErr("NAVER_CLIENT_ID(.env)이 없습니다.");
          return;
        }
        const naver = await loadNaverMaps(NAVER_KEY);
        if (cancelled) return;

        const originLL = new naver.maps.LatLng(ORIGIN.lat, ORIGIN.lng);
        const destLL = new naver.maps.LatLng(DEST.lat, DEST.lng);

        const map = new naver.maps.Map(mapContainerRef.current, {
          center: originLL,
          zoom: 15,
          mapDataControl: false,
        });
        mapRef.current = map;

        new naver.maps.Marker({ position: originLL, map, title: "출발" });
        new naver.maps.Marker({ position: destLL, map, title: "도착" });

        // 🔌 티맵 보행자 경로 요청(서버 프록시)
        const pathLngLat = await fetchTmapPedestrian({
          startLng: ORIGIN.lng,
          startLat: ORIGIN.lat,
          goalLng: DEST.lng,
          goalLat: DEST.lat,
        });

        if (cancelled) return;

        if (Array.isArray(pathLngLat) && pathLngLat.length > 1) {
          const latlngs = pathLngLat.map(
            ([lng, lat]) => new naver.maps.LatLng(lat, lng)
          );
          // 기존 라인 제거
          if (routeLineRef.current) routeLineRef.current.setMap(null);

          routeLineRef.current = new naver.maps.Polyline({
            path: latlngs,
            strokeColor: "#0064FF",
            strokeOpacity: 0.9,
            strokeWeight: 7,
            map,
          });

          // 화면 맞추기
          const bounds = latlngs.reduce(
            (b, ll) => (b.extend(ll), b),
            new naver.maps.LatLngBounds(latlngs[0], latlngs[0])
          );
          map.fitBounds(bounds);
        } else {
          // 폴백: 직선
          new naver.maps.Polyline({
            path: [originLL, destLL],
            strokeColor: "#999",
            strokeOpacity: 0.7,
            strokeWeight: 6,
            map,
          });
          setMapErr("보행자 경로를 불러오지 못해 직선을 표시했어요.");
        }
      } catch (e) {
        console.error(e);
        setMapErr(`지도 초기화 실패: ${e.message || e}`);
      }
    };

    init();
    return () => {
      cancelled = true;
      if (routeLineRef.current) {
        routeLineRef.current.setMap(null);
        routeLineRef.current = null;
      }
      mapRef.current = null;
    };
  }, []);

  async function fetchTmapPedestrian({ startLng, startLat, goalLng, goalLat }) {
    try {
      const qs = new URLSearchParams({
        startLng: String(startLng),
        startLat: String(startLat),
        goalLng: String(goalLng),
        goalLat: String(goalLat),
        searchOption: "0",
      });
      // 서버를 따로 돌린다면 절대경로로 호출해도 됩니다: http://localhost:4000/api/tmap/pedestrian
      const r = await fetch(
        `http://localhost:4000/api/tmap/pedestrian?${qs.toString()}`
      );
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (!data?.ok || !Array.isArray(data?.path)) return null;
      return data.path; // [[lng,lat], ...]
    } catch (e) {
      console.error(e);
      setMapErr("티맵 보행자 경로 요청 실패");
      return null;
    }
  }

  // --- 버튼 핸들러 ---
  const goMyLocation = () => {
    setMapErr("");
    if (!mapRef.current || !window.naver?.maps) {
      setMapErr("지도가 아직 준비되지 않았어요.");
      return;
    }
    if (!navigator.geolocation) {
      setMapErr("이 브라우저는 위치 정보를 지원하지 않습니다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = new window.naver.maps.LatLng(
          p.coords.latitude,
          p.coords.longitude
        );
        mapRef.current.panTo(pos);
        mapRef.current.setZoom(16);
        console.log(p.coords.latitude, p.coords.longitude);
      },
      (e) => setMapErr(e.message || "내 위치를 가져오지 못했어요."),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="screen">
      <div ref={mapContainerRef} className="map-container" />

      <div className="stats-panel">
        {mapErr && <p className="error-message">{mapErr}</p>}

        <div className="stats-grid">
          <div className="stat-row">
            <div className="stat-item">
              <div className="stat-label">시간</div>
              <div className="stat-value">{workoutData.time}</div>
            </div>
            <div className="divider vertical" />
            <div className="stat-item">
              <div className="stat-label">거리(km)</div>
              <div className="stat-value">{workoutData.distance}</div>
            </div>
          </div>
          <div className="divider horizontal" />
          <div className="stat-row">
            <div className="stat-item">
              <div className="stat-label">페이스</div>
              <div className="stat-value">{workoutData.pace}</div>
            </div>
            <div className="divider vertical" />
            <div className="stat-item">
              <div className="stat-label">칼로리</div>
              <div className="stat-value">{workoutData.calories}</div>
            </div>
          </div>
        </div>

        <div className="controls">
          <button className="btn btn-location" onClick={goMyLocation}>
            📍 내 위치
          </button>
          <button
            className="btn btn-stop"
            onClick={() => setIsStopModalOpen(true)}
          >
            종료
          </button>
          <button className="btn btn-pause">멈추기</button>
        </div>
      </div>

      {isStopModalOpen && (
        <StopConfirmModal
          onConfirm={() => setIsStopModalOpen(false)}
          onCancel={() => setIsStopModalOpen(false)}
        />
      )}
    </div>
  );
}

//=================================================================================

// import { useEffect, useMemo, useRef, useState } from "react";

// const load_map = "17";

// // 네이버 지도 SDK 로더 (ncpClientId 사용)
// function loadNaverMaps(clientId) {
//   const existed = document.querySelector("script[data-naver-maps]");
//   if (existed) {
//     return window.naver?.maps
//       ? Promise.resolve(window.naver.maps)
//       : new Promise((res) =>
//           existed.addEventListener("load", () => res(window.naver.maps))
//         );
//   }
//   const s = document.createElement("script");
//   s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
//   s.async = true;
//   s.defer = true;
//   s.dataset.naverMaps = "true";
//   return new Promise((resolve, reject) => {
//     s.onload = () => resolve(window.naver.maps);
//     s.onerror = reject;
//     document.head.appendChild(s);
//   });
// }

// // 도우미들
// const toLatLngs = (nmaps, coords) =>
//   coords.map(([lng, lat]) => new nmaps.LatLng(lat, lng));
// const hslToHex = (h, s, l) => {
//   s /= 100;
//   l /= 100;
//   const k = (n) => (n + h / 30) % 12;
//   const a = s * Math.min(l, 1 - l);
//   const f = (n) =>
//     l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
//   const toHex = (x) =>
//     Math.round(255 * x)
//       .toString(16)
//       .padStart(2, "0");
//   return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
// };
// const colorForIndex = (idx, total) =>
//   total <= 1
//     ? "#377eb8"
//     : hslToHex(Math.round((idx / (total - 1)) * 300), 85, 50);

// const svgPin = (color = "#e41a1c") =>
//   "data:image/svg+xml;charset=UTF-8," +
//   encodeURIComponent(
//     `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 24 34">
//   <path d="M12 34s10-11.3 10-19A10 10 0 1 0 2 15c0 7.7 10 19 10 19z" fill="${color}" stroke="white" stroke-width="1.2"/>
//   <circle cx="12" cy="14" r="3.5" fill="white"/>
// </svg>`
//   );

// const svgGuide = (color = "#333") =>
//   "data:image/svg+xml;charset=UTF-8," +
//   encodeURIComponent(
//     `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 24 34">
//   <path d="M12 34s10-11.3 10-19A10 10 0 1 0 2 15c0 7.7 10 19 10 19z" fill="${color}" stroke="white" stroke-width="1.2"/>
//   <rect x="9" y="11" width="6" height="6" rx="1" ry="1" fill="white"/>
// </svg>`
//   );

// // 번들 → GeoJSON 변환 (프론트에서 직접)
// function bundleToGeoJSON(bundle) {
//   const features = [];

//   // 라인(세그먼트 묶음)
//   if (Array.isArray(bundle?.lines) && bundle.lines.length > 0) {
//     features.push({
//       type: "Feature",
//       geometry: { type: "MultiLineString", coordinates: bundle.lines },
//       properties: { kind: "course_lines", course: bundle.course },
//     });
//   }

//   // 스팟 포인트
//   for (const s of bundle?.spots ?? []) {
//     if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) continue;
//     features.push({
//       type: "Feature",
//       geometry: { type: "Point", coordinates: [s.lng, s.lat] },
//       properties: { kind: "spot", name: s.name, course: bundle.course },
//     });
//   }

//   // 안내 포인트
//   for (const g of bundle?.guide_points ?? []) {
//     if (!Number.isFinite(g.lat) || !Number.isFinite(g.lng)) continue;
//     features.push({
//       type: "Feature",
//       geometry: { type: "Point", coordinates: [g.lng, g.lat] },
//       properties: {
//         kind: "guide_point",
//         name: g.name,
//         role: g.role,
//         order: g.order,
//         course: bundle.course,
//       },
//     });
//   }

//   return { type: "FeatureCollection", features };
// }

// export default function MapPage({ course = load_map }) {
//   const containerRef = useRef(null);
//   const mapRef = useRef(null);
//   const infoRef = useRef(null);

//   const polylinesRef = useRef([]);
//   const markersRef = useRef([]);
//   const labelsRef = useRef([]);

//   const [bundle, setBundle] = useState(null);
//   const [geojson, setGeojson] = useState(null);

//   // 1) index.json -> 원하는 course 파일 찾아서 번들 로드
//   useEffect(() => {
//     const load = async () => {
//       try {
//         // public/data/course_bundles/index.json
//         const idxRes = await fetch(`/data/course_bundles/index.json`);
//         const idx = await idxRes.json();
//         const hit = (idx.courses || []).find(
//           (c) => String(c.course) === String(course)
//         );
//         const file = hit?.file || `course_${course}.json`;
//         const bRes = await fetch(`/data/course_bundles/${file}`);
//         const b = await bRes.json();
//         setBundle(b);
//         setGeojson(bundleToGeoJSON(b));
//       } catch (e) {
//         console.error("bundle load failed", e);
//         setBundle(null);
//         setGeojson(null);
//       }
//     };
//     load();
//   }, [course]);

//   const totalSegments = useMemo(() => {
//     const ms = geojson?.features?.find(
//       (f) => f.properties?.kind === "course_lines"
//     );
//     const cnt = ms?.geometry?.coordinates?.length || 0;
//     const countsSeg = bundle?.counts?.segments || 0;
//     return Math.max(cnt, countsSeg);
//   }, [geojson, bundle]);

//   const legend = useMemo(
//     () =>
//       Array.from({ length: totalSegments }, (_, i) => ({
//         idx: i + 1,
//         color: colorForIndex(i, totalSegments),
//       })),
//     [totalSegments]
//   );

//   // 2) 지도 렌더
//   useEffect(() => {
//     let cancelled = false;
//     (async () => {
//       const nmaps = await loadNaverMaps(import.meta.env.VITE_NAVER_CLIENT_ID);
//       if (cancelled) return;

//       if (!mapRef.current) {
//         mapRef.current = new nmaps.Map(containerRef.current, {
//           center: new nmaps.LatLng(33.38, 126.5),
//           zoom: 11,
//           zoomControl: true,
//           zoomControlOptions: { position: nmaps.Position.TOP_RIGHT },
//         });
//         infoRef.current = new nmaps.InfoWindow({ anchorSkew: true });
//       }

//       const map = mapRef.current;

//       // 기존 오버레이 정리
//       polylinesRef.current.forEach((pl) => pl.setMap(null));
//       markersRef.current.forEach((mk) => mk.setMap(null));
//       labelsRef.current.forEach((lb) => lb.setMap(null));
//       polylinesRef.current = [];
//       markersRef.current = [];
//       labelsRef.current = [];

//       const bounds = new nmaps.LatLngBounds();
//       let hasAny = false;

//       // 라인(세그먼트 순서별 색)
//       const ms = geojson?.features?.find(
//         (f) =>
//           f.geometry?.type === "MultiLineString" &&
//           f.properties?.kind === "course_lines"
//       );
//       if (ms) {
//         const lines = ms.geometry.coordinates || [];
//         lines.forEach((lineCoords, segIdx) => {
//           if (!Array.isArray(lineCoords) || lineCoords.length < 2) return;
//           const path = toLatLngs(nmaps, lineCoords);
//           path.forEach((p) => {
//             bounds.extend(p);
//             hasAny = true;
//           });

//           const color = colorForIndex(segIdx, totalSegments);
//           const segNo = segIdx + 1;

//           const pl = new nmaps.Polyline({
//             map,
//             path,
//             strokeColor: color,
//             strokeOpacity: 0.95,
//             strokeWeight: 6,
//             clickable: true,
//           });

//           const sGP = bundle?.guide_points?.[segIdx] || null;
//           const eGP = bundle?.guide_points?.[segIdx + 1] || null;
//           nmaps.Event.addListener(pl, "click", (e) => {
//             infoRef.current.setContent(
//               `<div style="padding:6px 8px">
//                  <div style="font-weight:700;margin-bottom:4px;">세그먼트 ${segNo}</div>
//                  <div>${sGP?.name ?? `#${segNo - 1}`} → ${
//                 eGP?.name ?? `#${segNo}`
//               }</div>
//                </div>`
//             );
//             infoRef.current.open(map, e.coord);
//           });

//           polylinesRef.current.push(pl);

//           const mid = path[Math.floor(path.length / 2)];
//           const label = new nmaps.Marker({
//             position: mid,
//             map,
//             icon: {
//               content: `<div style="background:${color};color:#fff;font-weight:700;font-size:12px;padding:2px 6px;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.3);transform: translate(-50%, -120%);">${segNo}</div>`,
//               anchor: new nmaps.Point(12, 12),
//             },
//             zIndex: 200,
//           });
//           labelsRef.current.push(label);
//         });
//       }

//       // 포인트(스팟/안내)
//       (geojson?.features || [])
//         .filter((f) => f.geometry?.type === "Point")
//         .forEach((f) => {
//           const [lng, lat] = f.geometry.coordinates || [];
//           if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
//           const isGuide = f.properties?.kind === "guide_point";
//           const name = isGuide
//             ? `[안내] ${f.properties?.name ?? "-"} (${
//                 f.properties?.role ?? "-"
//               })`
//             : f.properties?.name ?? "스팟";
//           const iconUrl = isGuide ? svgGuide("#333") : svgPin("#e41a1c");

//           const marker = new nmaps.Marker({
//             position: new nmaps.LatLng(lat, lng),
//             map,
//             icon: {
//               content: `<img alt="${
//                 f.properties?.kind || "point"
//               }" src="${iconUrl}" style="width:24px;height:34px;transform:translate(-12px,-34px);" />`,
//               size: new nmaps.Size(24, 34),
//               anchor: new nmaps.Point(12, 34),
//             },
//             title: name,
//             zIndex: isGuide ? 110 : 100,
//           });

//           window.naver.maps.Event.addListener(marker, "click", () => {
//             const roleLine = isGuide
//               ? `<div>역할: ${f.properties?.role ?? "-"}</div>`
//               : "";
//             infoRef.current.setContent(
//               `<div style="padding:6px 8px">
//                  <div style="font-weight:600;margin-bottom:4px;">${name}</div>
//                  <div>코스: ${bundle?.course ?? course}</div>
//                  ${roleLine}
//                </div>`
//             );
//             infoRef.current.open(map, marker.getPosition());
//           });

//           markersRef.current.push(marker);
//           bounds.extend(marker.getPosition());
//           hasAny = true;
//         });

//       if (hasAny) {
//         map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
//       }
//     })();

//     return () => {
//       // cleanup
//       polylinesRef.current.forEach((pl) => pl.setMap(null));
//       markersRef.current.forEach((mk) => mk.setMap(null));
//       labelsRef.current.forEach((lb) => lb.setMap(null));
//       polylinesRef.current = [];
//       markersRef.current = [];
//       labelsRef.current = [];
//     };
//   }, [geojson, bundle, course, totalSegments]);

//   return (
//     <div
//       style={{
//         height: "100vh",
//         width: "100%",
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       <div
//         style={{
//           padding: 8,
//           borderBottom: "1px solid #eee",
//           display: "flex",
//           alignItems: "center",
//           gap: 12,
//           flexWrap: "wrap",
//         }}
//       >
//         <div>
//           <strong>코스:</strong> {bundle?.course ?? course} &nbsp;
//           <small>
//             (segments: {bundle?.counts?.segments ?? 0}, spots:{" "}
//             {bundle?.counts?.spots ?? 0}, guides:{" "}
//             {bundle?.counts?.guide_points ?? 0})
//           </small>
//         </div>
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             gap: 6,
//             flexWrap: "wrap",
//           }}
//         >
//           {legend.map(({ idx, color }) => (
//             <div
//               key={idx}
//               style={{ display: "flex", alignItems: "center", gap: 4 }}
//             >
//               <span
//                 style={{
//                   width: 16,
//                   height: 6,
//                   background: color,
//                   borderRadius: 3,
//                   display: "inline-block",
//                 }}
//               />
//               <span style={{ fontSize: 12 }}>{idx}</span>
//             </div>
//           ))}
//         </div>
//       </div>
//       <div ref={containerRef} style={{ flex: 1 }} />
//     </div>
//   );
// }
