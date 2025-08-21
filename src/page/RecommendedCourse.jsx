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
function levelByDistance(km) {
  if (km < 5) return "초급";
  if (km < 10) return "중급";
  return "상급";
}

// ────────────────────────────────────────────────
// 카드 (버튼만 클릭 가능, 활성 클래스 적용)
function CourseCard({ course, onRun, active }) {
  const distKm = useMemo(() => {
    return getDistanceFromLatLonInKm(
      course.origin.lat,
      course.origin.lng,
      course.dest.lat,
      course.dest.lng
    );
  }, [course]);

  const level = levelByDistance(distKm);
  const timeStr = estimateTimeStr(distKm);

  return (
    <div
      className={`course-card${active ? " active" : ""}`}
      aria-current={active ? "true" : "false"}
    >
      <div className="cc-head">
        <div className="cc-thumb" />
        <div className="cc-meta">
          <div className="cc-title">{course.title}</div>

          <div className="cc-desc">
            <div>{course.desc1}</div>
            <div>{course.desc2}</div>
          </div>

          <div className="cc-row">
            <div className="cc-level">
              <span>{level}</span>
            </div>
            <div className="cc-dist">
              {distKm.toFixed(2)}km · 예상시간 {timeStr}
            </div>
          </div>
        </div>
      </div>

      <div className="divider" />

      <div className="cc-bottom">
        {(course.spots || []).slice(0, 2).map((s) => (
          <div key={s.name} className="cc-spot">
            <div className="cc-spot-icon" />
            <div className="cc-spot-name">{s.name}</div>
          </div>
        ))}

        <button type="button" className="cc-run-btn" onClick={onRun}>
          코스 달리기
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
const LOC_ICON_URL = "/location.png"; // public/location.png
const SPOT_ICON_URL = "/spot.png"; // public/spot.png
const JSON_URL = "/data/course_bundles/course_5.json";

// 하드코딩으로 선택할 라인들(스팟 포함되는 라인)
const COURSES = [
  {
    id: 3,
    title: "남원 바닷길 러닝",
    desc1: "남원용암해수풀장에서,",
    desc2: "큰엉까지 잔잔한 오션뷰",
    spotNames: ["남원용암해수풀장", "큰엉입구"], // 출/도착(표시용 이름)
  },
  {
    id: 2,
    title: "위미 동백 코스",
    desc1: "위미 바닷가에서,",
    desc2: "세천포구까지 포토스팟",
    spotNames: ["위미 동백나무 군락지", "세천포구"],
  },
  {
    id: 4,
    title: "망장포–쇠소깍",
    desc1: "망장포에서,",
    desc2: "쇠소깍다리까지 완만한 코스",
    spotNames: ["망장포", "쇠소깍다리"],
  },
];

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

  // 캐러셀(네이티브 스크롤 + 부드러운 스냅)
  const sliderRef = useRef(null);
  const CARD_W = 308;
  const GAP = 12;

  // 가운데 스냅 계산
  const step = () => CARD_W + GAP;
  const padL = () =>
    sliderRef.current
      ? parseFloat(getComputedStyle(sliderRef.current).paddingLeft) || 0
      : 0;

  const getTargetLeft = (i) => {
    const el = sliderRef.current;
    if (!el) return 0;
    return i * step() - (el.clientWidth - CARD_W) / 2 + padL();
  };

  const currentIndexByCenter = () => {
    const el = sliderRef.current;
    if (!el) return 0;
    const centerAdjusted =
      el.scrollLeft - padL() + (el.clientWidth - CARD_W) / 2;
    return Math.round(centerAdjusted / step());
  };

  // 이징 애니메이션
  const animRef = useRef({ raf: 0 });
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const cancelAnim = () => {
    if (animRef.current.raf) cancelAnimationFrame(animRef.current.raf);
    animRef.current.raf = 0;
  };
  const animateTo = (left, duration = 420) => {
    const el = sliderRef.current;
    if (!el) return;
    cancelAnim();
    const from = el.scrollLeft;
    const to = Math.max(0, left);
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      el.scrollLeft = from + (to - from) * easeOutCubic(t);
      if (t < 1) animRef.current.raf = requestAnimationFrame(tick);
      else animRef.current.raf = 0;
    };
    animRef.current.raf = requestAnimationFrame(tick);
  };

  const centerToIndex = (i, withAnim = true) => {
    const left = getTargetLeft(i);
    if (!sliderRef.current) return;
    withAnim ? animateTo(left) : (sliderRef.current.scrollLeft = left);
  };

  const snapToNearest = () => {
    if (!sliderRef.current || courses.length === 0) return;
    const target = Math.max(
      0,
      Math.min(currentIndexByCenter(), courses.length - 1)
    );
    setIdx(target);
    centerToIndex(target, true);
  };

  // 스크롤 중 active 동기화 + 멈춤 감지로 스냅
  const idleTimer = useRef(null);
  const onSliderScroll = () => {
    if (!sliderRef.current || courses.length === 0) return;
    setIdx((prev) => {
      const i = currentIndexByCenter();
      return i !== prev ? i : prev;
    });
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (!animRef.current.raf) snapToNearest();
    }, 90);
  };

  // ── JSON 로딩 → 라인 3개를 코스로 구성 (+ 경로 중간 스팟 2개만 뽑기: 시작/끝 제외)
  useEffect(() => {
    let cancelled = false;

    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const tooCloseM = (a, b, m = 80) =>
      getDistanceFromLatLonInKm(a.lat, a.lng, b.lat, b.lng) * 1000 < m;

    (async () => {
      try {
        const res = await fetch(JSON_URL);
        const data = await res.json();

        const built = COURSES.map((course) => {
          const line = (data.lines || [])[course.id];
          if (!Array.isArray(line) || line.length < 2) return null;

          // 출발/도착 좌표
          const first = line[0]; // [lng, lat]
          const last = line[line.length - 1];

          const origin = {
            name: course.spotNames?.[0] || "출발지",
            lat: first[1],
            lng: first[0],
          };
          const dest = {
            name: course.spotNames?.[1] || "도착지",
            lat: last[1],
            lng: last[0],
          };

          // JSON에 line_mid_spots가 있으면 우선 사용
          let midsFromFile =
            data.line_mid_spots?.[String(course.id)]?.map((s) => ({
              name: s.name,
              lat: s.lat,
              lng: s.lng,
            })) ?? [];

          // 폴백: 라인 기반 자동 산출(33%, 50%, 66% 후보 중 2개 선택)
          const autoMid = () => {
            const picks = [0.33, 0.5, 0.66]
              .map((t) =>
                clamp(Math.floor(line.length * t), 5, line.length - 6)
              )
              .filter((v, i, arr) => arr.indexOf(v) === i);
            const result = [];
            for (const idx of picks) {
              const [lng, lat] = line[idx];
              const cand = {
                name: `중간 스팟 ${result.length + 1}`,
                lat,
                lng,
              };
              if (
                !tooCloseM(cand, origin) &&
                !tooCloseM(cand, dest) &&
                result.every((r) => !tooCloseM(cand, r, 50))
              ) {
                result.push(cand);
              }
              if (result.length === 2) break;
            }
            // 혹시 부족하면 중앙 쪽에서 보충
            if (result.length < 2) {
              const midIdx = clamp(
                Math.floor(line.length * 0.5),
                5,
                line.length - 6
              );
              const [lng, lat] = line[midIdx];
              const cand = { name: `중간 스팟 ${result.length + 1}`, lat, lng };
              if (
                !tooCloseM(cand, origin) &&
                !tooCloseM(cand, dest) &&
                result.every((r) => !tooCloseM(cand, r, 50))
              ) {
                result.push(cand);
              }
            }
            return result.slice(0, 2);
          };

          let midSpots = (midsFromFile.length >= 2 ? midsFromFile : autoMid())
            // 시작/끝과 너무 가까운 것은 제외
            .filter((m) => !tooCloseM(m, origin) && !tooCloseM(m, dest))
            .slice(0, 2);

          return {
            id: `course_5_${course.id}`,
            title: course.title,
            desc1: course.desc1,
            desc2: course.desc2,
            origin,
            dest,
            spots: midSpots, // ★ 중간 스팟만
            path: line.map(([lng, lat]) => ({ lat, lng })),
          };
        }).filter(Boolean);

        if (!cancelled) setCourses(built);
      } catch (e) {
        console.error(e);
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
    // 현재 인덱스로 캐러셀도 맞춰두기(첫 로드 대비)
    requestAnimationFrame(() => centerToIndex(idx, false));
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
    <div className="screen">
      <div className="appbar">
        <div className="appbar-title">추천코스</div>
      </div>

      <div ref={mapContainerRef} className="map-container" />

      <div className="floating-top">
        {msg && <div className="toast">{msg}</div>}
      </div>

      {/* 카드 캐러셀: 네이티브 스크롤 + rAF 스냅 */}
      <div className="carousel-wrap" style={{ bottom: "84px" }}>
        <div
          ref={sliderRef}
          className="carousel"
          onScroll={onSliderScroll}
          style={{ ["--card-w"]: `${CARD_W}px` }}
        >
          {courses.map((c, i) => (
            <div
              key={c.id}
              className="card-click-wrap"
              style={{ width: CARD_W }}
            >
              <CourseCard
                course={c}
                onRun={handleStartRunning}
                active={i === idx}
              />
            </div>
          ))}
          <div className="end-spacer" />
        </div>
      </div>

      {alertComponent}
      <BottomBar activeTab="running" />
    </div>
  );
}
