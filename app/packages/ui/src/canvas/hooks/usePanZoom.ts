import { useCallback, useState } from "react";

export interface UsePanZoomOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
}

export interface UsePanZoomReturn {
  pan: { x: number; y: number };
  zoom: number;
  setPan: (x: number, y: number) => void;
  setZoom: (z: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  handleWheel: (e: React.WheelEvent) => void;
  transformStyle: string;
}

export const usePanZoom = (options: UsePanZoomOptions = {}): UsePanZoomReturn => {
  const { minZoom = 0.25, maxZoom = 2, zoomStep = 0.1 } = options;
  const [pan, setPanState] = useState({ x: 0, y: 0 });
  const [zoom, setZoomState] = useState(1);

  const setPan = useCallback((x: number, y: number): void => {
    setPanState({ x, y });
  }, []);

  const setZoom = useCallback(
    (z: number): void => {
      setZoomState(() => Math.min(maxZoom, Math.max(minZoom, z)));
    },
    [minZoom, maxZoom],
  );

  const zoomIn = useCallback((): void => {
    setZoomState((prev) => Math.min(maxZoom, prev + zoomStep));
  }, [maxZoom, zoomStep]);

  const zoomOut = useCallback((): void => {
    setZoomState((prev) => Math.max(minZoom, prev - zoomStep));
  }, [minZoom, zoomStep]);

  const reset = useCallback((): void => {
    setPanState({ x: 0, y: 0 });
    setZoomState(1);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent): void => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -zoomStep : zoomStep;

      setZoomState((prev) => Math.min(maxZoom, Math.max(minZoom, prev + delta)));
    },
    [minZoom, maxZoom, zoomStep],
  );

  const transformStyle = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

  return {
    pan,
    zoom,
    setPan,
    setZoom,
    zoomIn,
    zoomOut,
    reset,
    handleWheel,
    transformStyle,
  };
};
