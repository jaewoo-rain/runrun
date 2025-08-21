import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import "./RecommendedCourse.css";
import { getDistanceFromLatLonInKm } from "../utils/location.js";
import AlertStart from "../components/AlertStart.jsx";
import AlertNotStart from "../components/AlertNotStart.jsx";
import BottomBar from "../components/BottomBar.jsx";
import { useDispatch } from "react-redux";
import { startRun } from "../redux/runningSlice";

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

const LOC_ICON_URL = "/location.png";
const JSON_URL = "/data/course_bundles/course_simul.json";

// Hardcoded list of image paths from public/image/
const IMAGE_PATHS = [
  "/image/광령교.jpg",
  "/image/김만덕.jpg",
  "/image/닭머르.jpg",
  "/image/별도봉.jpeg",
  "/image/어영소공원.jpg",
  "/image/연북정.jpg",
  "/image/외도월대.jpg",
  "/image/용두암.jpeg",
  "/image/용연구름다리.jpg",
  "/image/이호테우.jpeg",
];

// Function to get a random image path
function getRandomImagePath() {
  const randomIndex = Math.floor(Math.random() * IMAGE_PATHS.length);
  return IMAGE_PATHS[randomIndex];
}

export default function RecommendedCourse() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const NAVER_KEY = import.meta.env.VITE_NAVER_CLIENT_ID;
  const RECOMMENDED_COURSE_TITLES = [
    "낭만 해안도로 코스",
    "제주 원도심 입문",
    "하천과 바다가 만나는 길",
  ];

  const VIRTUAL_APPBAR_H = 56;
  const BOTTOM_BAR_H = 56;
  const INDICATOR_AREA_H = 24;

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

  const SNAP_POINTS = useMemo(() => {
    const vh = window.innerHeight;
    const max = Math.max(200, vh - BOTTOM_BAR_H - VIRTUAL_APPBAR_H);
    const mid = Math.round(max * 0.5);
    return [INDICATOR_AREA_H, mid];
  }, []);

  const handleDragMove = useCallback(
    (e) => {
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
    },
    [SNAP_POINTS]
  );

  const handleDragEnd = useCallback(() => {
    if (!dragState.current.isDragging) return;
    dragState.current.isDragging = false;

    document.removeEventListener("mousemove", handleDragMove);
    document.removeEventListener("mouseup", handleDragEnd);
    document.removeEventListener("touchmove", handleDragMove);
    document.removeEventListener("touchend", handleDragEnd);

    const currentHeight = sheetRef.current.offsetHeight;

    const closestSnapPoint = SNAP_POINTS.reduce((prev, curr) =>
      Math.abs(curr - currentHeight) < Math.abs(prev - currentHeight)
        ? curr
        : prev
    );

    if (sheetRef.current) {
      sheetRef.current.style.transition = "height 0.25s ease-in-out";
      sheetRef.current.style.height = `${closestSnapPoint}px`;
    }
  }, [SNAP_POINTS, handleDragMove]);

  const handleDragStart = useCallback(
    (e) => {
      if (
        listRef.current &&
        listRef.current.contains(e.target) &&
        listRef.current.scrollTop > 0
      ) {
        return;
      }
      e.preventDefault();

      dragState.current = {
        isDragging: true,
        startY: e.touches ? e.touches[0].clientY : e.clientY,
        startHeight: sheetRef.current.offsetHeight,
      };

      sheetRef.current.style.transition = "none";

      document.addEventListener("mousemove", handleDragMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleDragEnd);
      document.addEventListener("touchmove", handleDragMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleDragEnd);
    },
    [handleDragMove, handleDragEnd]
  );

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

  useEffect(() => {
    if (sheetRef.current) {
      sheetRef.current.style.height = `${SNAP_POINTS[1]}px`;
    }
  }, [SNAP_POINTS]);

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
              name: segmentMap[segmentIds[0]].start.name,
              lat: firstCoord[1],
              lng: firstCoord[0],
            };
            const dest = {
              name: segmentMap[segmentIds[segmentIds.length - 1]].end.name,
              lat: lastCoord[1],
              lng: lastCoord[0],
            };

            const midSpots = allSpots
              .map((p) => ({
                name: p.VISIT_AREA_NM,
                lat: p.Y_COORD,
                lng: p.X_COORD,
              }))
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

        built.sort((a, b) => {
          const aIsRecommended = RECOMMENDED_COURSE_TITLES.includes(a.title);
          const bIsRecommended = RECOMMENDED_COURSE_TITLES.includes(b.title);
          if (aIsRecommended === bIsRecommended) return 0;
          return aIsRecommended ? -1 : 1;
        });

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
          logoControl: false,
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
      // Remove event listener when component unmounts

      clearOverlays();
      mapRef.current = null;
    };
  }, [NAVER_KEY]);

  useEffect(() => {
    if (!mapRef.current || !selectedCourse) return;
    drawCourse(selectedCourse);
  }, [selectedCourse?.id]);

  const handleConfirmStart = () => {
    if (!selectedCourse) return;
    dispatch(startRun(selectedCourse));
    navigate("/run");
  };

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
              onStart={handleConfirmStart}
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
          <div style="position: relative; width: 28px; height: 28px; text-align: center;">
            <img src="${LOC_ICON_URL}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" />
            <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 12px; color: #FF8C42; font-weight: bold; white-space: nowrap;">
              ${text}
            </div>
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
        content: `
          <div style="position: relative; width: 33px; height: 42px; text-align: center;">
            <img class="marker-spot" src="${getRandomImagePath()}" alt="${title}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" />
            <div style="position: absolute; top: -20px; left: 50%; transform: translateX(-50%); font-size: 12px; color: black; font-weight: bold; white-space: nowrap;">
              ${title}
            </div>
          </div>
        `,
        size: new naver.maps.Size(33, 42),
        anchor: new naver.maps.Point(16, 42),
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
      <div style={{ flex: 1, position: "relative" }}>
        <div
          ref={mapContainerRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: BOTTOM_BAR_H,
          }}
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
            <div
              style={{
                width: 46,
                height: 4,
                opacity: 0.4,
                background: "#94989F",
                borderRadius: 100,
              }}
            />
          </div>

          <div
            ref={listRef}
            style={{ overflowY: "auto", flex: 1, paddingBottom: 16 }}
          >
            {courses.map((course, i) => {
              const distKm = course.totalDistance / 1000;
              const totalMinutes = Math.round(course.totalTime / 60);
              const h = Math.floor(totalMinutes / 60);
              const m = totalMinutes % 60;
              const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
              const active = i === idx;

              const isRecommended = RECOMMENDED_COURSE_TITLES.includes(
                course.title
              );
              const badgeImage = isRecommended
                ? "/data/recommend-mark.png"
                : "/data/porpular-mark.png";
              const badgeAlt = isRecommended ? "추천" : "인기";

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
                  <div
                    style={{
                      width: "100%",
                      justifyContent: "space-between",
                      alignItems: "center",
                      display: "flex",
                    }}
                  >
                    <div
                      style={{
                        justifyContent: "flex-start",
                        alignItems: "center",
                        gap: 16,
                        display: "flex",
                      }}
                    >
                      {/* Image selection logic for course thumbnails */}
                      {/*
                        TODO: Add more specific images for each course if available.
                        Currently, 'jeju.png' is used for '제주 원도심 입문',
                        and 'photoshoot.png' is used as a generic placeholder for others.
                        Note: 'public/data/image 36.png' has a space in its filename, which is generally not recommended for web assets.
                      */}
                      {(() => {
                        let imagePath = "/photoshoot.png"; // Default generic image
                        switch (course.title) {
                          case "월대에서 용두암까지":
                            imagePath = "/image/용두암.jpeg";
                            break;
                          case "낭만 해안도로 코스":
                            imagePath = "/image/이호테우.jpeg";
                            break;
                          case "용담 해안도로 챌린지":
                            imagePath = "/image/외도월대.jpg";
                            break;
                          case "제주 원도심 입문":
                            imagePath = "/image/김만덕.jpg";
                            break;
                          case "신촌리 바닷길":
                            imagePath = "/image/닭머르.jpg";
                            break;
                          case "하천과 바다가 만나는 길":
                            imagePath = "/image/광령교.jpg";
                            break;
                          case "조천 바다 조망 코스":
                            imagePath = "/image/연북정.jpg";
                            break;
                          case "숲과 바다를 한번에":
                            imagePath = "/image/별도봉.jpeg";
                            break;
                          case "17코스 시작 챌린지":
                            imagePath = "/image/어영소공원.jpg";
                            break;
                        }
                        return (
                          <img
                            style={{
                              width: 100,
                              height: 100,
                              position: "relative",
                              borderRadius: 8,
                            }}
                            src={imagePath}
                          />
                        );
                      })()}
                      <div
                        style={{
                          flex: 1,
                          flexDirection: "column",
                          justifyContent: "flex-start",
                          alignItems: "flex-start",
                          gap: 4,
                          display: "inline-flex",
                        }}
                      >
                        <img
                          src={badgeImage}
                          alt={badgeAlt}
                          style={{ height: 20, objectFit: "contain" }}
                        />
                        <div
                          style={{
                            flexDirection: "column",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            gap: 6,
                            display: "flex",
                          }}
                        >
                          <div
                            style={{
                              width: 177,
                              color: "#1E1E22",
                              fontSize: 18,
                              fontFamily: "Pretendard",
                              fontWeight: "700",
                              wordWrap: "break-word",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {course.title}
                          </div>
                          <div
                            style={{
                              alignSelf: "stretch",
                              flexDirection: "column",
                              justifyContent: "flex-start",
                              alignItems: "flex-start",
                              gap: 2,
                              display: "flex",
                            }}
                          >
                            <div
                              style={{
                                alignSelf: "stretch",
                                color: "#626264",
                                fontSize: 12,
                                fontFamily: "Pretendard",
                                fontWeight: "500",
                                wordWrap: "break-word",
                              }}
                            >
                              {course.desc1}
                            </div>
                          </div>
                          <div
                            style={{
                              justifyContent: "flex-start",
                              alignItems: "flex-start",
                              gap: 4,
                              display: "inline-flex",
                            }}
                          >
                            <div
                              style={{
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 3,
                                display: "flex",
                              }}
                            >
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  position: "relative",
                                }}
                              >
                                <img
                                  src="/km.png"
                                  style={{ width: "100%", height: "100%" }}
                                />
                              </div>
                              <div
                                style={{
                                  justifyContent: "flex-start",
                                  alignItems: "center",
                                  gap: 6,
                                  display: "flex",
                                }}
                              >
                                <div
                                  style={{
                                    color: "#626264",
                                    fontSize: 11,
                                    fontFamily: "Pretendard",
                                    fontWeight: "400",
                                    wordWrap: "break-word",
                                  }}
                                >
                                  {distKm.toFixed(2)}km
                                </div>
                              </div>
                            </div>
                            <div
                              style={{
                                justifyContent: "flex-start",
                                alignItems: "center",
                                gap: 3,
                                display: "flex",
                              }}
                            >
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  position: "relative",
                                }}
                              >
                                <img
                                  src="/timer.png"
                                  style={{ width: "100%", height: "100%" }}
                                />
                              </div>
                              <div
                                style={{
                                  justifyContent: "flex-start",
                                  alignItems: "center",
                                  gap: 6,
                                  display: "flex",
                                }}
                              >
                                <div
                                  style={{
                                    color: "#626264",
                                    fontSize: 11,
                                    fontFamily: "Pretendard",
                                    fontWeight: "400",
                                    wordWrap: "break-word",
                                  }}
                                >
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
                        <div
                          style={{
                            color: "#FCFCFC",
                            fontSize: 11,
                            fontFamily: "Pretendard",
                            fontWeight: "600",
                            wordWrap: "break-word",
                          }}
                        >
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

      <div
        className="bottom-bar-host"
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          zIndex: 6,
        }}
      >
        <BottomBar activeTab="running" fullWidth />
      </div>
    </div>
  );
}
