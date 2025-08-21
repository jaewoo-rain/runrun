import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MapPage.css";
import AlertArrive from "../components/AlertArrive.jsx";
import RunningState from "../components/RunningState.jsx";
import AlertEnd from "../components/AlertEnd.jsx";
import useWatchLocation from "../hooks/useWatchLocation.js";
import { useSelector, useDispatch } from "react-redux";
import {
  endRun,
  togglePause,
  tick,
  updateLocation,
  addVisitedSpot,
} from "../redux/runningSlice";
import { getDistanceFromLatLonInKm } from "../utils/location.js";

const NAVER_KEY = import.meta.env.VITE_NAVER_CLIENT_ID;

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

function useViewport() {
  const pick = () => ({
    w: Math.round(window.visualViewport?.width ?? window.innerWidth),
    h: Math.round(window.visualViewport?.height ?? window.innerHeight),
  });
  const [vp, setVp] = useState(pick);

  useEffect(() => {
    const onResize = () => setVp(pick());
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);
  return vp;
}

export default function RunningPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    status,
    course,
    elapsedTime,
    distance,
    calories,
    pace,
    userPath,
    visitedSpots,
  } = useSelector((state) => state.running);

  const [mapErr, setMapErr] = useState("");
  const [arrivalAlert, setArrivalAlert] = useState(null);
  const [showEndAlert, setShowEndAlert] = useState(false);

  const { location: currentLocation } = useWatchLocation();

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const polyRef = useRef(null);
  const userPolyRef = useRef(null);
  const markersRef = useRef({ start: null, end: null, me: null, poi: [] });
  const lastFollowPosRef = useRef(null);
  const { w: vpW, h: vpH } = useViewport();

  useEffect(() => {
    if (status === "idle" || !course) {
      navigate("/", { replace: true });
    }
  }, [status, course, navigate]);

  useEffect(() => {
    const body = document.body;
    const prevMargin = body.style.margin;
    const prevPadding = body.style.padding;
    body.style.margin = "0";
    body.style.padding = "0";
    return () => {
      body.style.margin = prevMargin;
      body.style.padding = prevPadding;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map && window.naver?.maps) {
      window.naver.maps.Event.trigger(map, "resize");
    }
  }, [vpW, vpH]);

  useEffect(() => {
    let timer;
    if (status === "running") {
      timer = setInterval(() => {
        dispatch(tick());
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, dispatch]);

  useEffect(() => {
    if (status === "running" && currentLocation) {
      dispatch(updateLocation(currentLocation));
    }
  }, [currentLocation, status, dispatch]);

  useEffect(() => {
    if (!course) return;
    let cancelled = false;

    const draw = async () => {
      try {
        if (!NAVER_KEY) {
          setMapErr("네이버 클라이언트 ID가 없습니다.");
          return;
        }
        const naver = await loadNaverMaps(NAVER_KEY);
        if (cancelled) return;

        const pathCoords = course.path.map(
          (p) => new naver.maps.LatLng(p.lat, p.lng)
        );
        const startLL = pathCoords[0];
        const endLL = pathCoords[pathCoords.length - 1];

        const map = new naver.maps.Map(mapContainerRef.current, {
          center: startLL,
          zoom: 14,
          mapDataControl: false,
        });
        mapRef.current = map;

        if (polyRef.current) polyRef.current.setMap(null);
        Object.values(markersRef.current).forEach((m) => m?.setMap?.(null));
        markersRef.current = { start: null, end: null, me: null, poi: [] };

        polyRef.current = new naver.maps.Polyline({
          path: pathCoords,
          strokeColor: "#111111",
          strokeOpacity: 0.95,
          strokeWeight: 6,
          zIndex: 60,
          map,
        });

        markersRef.current.start = new naver.maps.Marker({
          position: startLL,
          map,
          title: "출발",
        });
        markersRef.current.end = new naver.maps.Marker({
          position: endLL,
          map,
          title: "도착",
        });

        const bounds = new naver.maps.LatLngBounds(startLL, startLL);
        pathCoords.forEach((ll) => bounds.extend(ll));
        map.fitBounds(bounds, { top: 0, right: 0, bottom: 0, left: 0 });
      } catch (e) {
        console.error(e);
        setMapErr(`지도 초기화 실패: ${e.message || e}`);
      }
    };

    draw();
    return () => {
      cancelled = true;
      if (polyRef.current) polyRef.current.setMap(null);
      Object.values(markersRef.current).forEach((m) => m?.setMap?.(null));
      markersRef.current = { start: null, end: null, me: null, poi: [] };
    };
  }, [course]);

  useEffect(() => {
    const naver = window.naver?.maps;
    const map = mapRef.current;
    if (!naver || !map || userPath.length < 2) return;

    const pathCoords = userPath.map((p) => new naver.LatLng(p.lat, p.lng));

    if (!userPolyRef.current) {
      userPolyRef.current = new naver.Polyline({
        path: pathCoords,
        strokeColor: "#FF8C42",
        strokeOpacity: 0.8,
        strokeWeight: 8,
        zIndex: 100,
        map: map,
      });
    } else {
      userPolyRef.current.setPath(pathCoords);
    }
  }, [userPath]);

  useEffect(() => {
    const naver = window.naver?.maps;
    const map = mapRef.current;
    if (!naver || !map) return;

    if (currentLocation?.latitude && currentLocation?.longitude) {
      const { latitude: lat, longitude: lng } = currentLocation;
      const here = new naver.LatLng(lat, lng);

      if (!markersRef.current.me) {
        markersRef.current.me = new naver.Marker({
          position: here,
          map,
          title: "내 위치",
          zIndex: 999,
          icon: {
            url: "/user_location.png",
            size: new naver.Size(36, 36),
            scaledSize: new naver.Size(36, 36),
            origin: new naver.Point(0, 0),
            anchor: new naver.Point(18, 18),
          },
        });
        map.setCenter(here);
        lastFollowPosRef.current = { lat, lng };
      } else {
        markersRef.current.me.setPosition(here);

        const lp = lastFollowPosRef.current;
        if (lp) {
          const movedM =
            getDistanceFromLatLonInKm(lp.lat, lp.lng, lat, lng) * 1000;
          if (movedM > 15) {
            map.panTo(here);
            lastFollowPosRef.current = { lat, lng };
          }
        } else {
          map.panTo(here);
          lastFollowPosRef.current = { lat, lng };
        }
      }

      for (const p of course?.spots || []) {
        if (visitedSpots.includes(p.name) || arrivalAlert) continue;
        const dM = getDistanceFromLatLonInKm(lat, lng, p.lat, p.lng) * 1000;
        if (dM < 50) {
          dispatch(addVisitedSpot(p.name));
          setArrivalAlert(
            <AlertArrive
              spotName={p.name}
              onClose={() => setArrivalAlert(null)}
              onTakePhoto={() => {
                console.log(`사진찍기: ${p.name}`);
                navigate("/camera");
                setArrivalAlert(null);
              }}
            />
          );
          break;
        }
      }
    }
  }, [currentLocation, course, visitedSpots, arrivalAlert, dispatch, navigate]);

  useEffect(() => {
    return () => {
      if (markersRef.current.me) {
        markersRef.current.me.setMap(null);
        markersRef.current.me = null;
      }
    };
  }, []);

  const handleStopClick = () => setShowEndAlert(true);
  const handleCloseEndAlert = () => setShowEndAlert(false);

  const handleEndRunning = () => {
    setShowEndAlert(false);
    navigate("/run-result", {
      state: {
        elapsedTime,
        distance,
        calories,
        pace,
        userPath,
        courseTitle: course?.title,
      },
    });
    dispatch(endRun());
  };

  const handleTogglePause = () => dispatch(togglePause());

  const handleRecenterClick = () => {
    const map = mapRef.current;
    const naver = window.naver?.maps;
    if (map && naver && currentLocation) {
      const { latitude, longitude } = currentLocation;
      const userLocation = new naver.LatLng(latitude, longitude);
      map.panTo(userLocation);
      lastFollowPosRef.current = { lat: latitude, lng: longitude };
    }
  };

  return (
    <div
      className="screen"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: `${vpH}px`,
        overflow: "hidden",
        background: "#0000",
      }}
    >
      <div
        ref={mapContainerRef}
        className="map-container"
        style={{
          position: "absolute",
          inset: 0,
          width: "100vw",
          height: `${vpH}px`,
        }}
      />

      {mapErr && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "rgba(220,0,0,.9)",
            color: "#fff",
            padding: 10,
            borderRadius: 6,
            fontSize: 12,
            zIndex: 300,
          }}
        >
          {mapErr}
        </div>
      )}

      {arrivalAlert}
      {showEndAlert && (
        <AlertEnd onClose={handleCloseEndAlert} onEnd={handleEndRunning} />
      )}

      <button
        onClick={handleRecenterClick}
        style={{
          position: "absolute",
          bottom: "25%",
          right: "20px",
          zIndex: 300,
          background: "white",
          border: "1px solid #eee",
          borderRadius: "50%",
          width: "48px",
          height: "48px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        }}
        aria-label="현재 위치로 이동"
      >
        <img
          src="/location.png"
          alt="현재 위치"
          style={{ width: "24px", height: "24px" }}
        />
      </button>

      <div
        style={{
          position: "absolute",
          width: 300,
          bottom: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 250,
        }}
      >
        <RunningState
          onStopClick={handleStopClick}
          isPaused={status === "paused"}
          togglePause={handleTogglePause}
          elapsedTime={elapsedTime}
          distance={distance}
          calories={calories}
          pace={pace}
        />
      </div>
    </div>
  );
}
