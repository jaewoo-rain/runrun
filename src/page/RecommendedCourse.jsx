import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./RecommendedCourse.css";
import { getDistanceFromLatLonInKm } from "../utils/location.js";
import AlertStart from "../components/AlertStart.jsx";
import AlertNotStart from "../components/AlertNotStart.jsx";
import BottomBar from "../components/BottomBar.jsx";

/**
 * 필요 .env
 * VITE_NAVER_CLIENT_ID=네이버지도클라이언트ID
 * (선택) VITE_TMAP_PROXY=http://localhost:4000/api/tmap/pedestrian
 */

// ────────────────────────────────────────────────
// 네이버 지도 로더
function loadNaverMaps(clientId) {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.naver?.maps) {
      resolve(window.naver);
      return;
    }
    const id = "naver-maps-script";
    const existing = document.getElementById(id);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.naver), { once: true });
      existing.addEventListener("error", (e) => reject(e), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    const clientParam = `ncpKeyId=${import.meta.env.VITE_NAVER_CLIENT_ID}`;
    s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?${clientParam}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(window.naver);
    s.onerror = (e) => reject(e);
    document.head.appendChild(s);
  });
}

// ────────────────────────────────────────────────
// Tmap 보행자 프록시
const TMAP_PROXY =
    import.meta.env.VITE_TMAP_PROXY ||
    "http://192.168.35.130:4000/api/tmap/pedestrian";

async function fetchTmapPedestrian({
                                     startLng,
                                     startLat,
                                     goalLng,
                                     goalLat,
                                     searchOption = "0",
                                   }) {
  try {
    const qs = new URLSearchParams({
      startLng: String(startLng),
      startLat: String(startLat),
      goalLng: String(goalLng),
      goalLat: String(goalLat),
      searchOption: String(searchOption),
    });
    const r = await fetch(`${TMAP_PROXY}?${qs.toString()}`);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    if (!data?.ok || !Array.isArray(data?.path)) return null;
    return data.path; // [[lng,lat], ...]
  } catch (e) {
    console.error(e);
    return null;
  }
}

