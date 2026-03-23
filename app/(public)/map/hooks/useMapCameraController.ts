'use client';

import { useCallback, useEffect } from "react";
import type { MutableRefObject } from "react";
import L from "leaflet";
import {
  getAutoRotationForVisibleRoad,
  getNearestRoadAlignedRotation,
  normalizeRotationDeg,
} from "../utils/autoRotation";
import type { MapRoutePoint } from "../types/mapRoute";

const AUTO_ROTATION_SNAP_THRESHOLD_DEG = 15;

type UseMapCameraControllerArgs = {
  mapRef: MutableRefObject<L.Map | null>;
  interactionDisabled: boolean;
  isGestureActive: boolean;
  autoRotation: number;
  routePoints: MapRoutePoint[];
  isTracking: boolean;
  setIsTracking: (value: boolean) => void;
  setAutoRotation: (value: number) => void;
};

export function useMapCameraController({
  mapRef,
  interactionDisabled,
  isGestureActive,
  autoRotation,
  routePoints,
  isTracking,
  setIsTracking,
  setAutoRotation,
}: UseMapCameraControllerArgs) {
  const snapRotationToVisibleRoad = useCallback(
    (center?: L.LatLng, forceNorthUp = false) => {
      if (interactionDisabled || isGestureActive) return;
      const map = mapRef.current;
      if (!map) return;

      if (forceNorthUp) {
        setAutoRotation(0);
        return;
      }

      const targetRotation = getAutoRotationForVisibleRoad({
        center: center ?? map.getCenter(),
        routePoints,
      });
      if (targetRotation === null) {
        setAutoRotation(0);
        return;
      }

      const currentRotation = normalizeRotationDeg(autoRotation);
      const { rotation: snappedRotation, delta } = getNearestRoadAlignedRotation(
        currentRotation,
        targetRotation
      );
      if (Math.abs(delta) > AUTO_ROTATION_SNAP_THRESHOLD_DEG || Math.abs(delta) < 0.1) {
        return;
      }

      setAutoRotation(snappedRotation);
    },
    [autoRotation, interactionDisabled, isGestureActive, mapRef, routePoints, setAutoRotation]
  );

  useEffect(() => {
    if (!isTracking) return;
    const map = mapRef.current;
    if (!map) return;
    snapRotationToVisibleRoad(map.getCenter());
  }, [isTracking, mapRef, snapRotationToVisibleRoad]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMoveEnd = () => {
      if (isGestureActive) return;
      snapRotationToVisibleRoad(map.getCenter());
    };

    const handleDragStart = () => {
      if (isGestureActive) return;
      setIsTracking(false);
    };

    map.on("dragstart", handleDragStart);
    map.on("moveend", handleMoveEnd);
    return () => {
      map.off("dragstart", handleDragStart);
      map.off("moveend", handleMoveEnd);
    };
  }, [isGestureActive, mapRef, setIsTracking, snapRotationToVisibleRoad]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!interactionDisabled) {
      map.dragging.disable();
      map.touchZoom.disable();
    }
  }, [interactionDisabled, mapRef]);

  return {
    snapRotationToVisibleRoad,
  };
}
