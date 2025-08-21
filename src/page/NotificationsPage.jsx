// AllCoursesPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";

/* ---------------- Naver Maps Loader ---------------- */
function loadNaverMaps(clientId) {
  const existed = document.querySelector("script[data-naver-maps]");
  if (existed) {
    return window.naver?.maps
      ? Promise.resolve(window.naver.maps)
      : new Promise((res) =>
          existed.addEventListener("load", () => res(window.naver.maps))
        );
  }
  const s = document.createElement("script");
  s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
  s.async = true;
  s.defer = true;
  s.dataset.naverMaps = "true";
  return new Promise((resolve, reject) => {
    s.onload = () => resolve(window.naver.maps);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ---------------- Utils ---------------- */
const toLatLngs = (nmaps, coords) =>
  coords.map(([lng, lat]) => new nmaps.LatLng(lat, lng));

const hslToHex = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
};

// 코스 개수 N개일 때, 코스 인덱스 i(0-based)에 고르게 다른 색
const colorForCourse = (i, total) => {
  if (total <= 1) return "#377eb8";
  const hue = Math.round((i / total) * 330); // 0~330
  return hslToHex(hue, 85, 50);
};

const svgPin = (color = "#e41a1c") =>
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 24 34">
  <path d="M12 34s10-11.3 10-19A10 10 0 1 0 2 15c0 7.7 10 19 10 19z" fill="${color}" stroke="white" stroke-width="1.2"/>
  <circle cx="12" cy="14" r="3.5" fill="white"/>
</svg>`
  );

const svgGuide = (color = "#333") =>
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 24 34">
  <path d="M12 34s10-11.3 10-19A10 10 0 1 0 2 15c0 7.7 10 19 10 19z" fill="${color}" stroke="white" stroke-width="1.2"/>
  <rect x="9" y="11" width="6" height="6" rx="1" ry="1" fill="white"/>
</svg>`
  );

/* ---------------- Bundle -> Feature helpers ---------------- */
function bundleLines(bundle) {
  // [[ [lng,lat]... ], [ ... ], ... ] : 세그먼트 배열
  return Array.isArray(bundle?.lines) ? bundle.lines : [];
}
function bundleSpots(bundle) {
  return Array.isArray(bundle?.spots) ? bundle.spots : [];
}
function bundleGuides(bundle) {
  return Array.isArray(bundle?.guide_points) ? bundle.guide_points : [];
}

/* ---------------- Component ---------------- */
export default function NotificationsPage() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const infoRef = useRef(null);

  // 오버레이 보관 (코스별 그룹)
  const groupsRef = useRef(new Map()); // course -> { polylines:[], spotMarkers:[], guideMarkers:[], color }

  const [courses, setCourses] = useState([]); // [{course, file, ...}] from index.json
  const [bundles, setBundles] = useState([]); // [{course, bundle, color}]
  const [showSpots, setShowSpots] = useState(true);
  const [showGuides, setShowGuides] = useState(false);
  const [visibleCourses, setVisibleCourses] = useState(new Set()); // 표시할 코스 집합
  const [hoverCourse, setHoverCourse] = useState(null); // hover 강조

  // 1) 인덱스 & 번들 로딩
  useEffect(() => {
    const run = async () => {
      // 1-1) index.json
      const idxRes = await fetch(`/data/course_bundles/index.json`);
      const idx = await idxRes.json();
      const list = (idx?.courses || []).map((c) => ({ ...c })); // course, file, counts...
      setCourses(list);

      // 1-2) 전체 번들 로딩
      const total = list.length || 1;
      const loaded = [];
      for (let i = 0; i < list.length; i++) {
        const it = list[i];
        try {
          const res = await fetch(`/data/course_bundles/${it.file}`);
          const b = await res.json();
          loaded.push({
            course: it.course,
            bundle: b,
            color: colorForCourse(i, total),
          });
        } catch (e) {
          console.warn("bundle load failed:", it.file, e);
        }
      }
      setBundles(loaded);
      setVisibleCourses(new Set(loaded.map((x) => x.course))); // 기본 전체 표시
    };
    run();
  }, []);

  // 2) 지도 초기화 & 렌더
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const nmaps = await loadNaverMaps(import.meta.env.VITE_NAVER_CLIENT_ID);
      if (cancelled) return;

      if (!mapRef.current) {
        mapRef.current = new nmaps.Map(containerRef.current, {
          center: new nmaps.LatLng(33.38, 126.5),
          zoom: 10,
          zoomControl: true,
          zoomControlOptions: { position: nmaps.Position.TOP_RIGHT },
        });
        infoRef.current = new nmaps.InfoWindow({ anchorSkew: true });
      }
      const map = mapRef.current;

      // 기존 오버레이 초기화
      for (const [, grp] of groupsRef.current) {
        grp.polylines.forEach((pl) => pl.setMap(null));
        grp.spotMarkers.forEach((mk) => mk.setMap(null));
        grp.guideMarkers.forEach((mk) => mk.setMap(null));
      }
      groupsRef.current.clear();

      // 코스별로 오버레이 생성
      const bounds = new nmaps.LatLngBounds();
      let hasAny = false;

      for (const { course, bundle, color } of bundles) {
        const polylines = [];
        const spotMarkers = [];
        const guideMarkers = [];

        // 라인(세그먼트들을 같은 색으로)
        const lines = bundleLines(bundle);
        lines.forEach((segCoords) => {
          if (!Array.isArray(segCoords) || segCoords.length < 2) return;
          const path = toLatLngs(nmaps, segCoords);
          path.forEach((p) => {
            bounds.extend(p);
            hasAny = true;
          });

          const pl = new nmaps.Polyline({
            map: visibleCourses.has(course) ? map : null,
            path,
            strokeColor: color,
            strokeOpacity: 0.9,
            strokeWeight: 4,
            clickable: true,
            zIndex: hoverCourse === course ? 150 : 100,
          });

          nmaps.Event.addListener(pl, "click", (e) => {
            infoRef.current.setContent(
              `<div style="padding:6px 8px">
                 <div style="font-weight:700;margin-bottom:4px;">${course}</div>
                 <div>segments: ${
                   bundle?.counts?.segments ?? lines.length
                 }, spots: ${bundle?.counts?.spots ?? "-"}</div>
               </div>`
            );
            infoRef.current.open(map, e.coord);
          });

          polylines.push(pl);
        });

        // 스팟 마커
        if (showSpots) {
          for (const s of bundleSpots(bundle)) {
            if (!Number.isFinite(s.lat) || !Number.isFinite(s.lng)) continue;
            const marker = new nmaps.Marker({
              position: new nmaps.LatLng(s.lat, s.lng),
              map: visibleCourses.has(course) ? map : null,
              icon: {
                content: `<img src="${svgPin(
                  "#e41a1c"
                )}" style="width:24px;height:34px;transform:translate(-12px,-34px);" />`,
                size: new nmaps.Size(24, 34),
                anchor: new nmaps.Point(12, 34),
              },
              title: s.name || "스팟",
              zIndex: 80,
            });
            nmaps.Event.addListener(marker, "click", () => {
              infoRef.current.setContent(
                `<div style="padding:6px 8px">
                   <div style="font-weight:600;margin-bottom:4px;">${
                     s.name ?? "스팟"
                   }</div>
                   <div>코스: ${course}</div>
                 </div>`
              );
              infoRef.current.open(map, marker.getPosition());
            });
            spotMarkers.push(marker);
            bounds.extend(marker.getPosition());
            hasAny = true;
          }
        }

        // 안내 포인트 마커
        if (showGuides) {
          for (const g of bundleGuides(bundle)) {
            if (!Number.isFinite(g.lat) || !Number.isFinite(g.lng)) continue;
            const marker = new nmaps.Marker({
              position: new nmaps.LatLng(g.lat, g.lng),
              map: visibleCourses.has(course) ? map : null,
              icon: {
                content: `<img src="${svgGuide(
                  "#333"
                )}" style="width:24px;height:34px;transform:translate(-12px,-34px);" />`,
                size: new nmaps.Size(24, 34),
                anchor: new nmaps.Point(12, 34),
              },
              title: `[안내] ${g.name ?? ""}`,
              zIndex: 90,
            });
            nmaps.Event.addListener(marker, "click", () => {
              infoRef.current.setContent(
                `<div style="padding:6px 8px">
                   <div style="font-weight:600;margin-bottom:4px;">[안내] ${
                     g.name ?? "-"
                   }</div>
                   <div>코스: ${course}</div>
                   <div>역할: ${g.role ?? "-"}</div>
                 </div>`
              );
              infoRef.current.open(map, marker.getPosition());
            });
            guideMarkers.push(marker);
            bounds.extend(marker.getPosition());
            hasAny = true;
          }
        }

        groupsRef.current.set(course, {
          polylines,
          spotMarkers,
          guideMarkers,
          color,
        });
      }

      if (hasAny && !bounds.isEmpty()) {
        map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
      }
    })();

    return () => {
      // cleanup
      for (const [, grp] of groupsRef.current) {
        grp.polylines.forEach((pl) => pl.setMap(null));
        grp.spotMarkers.forEach((mk) => mk.setMap(null));
        grp.guideMarkers.forEach((mk) => mk.setMap(null));
      }
      groupsRef.current.clear();
    };
  }, [bundles, showSpots, showGuides, visibleCourses, hoverCourse]);

  // 코스 가시성 토글/Only/All
  const toggleCourse = (course) => {
    const next = new Set(visibleCourses);
    next.has(course) ? next.delete(course) : next.add(course);
    setVisibleCourses(next);
  };
  const onlyCourse = (course) => setVisibleCourses(new Set([course]));
  const showAll = () =>
    setVisibleCourses(new Set(bundles.map((b) => b.course)));

  // 전체 Fit
  const fitAll = () => {
    const nmaps = window.naver?.maps;
    if (!nmaps || !mapRef.current) return;
    const map = mapRef.current;
    const bounds = new nmaps.LatLngBounds();
    let hasAny = false;
    for (const course of visibleCourses) {
      const grp = groupsRef.current.get(course);
      if (!grp) continue;
      grp.polylines.forEach((pl) => {
        (pl.getPath().getArray?.() || []).forEach((p) => {
          bounds.extend(p);
          hasAny = true;
        });
      });
      (showSpots ? grp.spotMarkers : []).forEach((mk) => {
        bounds.extend(mk.getPosition());
        hasAny = true;
      });
      (showGuides ? grp.guideMarkers : []).forEach((mk) => {
        bounds.extend(mk.getPosition());
        hasAny = true;
      });
    }
    if (hasAny && !bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    }
  };

  // 사이드 패널용 정렬
  const legendList = useMemo(() => {
    const byCourse = new Map(bundles.map((b) => [b.course, b.color]));
    return (courses || []).map((c) => ({
      course: c.course,
      color: byCourse.get(c.course) || "#999",
      counts: c,
    }));
  }, [courses, bundles]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "grid",
        gridTemplateColumns: "300px 1fr",
      }}
    >
      {/* Side panel */}
      <div
        style={{
          borderRight: "1px solid #eee",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={showAll}
              style={{
                padding: "6px 10px",
                border: "1px solid #ddd",
                background: "#fafafa",
                cursor: "pointer",
              }}
            >
              Show All
            </button>
            <button
              onClick={fitAll}
              style={{
                padding: "6px 10px",
                border: "1px solid #ddd",
                background: "#fafafa",
                cursor: "pointer",
              }}
            >
              Fit to Visible
            </button>
          </div>
          <label
            style={{
              display: "inline-flex",
              gap: 6,
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <input
              type="checkbox"
              checked={showSpots}
              onChange={(e) => setShowSpots(e.target.checked)}
            />
            Spots
          </label>
          <label
            style={{ display: "inline-flex", gap: 6, alignItems: "center" }}
          >
            <input
              type="checkbox"
              checked={showGuides}
              onChange={(e) => setShowGuides(e.target.checked)}
            />
            Guides
          </label>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {legendList.map(({ course, color }) => {
            const on = visibleCourses.has(course);
            return (
              <div
                key={course}
                onMouseEnter={() => setHoverCourse(course)}
                onMouseLeave={() => setHoverCourse(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderBottom: "1px solid #f3f3f3",
                  background:
                    hoverCourse === course ? "#f9f9f9" : "transparent",
                }}
              >
                <span
                  title={course}
                  style={{
                    width: 18,
                    height: 8,
                    borderRadius: 4,
                    background: color,
                    opacity: on ? 1 : 0.25,
                  }}
                />
                <button
                  onClick={() => toggleCourse(course)}
                  style={{
                    flex: 1,
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: on ? "#111" : "#999",
                  }}
                >
                  {course}
                </button>
                <button
                  onClick={() => onlyCourse(course)}
                  style={{
                    border: "1px solid #ddd",
                    padding: "2px 6px",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Only
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
