import React, { useEffect, useMemo, useRef, useState } from "react";
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
      existing.addEventListener("load", () => resolve(window.naver), {
        once: true,
      });
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

        // Create a lookup map for segments by their ID for efficient access
        const segmentMap = segments.reduce((acc, segment) => {
          acc[segment.id] = segment;
          return acc;
        }, {});

        const built = Object.values(recommendedCourses)
          .map((course) => {
            const segmentIds = course.path; // e.g., ["17-2", "17-3"]
            if (!Array.isArray(segmentIds) || segmentIds.length === 0) {
              console.warn(`Course "${course.title}" has no path segments.`);
              return null;
            }

            // Collect path, spots, and distance from all segments
            let fullPath = [];
            let allSpots = [];
            let totalDistanceMeters = 0;

            for (const segmentId of segmentIds) {
              const segment = segmentMap[segmentId];
              if (segment) {
                // segment.path is [[lng, lat], ...]
                fullPath = fullPath.concat(segment.path);
                if (Array.isArray(segment.spot)) {
                  allSpots = allSpots.concat(segment.spot);
                }
                if (segment.summary?.totalDistance) {
                  totalDistanceMeters += segment.summary.totalDistance;
                }
              } else {
                console.warn(
                  `Segment with id "${segmentId}" not found for course "${course.title}".`
                );
              }
            }

            if (fullPath.length < 2) {
              console.warn(
                `Course "${course.title}" has an invalid path after processing segments.`
              );
              return null;
            }

            const firstCoord = fullPath[0];
            const lastCoord = fullPath[fullPath.length - 1];

            const origin = {
              name: "출발지",
              lat: firstCoord[1],
              lng: firstCoord[0],
            };
            const dest = {
              name: "도착지",
              lat: lastCoord[1],
              lng: lastCoord[0],
            };

            // Extract up to 2 spots
            const midSpots = allSpots
              .map((p) => ({
                name: p.VISIT_AREA_NM,
                lat: p.Y_COORD,
                lng: p.X_COORD,
              }))
              .slice(0, 2);

            const totalKm = totalDistanceMeters / 1000;

            return {
              id: segmentIds.join("_"), // Create a unique ID from segment IDs
              title: course.title,
              desc1: course.description,
              desc2: `거리: ${totalKm.toFixed(2)}km`,
              origin,
              dest,
              spots: midSpots,
              // The component expects [{lat, lng}, ...]
              path: fullPath.map(([lng, lat]) => ({ lat, lng })),
            };
          })
          .filter(Boolean); // Filter out nulls from failed courses

        if (!cancelled) {
          setCourses(built);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 지도에 코스 그리기 (맵/코스 준비된 뒤)
  useEffect(() => {
    if (!mapRef.current || !selectedCourse) return;
    drawCourse(selectedCourse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse?.id, mapRef.current]);

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
              onStart={() =>
                navigate("/run", { state: { courseId: selectedCourse.id } })
              }
            />
          );
        } else {
          setAlertComponent(
            <AlertNotStart onClose={() => setAlertComponent(null)} />
          );
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
      .filter(
        (i, idx, arr) =>
          i > 0 && i < latlngs.length - 1 && arr.indexOf(i) === idx
      );
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

    // 경로: JSON path 우선, 없으면 Tmap 폴백
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

    // 라인
    const line = new naver.maps.Polyline({
      path: latlngs,
      strokeColor: "#111111",
      strokeOpacity: 0.95,
      strokeWeight: 6,
      zIndex: 60,
      map,
    });
    overlaysRef.current.polylines.push(line);

    // 출/도착
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

    // 중간 스팟(2개만)
    (course.spots || []).forEach((s) => {
      const mk = makeSpotMarker(new naver.maps.LatLng(s.lat, s.lng), s.name);
      overlaysRef.current.markers.push(mk);
    });

    // 가이드 점 + 범위
    dropGuideDots(latlngs);
    const bounds = latlngs.reduce(
      (b, ll) => (b.extend(ll), b),
      new naver.maps.LatLngBounds(latlngs[0], latlngs[0])
    );
    map.fitBounds(bounds);
  }

  // ── UI
  return (
    <div className="screen" style={{display: 'flex', flexDirection: 'column', height: '100vh', width: 360, margin: '0 auto'}}>
      <div className="appbar">
        <div className="appbar-title">추천코스</div>
      </div>

      <div ref={mapContainerRef} style={{height: 414, position: 'relative', overflow: 'hidden', flexShrink: 0}}>
        <div style={{width: 186.24, height: 173.28, left: 94, top: 108, position: 'absolute', outline: '3.84px #1E1E22 solid', outlineOffset: '-1.92px'}} />
        <div style={{width: 82, left: 43, top: 232, position: 'absolute', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 4, display: 'inline-flex'}}>
          <div style={{alignSelf: 'stretch', textAlign: 'center', color: 'var(--main, #FF8C42)', fontSize: 12, fontFamily: 'Pretendard', fontWeight: '700', wordWrap: 'break-word'}}>해수욕장 근처</div>
          <div style={{width: 34, height: 34, position: 'relative'}}>
            <div style={{width: 34, height: 34, left: 0, top: 0, position: 'absolute', background: 'var(--main, #FF8C42)', backdropFilter: 'blur(13.05px)'}} />
            <div style={{width: 19.43, height: 19.43, left: 7.08, top: 7.08, position: 'absolute', background: 'var(--main, #FF8C42)', border: '0.96px #1E1E22 solid', backdropFilter: 'blur(13.05px)'}} />
            <div style={{width: 7.77, height: 7.77, left: 13.15, top: 13.15, position: 'absolute', background: '#1E1E22'}} />
          </div>
        </div>
        <div style={{width: 69, left: 242, top: 86, position: 'absolute', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 4, display: 'inline-flex'}}>
          <div style={{alignSelf: 'stretch', textAlign: 'center', color: 'var(--main, #FF8C42)', fontSize: 12, fontFamily: 'Pretendard', fontWeight: '700', wordWrap: 'break-word'}}>성산일출봉</div>
          <div style={{width: 34, height: 34, position: 'relative'}}>
            <div style={{width: 34, height: 34, left: 0, top: 0, position: 'absolute', background: 'var(--main, #FF8C42)', backdropFilter: 'blur(13.05px)'}} />
            <div style={{width: 19.43, height: 19.43, left: 7.08, top: 7.08, position: 'absolute', background: 'var(--main, #FF8C42)', border: '0.96px #1E1E22 solid', backdropFilter: 'blur(13.05px)'}} />
            <div style={{width: 7.77, height: 7.77, left: 13.15, top: 13.15, position: 'absolute', background: '#1E1E22'}} />
          </div>
        </div>
        <div style={{width: 56, height: 88, left: 112, top: 107, position: 'absolute'}}>
          <div style={{width: 56, height: 71, left: 0, top: 17, position: 'absolute'}}>
            <div style={{width: 56, height: 56, left: 0, top: 0, position: 'absolute', background: 'white', borderRadius: 5}} />
            <div style={{width: 50, height: 50, left: 3, top: 3, position: 'absolute', background: '#D8D8D8', borderRadius: 5}} />
            <div style={{width: 50, height: 50, left: 3, top: 3, position: 'absolute', background: '#D8D8D8', borderRadius: 5}} />
            <div style={{width: 20, height: 24, left: 18, top: 47, position: 'absolute'}}>
              <div style={{width: 20, height: 24, left: 0, top: 0, position: 'absolute', background: 'black', outline: '2px black solid', outlineOffset: '-1px'}} />
              <div style={{width: 6.46, height: 6.55, left: 7, top: 6.54, position: 'absolute', background: 'white', outline: '2px white solid', outlineOffset: '-1px'}} />
            </div>
          </div>
          <div style={{left: 14, top: 0, position: 'absolute', textAlign: 'center', color: 'black', fontSize: 11, fontFamily: 'Pretendard', fontWeight: '400', wordWrap: 'break-word'}}>금오름</div>
        </div>
        <div style={{width: 56, height: 88, left: 185, top: 73, position: 'absolute'}}>
          <div style={{width: 56, height: 71, left: 0, top: 17, position: 'absolute'}}>
            <div style={{width: 56, height: 56, left: 0, top: 0, position: 'absolute', background: 'white', borderRadius: 5}} />
            <div style={{width: 50, height: 50, left: 3, top: 3, position: 'absolute', background: '#D8D8D8', borderRadius: 5}} />
            <div style={{width: 50, height: 50, left: 3, top: 3, position: 'absolute', background: '#D8D8D8', borderRadius: 5}} />
            <div style={{width: 20, height: 24, left: 18, top: 47, position: 'absolute'}}>
              <div style={{width: 20, height: 24, left: 0, top: 0, position: 'absolute', background: 'black'}} />
              <div style={{width: 6.46, height: 6.55, left: 7, top: 6.54, position: 'absolute', background: 'white', outline: '2px white solid', outlineOffset: '-1px'}} />
            </div>
          </div>
          <div style={{left: 14, top: 0, position: 'absolute', textAlign: 'center', color: 'black', fontSize: 11, fontFamily: 'Pretendard', fontWeight: '400', wordWrap: 'break-word'}}>금오름</div>
        </div>
        <div style={{padding: 10, left: 230, top: 295, position: 'absolute', background: 'rgba(30, 30, 34, 0.10)', borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 4, display: 'inline-flex'}}>
          <div style={{width: 12, height: 12, position: 'relative'}}>
            <div style={{width: 3.50, height: 4, left: 0.99, top: 1, position: 'absolute', outline: '0.60px #1E1E22 solid', outlineOffset: '-0.30px'}} />
            <div style={{width: 3.52, height: 4, left: 7.49, top: 7, position: 'absolute', outline: '0.60px var(--main, #FF8C42) solid', outlineOffset: '-0.30px'}} />
            <div style={{width: 4.68, height: 7, left: 3.66, top: 2.50, position: 'absolute', outline: '0.60px #1E1E22 solid', outlineOffset: '-0.30px'}} />
            <div style={{width: 0.64, height: 0.50, left: 2.43, top: 2.50, position: 'absolute', outline: '1.20px #1E1E22 solid', outlineOffset: '-0.60px'}} />
            <div style={{width: 0.64, height: 0.50, left: 8.93, top: 8.50, position: 'absolute', outline: '1.20px #1E1E22 solid', outlineOffset: '-0.60px'}} />
            <div style={{width: 12, height: 12, left: 12, top: 12, position: 'absolute', transform: 'rotate(-180deg)', transformOrigin: 'top left', opacity: 0}} />
          </div>
          <div style={{textAlign: 'center', color: 'black', fontSize: 11, fontFamily: 'Pretendard', fontWeight: '400', wordWrap: 'break-word'}}>아름다운 해변 코스</div>
        </div>
      </div>

      <div className="floating-top">
        {msg && <div className="toast">{msg}</div>}
      </div>

      <div style={{flex: 1, background: 'white', overflowY: 'auto', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 84, boxSizing: 'border-box'}}>
        <div style={{alignSelf: 'stretch', paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, background: 'white', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center', gap: 12, display: 'flex'}}>
          <div style={{width: 46, height: 4, opacity: 0.40, background: '#94989F', borderRadius: 100}} />
        </div>
        {courses.map((course, i) => {
          const distKm = getDistanceFromLatLonInKm(
            course.origin.lat,
            course.origin.lng,
            course.dest.lat,
            course.dest.lng
          );
          const timeStr = estimateTimeStr(distKm);
          const active = i === idx;

          return (
            <div
              key={course.id}
              onClick={() => setIdx(i)}
              style={{alignSelf: 'stretch', paddingLeft: 16, paddingRight: 16, paddingTop: 8, paddingBottom: 8, background: active ? '#FFF4EC' : 'white', borderRadius: 4, justifyContent: 'space-between', alignItems: 'center', display: 'inline-flex'}}
            >
              <div style={{width: 328, justifyContent: 'space-between', alignItems: 'center', display: 'flex'}}>
                <div style={{justifyContent: 'flex-start', alignItems: 'center', gap: 16, display: 'flex'}}>
                  <img style={{width: 100, height: 100, position: 'relative', borderRadius: 8}} src="https://placehold.co/100x100" />
                  <div style={{width: 129, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 4, display: 'inline-flex'}}>
                    <div style={{paddingLeft: 3, paddingRight: 3, paddingTop: 1, paddingBottom: 1, background: '#FFDBC5', borderRadius: 3, justifyContent: 'flex-start', alignItems: 'center', gap: 2, display: 'inline-flex'}}>
                      <div style={{width: 12, height: 12, position: 'relative', overflow: 'hidden'}}>
                        <img style={{width: 12, height: 12, left: 0, top: 0, position: 'absolute'}} src="/badge.png" />
                      </div>
                      <div style={{color: '#373D44', fontSize: 10, fontFamily: 'Pretendard', fontWeight: '700', lineHeight: '16.50px', wordWrap: 'break-word'}}>추천</div>
                    </div>
                    <div style={{flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 6, display: 'flex'}}>
                      <div style={{width: 177, color: '#1E1E22', fontSize: 18, fontFamily: 'Pretendard', fontWeight: '700', wordWrap: 'break-word'}}>{course.title}</div>
                      <div style={{alignSelf: 'stretch', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: 2, display: 'flex'}}>
                        <div style={{alignSelf: 'stretch', color: '#626264', fontSize: 12, fontFamily: 'Pretendard', fontWeight: '500', wordWrap: 'break-word'}}>{course.desc1}</div>
                        <div style={{color: '#626264', fontSize: 12, fontFamily: 'Pretendard', fontWeight: '500', wordWrap: 'break-word'}}>{course.desc2}</div>
                      </div>
                      <div style={{justifyContent: 'flex-start', alignItems: 'flex-start', gap: 4, display: 'inline-flex'}}>
                        <div style={{justifyContent: 'flex-start', alignItems: 'center', gap: 3, display: 'flex'}}>
                          <div style={{width: 12, height: 12, position: 'relative'}}>
                            <img src="/km.png" style={{width: '100%', height: '100%'}} />
                          </div>
                          <div style={{justifyContent: 'flex-start', alignItems: 'center', gap: 6, display: 'flex'}}>
                            <div style={{color: '#626264', fontSize: 11, fontFamily: 'Pretendard', fontWeight: '400', wordWrap: 'break-word'}}>{distKm.toFixed(2)}km</div>
                          </div>
                        </div>
                        <div style={{justifyContent: 'flex-start', alignItems: 'center', gap: 3, display: 'flex'}}>
                          <div style={{width: 12, height: 12, position: 'relative'}}>
                             <img src="/timer.png" style={{width: '100%', height: '100%'}} />
                          </div>
                          <div style={{justifyContent: 'flex-start', alignItems: 'center', gap: 6, display: 'flex'}}>
                            <div style={{color: '#626264', fontSize: 11, fontFamily: 'Pretendard', fontWeight: '400', wordWrap: 'break-word'}}>예상시간 {timeStr}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {active && (
                <div style={{paddingLeft: 10, paddingRight: 10, paddingTop: 8, paddingBottom: 8, background: 'var(--main, #FF8C42)', borderRadius: 100, justifyContent: 'center', alignItems: 'center', gap: 10, display: 'flex'}} onClick={handleStartRunning}>
                  <div style={{color: '#FCFCFC', fontSize: 11, fontFamily: 'Pretendard', fontWeight: '600', wordWrap: 'break-word'}}>달리기</div>
                </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {alertComponent}
      <BottomBar activeTab="running" />
    </div>
  );
}
