'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, MutableRefObject, TouchEvent as ReactTouchEvent } from "react";
import L from "leaflet";

const TOUCH_ROTATION_ANGLE_THRESHOLD_DEG = 4;
const TOUCH_ROTATION_DISTANCE_THRESHOLD_PX = 8;
const POINTER_PAN_START_THRESHOLD_PX = 3;
const DEBUG_STORAGE_KEY = "nicchyo-map-gesture-debug";

type TouchPoint = { clientX: number; clientY: number };
type GestureMode = "pending" | "rotate" | "zoom";

type TouchGestureState = {
  mode: GestureMode;
  startAngle: number;
  startDistance: number;
  startRotation: number;
  startZoom: number;
  lastMidpoint: { x: number; y: number };
};

type PointerPanState = {
  lastX: number;
  lastY: number;
  hasMoved: boolean;
};

function getTouchDistance(t0: TouchPoint, t1: TouchPoint): number {
  return Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY);
}

function getTouchMidpoint(t0: TouchPoint, t1: TouchPoint): { x: number; y: number } {
  return {
    x: (t0.clientX + t1.clientX) / 2,
    y: (t0.clientY + t1.clientY) / 2,
  };
}

function rotateVector(x: number, y: number, degrees: number): { x: number; y: number } {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function normalizeRotationDeg(value: number): number {
  return ((((value + 180) % 360) + 360) % 360) - 180;
}

function isDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const search = new URLSearchParams(window.location.search);
    return search.get("mapGestureDebug") === "1" || window.localStorage.getItem(DEBUG_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

type UseMapGesturesArgs = {
  mapRef: MutableRefObject<L.Map | null>;
  gestureActiveRef: MutableRefObject<boolean>;
  interactionDisabled: boolean;
  mapRotation: number;
  onPanStart: () => void;
  onRotationChange: (rotation: number) => void;
  onGestureEnd: () => void;
};

export function useMapGestures({
  mapRef,
  gestureActiveRef,
  interactionDisabled,
  mapRotation,
  onPanStart,
  onRotationChange,
  onGestureEnd,
}: UseMapGesturesArgs) {
  const [isTouchGestureActive, setIsTouchGestureActive] = useState(false);
  const debugEnabledRef = useRef(false);
  const touchPanRef = useRef<PointerPanState | null>(null);
  const mousePanRef = useRef<PointerPanState | null>(null);
  const touchGestureRef = useRef<TouchGestureState | null>(null);
  const zoomFrameRef = useRef<number | null>(null);
  const pendingZoomRef = useRef<{ zoom: number; midpoint: { x: number; y: number } } | null>(null);

  useEffect(() => {
    gestureActiveRef.current = isTouchGestureActive;
  }, [gestureActiveRef, isTouchGestureActive]);

  useEffect(() => {
    debugEnabledRef.current = isDebugEnabled();
  }, []);

  const debugLog = useCallback((event: string, data?: Record<string, unknown>) => {
    if (!debugEnabledRef.current) return;
    if (data) {
      console.debug("[map-gesture]", event, data);
      return;
    }
    console.debug("[map-gesture]", event);
  }, []);

  const panMapByScreenDelta = useCallback((dx: number, dy: number) => {
    if (interactionDisabled) return;
    const map = mapRef.current;
    if (!map) return;
    const adjusted = rotateVector(-dx, -dy, -mapRotation);
    map.panBy([adjusted.x, adjusted.y], {
      animate: false,
      noMoveStart: true,
    });
  }, [interactionDisabled, mapRef, mapRotation]);

  const flushPendingZoom = useCallback(() => {
    const map = mapRef.current;
    const pending = pendingZoomRef.current;
    zoomFrameRef.current = null;
    pendingZoomRef.current = null;
    if (!map || !pending) return;
    if (Math.abs(pending.zoom - map.getZoom()) <= 0.001) return;
    map.setZoomAround(L.point(pending.midpoint.x, pending.midpoint.y), pending.zoom, { animate: false });
  }, [mapRef]);

  const scheduleZoom = useCallback((zoom: number, midpoint: { x: number; y: number }) => {
    pendingZoomRef.current = { zoom, midpoint };
    if (zoomFrameRef.current !== null) {
      return;
    }
    zoomFrameRef.current = window.requestAnimationFrame(() => {
      flushPendingZoom();
    });
  }, [flushPendingZoom]);

  const handleTouchStartCapture = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
    if (interactionDisabled) return;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchPanRef.current = {
        lastX: touch.clientX,
        lastY: touch.clientY,
        hasMoved: false,
      };
      touchGestureRef.current = null;
      setIsTouchGestureActive(false);
      return;
    }

    if (e.touches.length !== 2) {
      return;
    }

    const map = mapRef.current;
    if (!map) return;

    touchPanRef.current = null;
    const t0 = e.touches[0];
    const t1 = e.touches[1];
    touchGestureRef.current = {
      mode: "pending",
      startAngle: Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX),
      startDistance: getTouchDistance(t0, t1),
      startRotation: mapRotation,
      startZoom: map.getZoom(),
      lastMidpoint: getTouchMidpoint(t0, t1),
    };
    setIsTouchGestureActive(true);
    debugLog("touch:start", { rotation: mapRotation, zoom: map.getZoom() });
  }, [debugLog, interactionDisabled, mapRef, mapRotation]);

  const handleTouchMoveCapture = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
    if (interactionDisabled) return;

    if (e.touches.length === 1 && touchPanRef.current && !isTouchGestureActive) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchPanRef.current.lastX;
      const dy = touch.clientY - touchPanRef.current.lastY;
      if (!touchPanRef.current.hasMoved && Math.hypot(dx, dy) < POINTER_PAN_START_THRESHOLD_PX) {
        return;
      }
      touchPanRef.current.hasMoved = true;
      touchPanRef.current.lastX = touch.clientX;
      touchPanRef.current.lastY = touch.clientY;
      onPanStart();
      e.preventDefault();
      panMapByScreenDelta(dx, dy);
      return;
    }

    if (e.touches.length !== 2 || !touchGestureRef.current) return;

    const map = mapRef.current;
    if (!map) return;

    const t0 = e.touches[0];
    const t1 = e.touches[1];
    const angle = Math.atan2(t1.clientY - t0.clientY, t1.clientX - t0.clientX);
    const distance = getTouchDistance(t0, t1);
    const midpoint = getTouchMidpoint(t0, t1);
    const gesture = touchGestureRef.current;
    const deltaDeg = ((angle - gesture.startAngle) * 180) / Math.PI;
    const distanceDelta = distance - gesture.startDistance;

    if (gesture.mode === "pending") {
      if (
        Math.abs(deltaDeg) < TOUCH_ROTATION_ANGLE_THRESHOLD_DEG &&
        Math.abs(distanceDelta) < TOUCH_ROTATION_DISTANCE_THRESHOLD_PX
      ) {
        return;
      }

      gesture.mode =
        Math.abs(distanceDelta) >= Math.abs(deltaDeg) * 2 ? "zoom" : "rotate";

      debugLog("touch:mode", {
        mode: gesture.mode,
        deltaDeg: Number(deltaDeg.toFixed(2)),
        distanceDelta: Number(distanceDelta.toFixed(2)),
      });
    }

    e.preventDefault();
    e.stopPropagation();
    onPanStart();

    if (gesture.mode === "rotate") {
      onRotationChange(normalizeRotationDeg(gesture.startRotation + deltaDeg));
      return;
    }

    const scale = distance / gesture.startDistance;
    if (!Number.isFinite(scale) || scale <= 0) {
      return;
    }
    const zoomDelta = Math.log2(scale);
    if (Math.abs(zoomDelta) <= 0.001) {
      return;
    }

    const nextZoom = Math.max(
      map.getMinZoom(),
      Math.min(map.getMaxZoom(), gesture.startZoom + zoomDelta)
    );
    if (Math.abs(nextZoom - map.getZoom()) <= 0.001 && Math.abs(nextZoom - (pendingZoomRef.current?.zoom ?? nextZoom)) <= 0.001) {
      return;
    }
    gesture.lastMidpoint = midpoint;
    scheduleZoom(nextZoom, midpoint);
  }, [
    interactionDisabled,
    isTouchGestureActive,
    mapRef,
    onPanStart,
    onRotationChange,
    panMapByScreenDelta,
    debugLog,
    scheduleZoom,
  ]);

  const handleTouchEndCapture = useCallback((e: ReactTouchEvent<HTMLDivElement>) => {
    if (interactionDisabled) return;

    const activeGesture = touchGestureRef.current;

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchPanRef.current = {
        lastX: touch.clientX,
        lastY: touch.clientY,
        hasMoved: false,
      };
    } else {
      touchPanRef.current = null;
    }

    if (e.touches.length >= 2) {
      return;
    }

    touchGestureRef.current = null;
    if (zoomFrameRef.current !== null) {
      window.cancelAnimationFrame(zoomFrameRef.current);
      flushPendingZoom();
    }
    if (isTouchGestureActive) {
      debugLog("touch:end", { mode: activeGesture?.mode ?? "unknown" });
      onGestureEnd();
    }
    setIsTouchGestureActive(false);
  }, [debugLog, interactionDisabled, isTouchGestureActive, onGestureEnd]);

  const handleMouseDownCapture = useCallback((e: ReactMouseEvent<HTMLDivElement>) => {
    if (interactionDisabled || isTouchGestureActive || e.button !== 0) return;
    mousePanRef.current = {
      lastX: e.clientX,
      lastY: e.clientY,
      hasMoved: false,
    };
  }, [interactionDisabled, isTouchGestureActive]);

  useEffect(() => {
    return () => {
      if (zoomFrameRef.current !== null) {
        window.cancelAnimationFrame(zoomFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!mousePanRef.current || interactionDisabled || isTouchGestureActive) return;

      const dx = e.clientX - mousePanRef.current.lastX;
      const dy = e.clientY - mousePanRef.current.lastY;
      if (!mousePanRef.current.hasMoved && Math.hypot(dx, dy) < POINTER_PAN_START_THRESHOLD_PX) {
        return;
      }

      mousePanRef.current.hasMoved = true;
      mousePanRef.current.lastX = e.clientX;
      mousePanRef.current.lastY = e.clientY;
      onPanStart();
      panMapByScreenDelta(dx, dy);
    };

    const handleUp = () => {
      mousePanRef.current = null;
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [interactionDisabled, isTouchGestureActive, onPanStart, panMapByScreenDelta]);

  return {
    isTouchGestureActive,
    gestureHandlers: {
      onTouchStartCapture: handleTouchStartCapture,
      onTouchMoveCapture: handleTouchMoveCapture,
      onTouchEndCapture: handleTouchEndCapture,
      onTouchCancelCapture: handleTouchEndCapture,
      onMouseDownCapture: handleMouseDownCapture,
    },
  };
}
