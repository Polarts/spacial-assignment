import { useRef, useState, useCallback, useEffect } from 'react';
import type { LogEntry } from '../types';
import { useLog } from '../contexts/LogContext';
import styles from './PlanViewer.module.scss';
import planImage from '../assets/plan.png';

export const PlanViewer = () => {
  const { addLogEntry } = useLog();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Helper function to log actions
  const logAction = useCallback((actionType: LogEntry['actionType'], details: string) => {
    const action: LogEntry = {
      timestamp: new Date(),
      actionType,
      details,
    };
    addLogEntry(action);
  }, [addLogEntry]);

  // Helper function to calculate centered pan position
  const calculateCenterPan = useCallback((currentZoom: number = 1) => {
    if (!containerRef.current || !imageRef.current) return null;

    const containerRect = containerRef.current.getBoundingClientRect();
    const imageWidth = imageRef.current.naturalWidth * currentZoom;
    const imageHeight = imageRef.current.naturalHeight * currentZoom;

    return {
      x: (containerRect.width - imageWidth) / 2,
      y: (containerRect.height - imageHeight) / 2,
    };
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!containerRef.current || !imageRef.current) return;

    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    // Calculate zoom delta (scroll up = zoom in, scroll down = zoom out)
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.25, Math.min(5, zoom * zoomDelta));

    if (newZoom === zoom) return;

    // Adjust pan to keep cursor position fixed
    const imageX = cursorX - pan.x;
    const imageY = cursorY - pan.y;

    const newPan = {
      x: cursorX - (imageX * newZoom) / zoom,
      y: cursorY - (imageY * newZoom) / zoom,
    };

    setZoom(newZoom);
    setPan(newPan);

    logAction(
      zoomDelta > 0.95 ? 'zoom-out' : 'zoom-in',
      `Zoom level: ${(newZoom * 100).toFixed(0)}%`
    );
  }, [zoom, pan, logAction]);

  // Handle pan start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  // Handle pan move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;

    const newPan = {
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    };
    setPan(newPan);
  }, [isPanning, panStart]);

  // Handle pan end
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;

    const newPan = {
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    };

    setIsPanning(false);

    const delta = {
      x: newPan.x - pan.x,
      y: newPan.y - pan.y,
    };

    logAction('pan', `Delta: (${delta.x.toFixed(0)}, ${delta.y.toFixed(0)})`);
  }, [isPanning, panStart, pan, logAction]);

  // Reset zoom and pan
  const handleReset = useCallback(() => {
    const centerPan = calculateCenterPan(1);
    if (!centerPan) return;

    setZoom(1);
    setPan(centerPan);
    logAction('reset', 'Reset zoom and pan');
  }, [calculateCenterPan, logAction]);

  // Handle double click to reset
  const handleDoubleClick = useCallback(() => {
    handleReset();
  }, [handleReset]);

  // Center image on initial load
  useEffect(() => {
    const centerImage = () => {
      const centerPan = calculateCenterPan(1);
      if (centerPan) {
        setPan(centerPan);
      }
    };

    const image = imageRef.current;
    if (image?.complete) {
      centerImage();
    } else {
      image?.addEventListener('load', centerImage);
    }

    return () => {
      image?.removeEventListener('load', centerImage);
    };
  }, [calculateCenterPan]);

  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  return (
    <div
      ref={containerRef}
      className={styles.planViewer}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <img
        ref={imageRef}
        src={planImage}
        alt="Plan"
        className={styles.planImage}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'top left',
          cursor: isPanning ? 'grabbing' : 'grab',
        }}
        draggable={false}
      />
      <div className={styles.viewerControls}>
        <div className={styles.zoomInfo}>
          Zoom: {(zoom * 100).toFixed(0)}%
        </div>
        <div className={styles.controlButtons}>
          <button onClick={handleReset} className={`${styles.controlBtn} ${styles.controlBtnPrimary}`} title="Reset zoom and pan">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