// 표시용 계산
const paceMinPerKm = 8;
function estimateTimeStr(km, pace = paceMinPerKm) {
  const minutes = Math.round(km * pace);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ────────────────────────────────────────────────
const LOC_ICON_URL = "/location.png"; // public/location.png
const SPOT_ICON_URL = "/spot.png"; // public/spot.png
const JSON_URL = "/data/course_bundles/course_simul.json";

export default function RecommendedCourse() {
  const navigate = useNavigate();
  const NAVER_KEY = import.meta.env.VITE_NAVER_CLIENT_ID;

  // ── 레이아웃 상수 (앱바는 화면에 없지만, 인디케이터 정렬용 가상 높이)
  const VIRTUAL_APPBAR_H = 56; // 인디케이터가 여기까지 올라오게 제한
  const BOTTOM_BAR_H = 56;     // BottomBar 실제 높이와 동일하게 유지
  const INDICATOR_AREA_H = 24; // 인디케이터 영역 높이 (패딩 포함)

  // 코스 로딩
  const [courses, setCourses] = useState([]);
  const [idx, setIdx] = useState(0);
  const selectedCourse = useMemo(
      () =>
          courses.length
              ? courses[Math.max(0, Math.min(idx, courses.length - 1))]
              : null,
      [courses, idx]
  );

  const [msg, setMsg] = useState("");
  const [alertComponent, setAlertComponent] = useState(null);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const overlaysRef = useRef({ markers: [], polylines: [] });

  const sheetRef = useRef(null);
  const listRef = useRef(null);
  const dragHandleRef = useRef(null);
  const dragState = useRef({
    isDragging: false,
    startY: 0,
    startHeight: 0,
  });

  /**
   * 스냅 포인트 정의
   * - min: 인디케이터 높이 (완전히 내렸을 때 인디케이터가 보이게)
   * - mid: 중간 높이 (초기 상태)
   */
  const SNAP_POINTS = useMemo(() => {
    const vh = window.innerHeight;
    const max = Math.max(200, vh - BOTTOM_BAR_H - VIRTUAL_APPBAR_H);
    const mid = Math.round(max * 0.5);
    return [INDICATOR_AREA_H, mid];
  }, []);

  const handleDragMove = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    e.preventDefault();

    const currentY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - dragState.current.startY;
    const newHeight = dragState.current.startHeight - deltaY;

    const minHeight = SNAP_POINTS[0];
    const maxHeight = SNAP_POINTS[SNAP_POINTS.length - 1];
    const clampedHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));

    if (sheetRef.current) {
      sheetRef.current.style.height = `${clampedHeight}px`;
    }
  }, [SNAP_POINTS]);

  const handleDragEnd = useCallback(() => {
    if (!dragState.current.isDragging) return;
    dragState.current.isDragging = false;

    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchmove", handleDragMove);
    document.removeEventListener("touchend", handleDragEnd);

    const currentHeight = sheetRef.current.offsetHeight;

    const closestSnapPoint = SNAP_POINTS.reduce((prev, curr) =>
        Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight) ? curr : prev
    );

    if (sheetRef.current) {
      sheetRef.current.style.transition = "height 0.25s ease-in-out";
      sheetRef.current.style.height = `${closestSnapPoint}px`;
    }
  }, [SNAP_POINTS, handleDragMove]);

  const handleDragStart = useCallback((e) => {
    if (listRef.current && listRef.current.contains(e.target) && listRef.current.scrollTop > 0) {
      return;
    }
    e.preventDefault();

    dragState.current = {
      isDragging: true,
      startY: e.touches ? e.touches[0].clientY : e.clientY,
      startHeight: sheetRef.current.offsetHeight,
    };

    sheetRef.current.style.transition = "none";

    document.addEventListener("mousemove", handleDragMove, { passive: false });
    document.addEventListener("mouseup", handleDragEnd);
    document.addEventListener("touchmove", handleDragMove, { passive: false });
    document.addEventListener("touchend", handleDragEnd);
  }, [handleDragMove, handleDragEnd]);

  useEffect(() => {
    const element = dragHandleRef.current;
    if (element) {
      const options = { passive: false };
      element.addEventListener("touchstart", handleDragStart, options);
      element.addEventListener("mousedown", handleDragStart);

      return () => {
        element.removeEventListener("touchstart", handleDragStart);
        element.removeEventListener("mousedown", handleDragStart);
      };
    }
  }, [handleDragStart]);

  // 초기 높이: 중간 스냅으로 시작(원하면 0으로 바꿔 지도-only로 시작 가능)
  useEffect(() => {
    if (sheetRef.current) {
      sheetRef.current.style.height = `${SNAP_POINTS[1]}px`; // mid
    }
  }, [SNAP_POINTS]);

  // ── JSON 로딩
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(JSON_URL);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const recommendedCourses = data["specific-course"]?.[0];
        const segments = data.segments;

        if (!recommendedCourses || !segments) {
          throw new Error("Invalid data structure in JSON file.");
        }

        const segmentMap = segments.reduce((acc, segment) => {
          acc[segment.id] = segment;
          return acc;
        }, {});

        const built = Object.values(recommendedCourses)
            .map((course) => {
              const segmentIds = course.path;
              if (!Array.isArray(segmentIds) || segmentIds.length === 0) {
                console.warn(`Course "${course.title}" has no path segments.`);
                return null;
              }

              let fullPath = [];
              let allSpots = [];
              let totalDistanceMeters = 0;
              let totalTimeSeconds = 0;

              for (const segmentId of segmentIds) {
                const segment = segmentMap[segmentId];
                if (segment) {
                  fullPath = fullPath.concat(segment.path);
                  if (Array.isArray(segment.spot)) {
                    allSpots = allSpots.concat(segment.spot);
                  }
                  if (segment.summary?.totalDistance) {
                    totalDistanceMeters += segment.summary.totalDistance;
                  }
                  if (segment.summary?.totalTime) {
                    totalTimeSeconds += segment.summary.totalTime;
                  }
                } else {
                  console.warn(`Segment with id "${segmentId}" not found for course "${course.title}".`);
                }
              }

              if (fullPath.length < 2) {
                console.warn(`Course "${course.title}" has an invalid path after processing segments.`);
                return null;
              }

              const firstCoord = fullPath[0];
              const lastCoord = fullPath[fullPath.length - 1];

              const origin = { name: "출발지", lat: firstCoord[1], lng: firstCoord[0] };
              const dest = { name: "도착지", lat: lastCoord[1], lng: lastCoord[0] };

              const midSpots = allSpots
                  .map((p) => ({ name: p.VISIT_AREA_NM, lat: p.Y_COORD, lng: p.X_COORD }))
                  .slice(0, 2);

              return {
                id: segmentIds.join("_"),
                title: course.title,
                desc1: course.description,
                origin,
                dest,
                spots: midSpots,
                path: fullPath.map(([lng, lat]) => ({ lat, lng })),
                totalDistance: totalDistanceMeters,
                totalTime: totalTimeSeconds,
              };
            })
            .filter(Boolean);

        if (!cancelled) setCourses(built);
      } catch (e) {
        console.error("코스 데이터 로딩 또는 처리 중 오류 발생:", e);
        if (!cancelled) setMsg("코스 데이터를 불러오지 못했어요.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── 지도 초기화
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!NAVER_KEY) {
          setMsg("VITE_NAVER_CLIENT_ID(.env)이 없습니다.");
          return;
        }
        const naver = await loadNaverMaps(NAVER_KEY);
        if (cancelled) return;
        const map = new naver.maps.Map(mapContainerRef.current, {
          center: new naver.maps.LatLng(33.27, 126.67),
          zoom: 13,
          logoControl: true,
          mapDataControl: false,
        });
        mapRef.current = map;
      } catch (e) {
        console.error(e);
        setMsg(`지도 초기화 실패: ${e?.message || e}`);
      }
    })();
    return () => {
      cancelled = true;
      clearOverlays();
      mapRef.current = null;
    };
  }, [NAVER_KEY]);

  // 지도에 코스 그리기 (맵/코스 준비된 뒤)
  useEffect(() => {
    if (!mapRef.current || !selectedCourse) return;
    drawCourse(selectedCourse);
  }, [selectedCourse?.id]);

  // 위치 체크 → 시작
  const handleStartRunning = () => {
    setMsg("");
    if (!selectedCourse?.origin) {
      setMsg("선택된 코스의 시작점을 찾을 수 없어요.");
      return;
    }
    if (!navigator.geolocation) {
      setMsg("이 브라우저는 위치 정보를 지원하지 않습니다.");
      return;
    }
    const start = selectedCourse.origin;
    navigator.geolocation.getCurrentPosition(
        (p) => {
          const d =
              getDistanceFromLatLonInKm(
                  p.coords.latitude,
                  p.coords.longitude,
                  start.lat,
                  start.lng
              ) * 1000;
          if (d >= 100) {
            setAlertComponent(
                <AlertStart
                    onClose={() => setAlertComponent(null)}
                    onStart={() => navigate("/run", { state: { courseId: selectedCourse.id } })}
                />
            );
          } else {
            setAlertComponent(<AlertNotStart onClose={() => setAlertComponent(null)} />);
          }
        },
        (e) => setMsg(e.message || "내 위치를 가져오지 못했어요."),
        { enableHighAccuracy: true }
    );
  };

  // ── 오버레이 관리 & 경로
  function clearOverlays() {
    const { markers, polylines } = overlaysRef.current;
    markers.forEach((m) => m.setMap?.(null));
    polylines.forEach((p) => p.setMap?.(null));
    overlaysRef.current.markers = [];
    overlaysRef.current.polylines = [];
  }

  function makeStartGoalMarker(latlng, text, side = "right") {
    const naver = window.naver;
    return new naver.maps.Marker({
      position: latlng,
      map: mapRef.current,
      zIndex: 100,
      title: text,
      icon: {
        content: `
          <div class="marker-with-label ${side}">
            <img class="marker-loc" src="${LOC_ICON_URL}" alt="${text}" />
            <div class="marker-label">${text || ""}</div>
          </div>
        `,
        size: new naver.maps.Size(28, 28),
        anchor: new naver.maps.Point(14, 28),
      },
    });
  }
  function makeSpotMarker(latlng, title = "") {
    const naver = window.naver;
    return new naver.maps.Marker({
      position: latlng,
      map: mapRef.current,
      zIndex: 90,
      title,
      icon: {
        content: `<img class="marker-spot" src="${SPOT_ICON_URL}" alt="${title}" />`,
        size: new naver.maps.Size(22, 22),
        anchor: new naver.maps.Point(11, 11),
      },
    });
  }
  function dropGuideDots(latlngs) {
    const naver = window.naver;
    if (!latlngs || latlngs.length < 4) return;
    const picks = [0.25, 0.5, 0.75]
        .map((t) => Math.floor((latlngs.length - 1) * t))
        .filter((i, idx, arr) => i > 0 && i < latlngs.length - 1 && arr.indexOf(i) === idx);
    picks.forEach((i) => {
      const mk = new naver.maps.Marker({
        position: latlngs[i],
        map: mapRef.current,
        zIndex: 80,
        icon: {
          content: `<div class="guide-dot"></div>`,
          size: new naver.maps.Size(10, 10),
          anchor: new naver.maps.Point(5, 5),
        },
      });
      overlaysRef.current.markers.push(mk);
    });
  }

  async function drawCourse(course) {
    const naver = window.naver;
    if (!naver?.maps || !mapRef.current) return;
    setMsg("");
    clearOverlays();

    const map = mapRef.current;

    let latlngs =
        Array.isArray(course.path) && course.path.length > 1
            ? course.path.map((p) => new naver.maps.LatLng(p.lat, p.lng))
            : null;

    if (!latlngs) {
      const tmapPath = await fetchTmapPedestrian({
        startLng: course.origin.lng,
        startLat: course.origin.lat,
        goalLng: course.dest.lng,
        goalLat: course.dest.lat,
      });
      if (Array.isArray(tmapPath) && tmapPath.length > 1) {
        latlngs = tmapPath.map(([lng, lat]) => new naver.maps.LatLng(lat, lng));
      } else {
        setMsg("보행자 경로를 불러오지 못해 직선을 표시했어요.");
        latlngs = [
          new naver.maps.LatLng(course.origin.lat, course.origin.lng),
          new naver.maps.LatLng(course.dest.lat, course.dest.lng),
        ];
      }
    }

    const line = new naver.maps.Polyline({
      path: latlngs,
      strokeColor: "#111111",
      strokeOpacity: 0.95,
      strokeWeight: 6,
      zIndex: 60,
      map,
    });
    overlaysRef.current.polylines.push(line);

    const startMarker = makeStartGoalMarker(
        new naver.maps.LatLng(course.origin.lat, course.origin.lng),
        course.origin.name || "출발",
        "left"
    );
    const goalMarker = makeStartGoalMarker(
        new naver.maps.LatLng(course.dest.lat, course.dest.lng),
        course.dest.name || "도착",
        "right"
    );
    overlaysRef.current.markers.push(startMarker, goalMarker);

    (course.spots || []).forEach((s) => {
      const mk = makeSpotMarker(new naver.maps.LatLng(s.lat, s.lng), s.name);
      overlaysRef.current.markers.push(mk);
    });

    dropGuideDots(latlngs);
    const bounds = latlngs.reduce(
        (b, ll) => (b.extend(ll), b),
        new naver.maps.LatLngBounds(latlngs[0], latlngs[0])
    );
    map.fitBounds(bounds);
  }

  return (
      <div
          className="screen"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            width: "100vw",
            margin: 0,
            overflow: "hidden",
          }}
      >
        {/* 앱바는 없음 */}

        <div style={{ flex: 1, position: "relative" }}>
          {/* 지도는 하단바 높이만큼 위로 띄워 가려지지 않게 */}
          <div
              ref={mapContainerRef}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: BOTTOM_BAR_H }}
          />

          <div
              className="floating-top"
              style={{
                position: "absolute",
                top: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
              }}
          >
            {msg && <div className="toast">{msg}</div>}
          </div>

          {/* 코스 추천 시트: 하단바 위에 얹히고, 최대 높이를 가상 앱바에 정렬 */}
          <div
              ref={sheetRef}
              style={{
                position: "absolute",
                bottom: BOTTOM_BAR_H,
                left: 0,
                right: 0,
                background: "white",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                boxShadow: "0 -4px 12px rgba(0,0,0,0.1)",
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                zIndex: 5,
              }}
          >
            {/* 인디케이터: 최대 확장 시 시트 상단 === VIRTUAL_APPBAR_H 이므로
              결과적으로 인디케이터가 '앱바 바로 위'에 위치하게 됨 */}
            <div
                ref={dragHandleRef}
                style={{
                  padding: "8px 16px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  cursor: "grab",
                  flexShrink: 0,
                }}
            >
              <div style={{ width: 46, height: 4, opacity: 0.4, background: "#94989F", borderRadius: 100 }} />
            </div>

            <div ref={listRef} style={{ overflowY: "auto", flex: 1, paddingBottom: 16 }}>
              {courses.map((course, i) => {
                const distKm = course.totalDistance / 1000;
                const totalMinutes = Math.round(course.totalTime / 60);
                const h = Math.floor(totalMinutes / 60);
                const m = totalMinutes % 60;
                const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
                const active = i === idx;

                return (
                    <div
                        key={course.id}
                        onClick={() => setIdx(i)}
                        style={{
                          alignSelf: "stretch",
                          padding: "8px 16px",
                          background: active ? "#FFF4EC" : "white",
                          borderRadius: 4,
                          justifyContent: "space-between",
                          alignItems: "center",
                          display: "flex",
                          margin: "0 8px 8px 8px",
                        }}
                    >
                      <div style={{ width: "100%", justifyContent: "space-between", alignItems: "center", display: "flex" }}>
                        <div style={{ justifyContent: "flex-start", alignItems: "center", gap: 16, display: "flex" }}>
                          <img style={{ width: 100, height: 100, position: "relative", borderRadius: 8 }} src="https://placehold.co/100x100" />
                          <div style={{ flex: 1, flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: 4, display: "inline-flex" }}>
                            <div style={{ paddingLeft: 3, paddingRight: 3, paddingTop: 1, paddingBottom: 1, background: "#FFDBC5", borderRadius: 3, justifyContent: "flex-start", alignItems: "center", gap: 2, display: "inline-flex" }}>
                              <div style={{ width: 12, height: 12, position: "relative", overflow: "hidden" }}>
                                <img style={{ width: 12, height: 12, left: 0, top: 0, position: "absolute" }} src="/badge.png" />
                              </div>
                              <div style={{ color: "#373D44", fontSize: 10, fontFamily: "Pretendard", fontWeight: "700", lineHeight: "16.50px", wordWrap: "break-word" }}>
                                추천
                              </div>
                            </div>
                            <div style={{ flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: 6, display: "flex" }}>
                              <div style={{ width: 177, color: "#1E1E22", fontSize: 18, fontFamily: "Pretendard", fontWeight: "700", wordWrap: "break-word", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {course.title}
                              </div>
                              <div style={{ alignSelf: "stretch", flexDirection: "column", justifyContent: "flex-start", alignItems: "flex-start", gap: 2, display: "flex" }}>
                                <div style={{ alignSelf: "stretch", color: "#626264", fontSize: 12, fontFamily: "Pretendard", fontWeight: "500", wordWrap: "break-word" }}>
                                  {course.desc1}
                                </div>
                                <div style={{ color: "#626264", fontSize: 12, fontFamily: "Pretendard", fontWeight: "500", wordWrap: "break-word" }}>
                                  {course.desc2}
                                </div>
                              </div>
                              <div style={{ justifyContent: "flex-start", alignItems: "flex-start", gap: 4, display: "inline-flex" }}>
                                <div style={{ justifyContent: "flex-start", alignItems: "center", gap: 3, display: "flex" }}>
                                  <div style={{ width: 12, height: 12, position: "relative" }}>
                                    <img src="/km.png" style={{ width: "100%", height: "100%" }} />
                                  </div>
                                  <div style={{ justifyContent: "flex-start", alignItems: "center", gap: 6, display: "flex" }}>
                                    <div style={{ color: "#626264", fontSize: 11, fontFamily: "Pretendard", fontWeight: "400", wordWrap: "break-word" }}>
                                      {distKm.toFixed(2)}km
                                    </div>
                                  </div>
                                </div>
                                <div style={{ justifyContent: "flex-start", alignItems: "center", gap: 3, display: "flex" }}>
                                  <div style={{ width: 12, height: 12, position: "relative" }}>
                                    <img src="/timer.png" style={{ width: "100%", height: "100%" }} />
                                  </div>
                                  <div style={{ justifyContent: "flex-start", alignItems: "center", gap: 6, display: "flex" }}>
                                    <div style={{ color: "#626264", fontSize: 11, fontFamily: "Pretendard", fontWeight: "400", wordWrap: "break-word" }}>
                                      예상시간 {timeStr}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        {active && (
                            <div
                                style={{
                                  paddingLeft: 10,
                                  paddingRight: 10,
                                  paddingTop: 8,
                                  paddingBottom: 8,
                                  background: "var(--main, #FF8C42)",
                                  borderRadius: 100,
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: 10,
                                  display: "flex",
                                  cursor: "pointer",
                                }}
                                onClick={handleStartRunning}
                            >
                              <div style={{ color: "#FCFCFC", fontSize: 11, fontFamily: "Pretendard", fontWeight: "600", wordWrap: "break-word" }}>
                                달리기
                              </div>
                            </div>
                        )}
                      </div>
                    </div>
                );
              })}
            </div>
          </div>
        </div>

        {alertComponent}

        {/* 하단바: 화면 가장자리를 꽉 채우도록 고정 */}
        <div
            className="bottom-bar-host"
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              zIndex: 6, // 시트(5) 위에
            }}
        >
          <BottomBar activeTab="running" fullWidth />
        </div>
      </div>
  );
}
